package main

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func getPosts(db *pgxpool.Pool) gin.HandlerFunc {
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

func main() {
	db, err := ConnectDB()
	if err != nil {
		panic(err)
	}

	router := gin.Default()
	router.GET("/hello", getPosts(db))

	router.Run(":3000")
}
