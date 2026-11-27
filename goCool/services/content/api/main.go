package main

import (
	"content/handlers"
	"content/middleware"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load("../.env"); err != nil {
		log.Fatal(".env не загрузился", err)
	}

	db, err := ConnectDB()
	if err != nil {
		panic(err)
	}

	router := gin.Default()

	posts := router.Group("/posts")
	posts.Use(middleware.OptionalAuthMiddleware())
	{
		posts.GET("/", handlers.GetPosts(db))
		posts.GET("/:id", handlers.GetPostById(db))
	}

	protectedPosts := router.Group("/posts")
	protectedPosts.Use(middleware.AuthMiddleware())
	{
		protectedPosts.POST("/", handlers.CreatePost(db))
		//protectedPosts.PUT("/:id", handlers.UpdatePost(db))
		protectedPosts.DELETE("/:id", handlers.DeletePost(db))
	}

	router.Run(":3000")
}
