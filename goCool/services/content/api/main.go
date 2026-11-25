package main

import (
	"content/handlers"

	"github.com/gin-gonic/gin"
)

func main() {
	db, err := ConnectDB()
	if err != nil {
		panic(err)
	}

	router := gin.Default()
	router.GET("/posts", handlers.GetPosts(db))
	router.GET("/posts/:id", handlers.GetPostById(db))
	router.Run(":3000")
}
