package handlers

import (
	"content/models"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CreatePostRequest struct {
	Body string `json:"body"`
}

type CreatedPost struct {
	ID             int    `json:"id"`
	UserID         int    `json:"user_id"`
	Body           string `json:"body"`
	Deleted        bool   `json:"deleted"`
	DeletedByAdmin bool   `json:"deleted_by_admin"`
}

func GetPosts(db *pgxpool.Pool) gin.HandlerFunc {
	return func(context *gin.Context) {
		limit, _ := strconv.Atoi(context.DefaultQuery("limit", "20"))
		offset, _ := strconv.Atoi(context.DefaultQuery("offset", "0"))

		if limit < 1 || limit > 100 {
			limit = 20
		}

		if offset < 0 {
			offset = 0
		}

		query := `
            SELECT p.id,
                p.user_id,
                p.body,
                p.created_at,
                p.deleted,
								p.deleted_by_admin,
                u.nick AS username,
                u.avatar_url AS user_avatar
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.deleted = FALSE
            ORDER BY p.created_at DESC
            LIMIT $1 OFFSET $2
        `

		rows, err := db.Query(context.Request.Context(), query, limit, offset)
		if err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
			})
			return
		}
		defer rows.Close()

		posts := make([]models.Post, 0)

		for rows.Next() {
			var post models.Post

			err := rows.Scan(
				&post.ID,
				&post.UserID,
				&post.Body,
				&post.CreatedAt,
				&post.Deleted,
				&post.DeletedByAdmin,
				&post.Username,
				&post.UserAvatar,
			)
			if err != nil {
				context.JSON(http.StatusInternalServerError, gin.H{
					"error": err.Error(),
				})
			}
			posts = append(posts, post)

		}

		if err := rows.Err(); err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
			})
			return
		}

		context.JSON(http.StatusOK, gin.H{
			"posts":   posts,
			"hasMore": len(posts) == limit,
		})
	}
}

func GetPostById(db *pgxpool.Pool) gin.HandlerFunc {
	return func(context *gin.Context) {
		id, err := strconv.Atoi(context.Param("id"))

		if err != nil || id <= 0 {
			context.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid post id",
			})
			return
		}

		query := `
            SELECT
                p.id,
                p.user_id,
                p.body,
                p.created_at,
                p.deleted,
                u.nick AS username,
                u.avatar_url AS user_avatar
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.deleted = FALSE AND p.id = $1
        `

		var post models.Post

		err = db.QueryRow(context.Request.Context(), query, id).Scan(
			&post.ID,
			&post.UserID,
			&post.Body,
			&post.CreatedAt,
			&post.Deleted,
			&post.Username,
			&post.UserAvatar,
		)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				context.JSON(http.StatusNotFound, gin.H{
					"error": "Пост не найден",
				})
				return
			}

			context.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
			})
			return
		}

		context.JSON(http.StatusOK, gin.H{
			"post": post,
		})
	}
}

func CreatePost(db *pgxpool.Pool) gin.HandlerFunc {
	return func(context *gin.Context) {
		userID, exists := context.Get("user_id")
		log.Printf("user_id из JWT: %v, exists: %v", userID, exists)

		var request CreatePostRequest

		if err := context.ShouldBindJSON(&request); err != nil {
			context.JSON(http.StatusBadRequest, gin.H{
				"error": "Некорректные данные",
			})
			return
		}

		if strings.TrimSpace(request.Body) == "" {
			context.JSON(http.StatusBadRequest, gin.H{
				"message": "Текст поста не может быть пустым",
			})
			return
		}

		c := context.Request.Context()
		var banned bool

		err := db.QueryRow(
			c,
			`SELECT banned FROM users WHERE id = $1`,
			userID,
		).Scan(&banned)
		if err != nil {
			if err == pgx.ErrNoRows {
				context.JSON(http.StatusUnauthorized, gin.H{
					"message": "Пользователь не найден",
				})
				return
			}

			context.JSON(http.StatusInternalServerError, gin.H{
				"message": "Ошибка проверки пользователя",
			})
			return
		}

		if banned {
			context.JSON(http.StatusForbidden, gin.H{
				"message": "Ваш аккаунт заблокирован. Вы не можете публиковать посты.",
			})
			return
		}

		tx, err := db.Begin(c)
		if err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{
				"message": "Ошибка создания транзакции",
			})
			return
		}
		defer tx.Rollback(c)

		var post CreatedPost

		err = tx.QueryRow(
			c,
			`INSERT INTO posts (user_id, body)
			 VALUES ($1, $2)
			 RETURNING id, user_id, body, deleted, deleted_by_admin`,
			userID,
			request.Body,
		).Scan(
			&post.ID,
			&post.UserID,
			&post.Body,
			&post.Deleted,
			&post.DeletedByAdmin,
		)
		if err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{
				"message": "Ошибка создания поста",
			})
			return
		}

		if err := tx.Commit(c); err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{
				"message": "Ошибка сохранения поста",
			})
			return
		}

		context.JSON(http.StatusCreated, post)
	}
}

func DeletePost(db *pgxpool.Pool) gin.HandlerFunc {
	return func(context *gin.Context) {
		postID, err := strconv.Atoi(context.Param("id"))

		if err != nil || postID <= 0 {
			context.JSON(http.StatusBadRequest, gin.H{
				"message": "Некорректный ID поста",
			})
			return
		}

		userID := context.GetInt("user_id")
		userRole := context.GetString("role")

		ctx := context.Request.Context()

		tx, err := db.Begin(ctx)
		if err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{
				"message": "Ошибка создания транзакции",
			})
			return
		}
		defer tx.Rollback(ctx)

		var post struct {
			UserID int
			Body   string
		}

		err = tx.QueryRow(
			ctx,
			`SELECT user_id, body
			 FROM posts
			 WHERE id = $1`,
			postID,
		).Scan(&post.UserID, &post.Body)

		if errors.Is(err, pgx.ErrNoRows) {
			context.JSON(http.StatusNotFound, gin.H{
				"message": "Пост не найден",
			})
			return
		}

		if err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{
				"message": "Ошибка получения поста",
			})
			return
		}

		byAdmin := userRole == "admin" && post.UserID != userID

		if userRole != "admin" && post.UserID != userID {
			context.JSON(http.StatusForbidden, gin.H{
				"message": "Нет доступа",
			})
			return
		}

		_, err = tx.Exec(
			ctx,
			`UPDATE posts
			 SET deleted = TRUE, deleted_by_admin = $1
			 WHERE id = $2`,
			byAdmin,
			postID,
		)
		if err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{
				"message": "Ошибка удаления поста",
			})
			return
		}

		if byAdmin {
			runes := []rune(post.Body)
			bodyPreview := post.Body

			if len(runes) > 60 {
				bodyPreview = string(runes[:60]) + "..."
			}

			message := fmt.Sprintf(
				"Ваш пост «%s» был удалён администратором.",
				bodyPreview,
			)

			_, err = tx.Exec(
				ctx,
				`INSERT INTO notifications (user_id, type, message)
				 VALUES ($1, 'post_deleted_by_admin', $2)`,
				post.UserID,
				message,
			)
			if err != nil {
				context.JSON(http.StatusInternalServerError, gin.H{
					"message": "Ошибка создания уведомления",
				})
				return
			}
		}

		if err := tx.Commit(ctx); err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{
				"message": "Ошибка сохранения изменений",
			})
			return
		}

		context.JSON(http.StatusOK, gin.H{
			"ok":               true,
			"deleted_by_admin": byAdmin,
		})
	}
}
