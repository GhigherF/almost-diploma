package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func GetPosts(db *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
		offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

		if limit < 1 || limit > 100 {
			limit = 20
		}

		if offset < 0 {
			offset = 0
		}

		query := `
            SELECT
                p.*,
                u.nick AS username,
                u.avatar_url AS user_avatar
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.deleted = FALSE
            ORDER BY p.created_at DESC
            LIMIT $1 OFFSET $2
        `

		rows, err := db.Query(c.Request.Context(), query, limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
			})
			return
		}
		defer rows.Close()

		fields := rows.FieldDescriptions()
		posts := make([]map[string]interface{}, 0)

		for rows.Next() {
			values, err := rows.Values()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": err.Error(),
				})
				return
			}

			post := make(map[string]interface{})

			for i, field := range fields {
				post[string(field.Name)] = values[i]
			}

			posts = append(posts, post)
		}

		if err := rows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
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
                p.*,
                u.nick AS username,
                u.avatar_url AS user_avatar
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.deleted = FALSE	AND p.id = $1    
		`
		row, err := db.Query(context.Request.Context(), query, id)
		if err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
			})
			return
		}
		defer row.Close()

		if !row.Next() {
			context.JSON(http.StatusNotFound, gin.H{
				"error": "Пост не найден",
			})
			return
		}

		values, err := row.Values()
		if err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
			})
			return
		}
		fields := row.FieldDescriptions()
		post := make(map[string]interface{})

		for i, field := range fields {
			post[string(field.Name)] = values[i]
		}

		context.JSON(http.StatusOK, gin.H{
			"post": post,
		})
		return
	}
}
