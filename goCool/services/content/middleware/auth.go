package middleware

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID int    `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func parseToken(tokenString string) (*Claims, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return nil, fmt.Errorf("JWT_SECRET не задан")
	}

	claims := &Claims{}

	token, err := jwt.ParseWithClaims(
		tokenString,
		claims,
		func(token *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		},
		jwt.WithValidMethods([]string{"HS256"}),
		jwt.WithExpirationRequired(),
	)
	if err != nil {
		return nil, fmt.Errorf("ошибка разбора JWT: %w", err)
	}

	if !token.Valid {
		return nil, fmt.Errorf("token.Valid = false")
	}

	if claims.UserID <= 0 {
		return nil, fmt.Errorf("некорректный user_id: %d", claims.UserID)
	}

	if claims.Role == "" {
		return nil, fmt.Errorf("role отсутствует")
	}

	return claims, nil
}

func extractToken(context *gin.Context) string {
	log.Printf("METHOD: %s", context.Request.Method)
	log.Printf("AUTH HEADER LENGTH: %d", len(context.GetHeader("Authorization")))
	authHeader := context.GetHeader("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return " "
	}
	return strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
}

func AuthMiddleware() gin.HandlerFunc {
	return func(context *gin.Context) {
		tokenString := extractToken(context)

		if tokenString == "" {
			context.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Токен не предоставдлен",
			})
			return
		}

		claims, err := parseToken(tokenString)
		if err != nil {
			log.Printf("JWT validation failed: %v", err)

			context.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Токен недействителен или истёк",
			})
			return
		}
		context.Set("user_id", claims.UserID)
		context.Set("role", claims.Role)
		context.Next()
	}
}

func OptionalAuthMiddleware() gin.HandlerFunc {
	return func(context *gin.Context) {
		tokenString := extractToken(context)

		if tokenString != "" {
			claims, err := parseToken(tokenString)
			if err == nil {
				context.Set("user_id", claims.UserID)
				context.Set("role", claims.Role)
			}
		}
		context.Next()
	}
}
