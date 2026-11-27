package main

import (
	"context"
	"log"
	"os"
	"time"

	"auth/handlers"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load("../.env"); err != nil {
		log.Println("Файл .env не найден, используются переменные окружения")
	}
	db, err := ConnectDB()
	if err != nil {
		panic(err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := db.Ping(ctx); err != nil {
		log.Fatal("PostgreSQL недоступен: ", err)
	}

	log.Println("Подключение к PostgreSQL успешно")

	authHandler := handlers.NewAuthHandler(db)

	router := gin.Default()

	auth := router.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	log.Println("Auth service запущен на порту", port)

	if err := router.Run(":" + port); err != nil {
		log.Fatal("Ошибка запуска сервера: ", err)
	}
}
