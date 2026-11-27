package handlers

import (
	"crypto/sha256"
	"errors"
	"log"
	"net/http"
	"net/mail"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	DB *pgxpool.Pool
}

type RegisterRequest struct {
	Nick     string `json:"nick"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type UserResponse struct {
	ID        int       `json:"id"`
	Nick      string    `json:"nick"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
	AvatarURL *string   `json:"avatar_url,omitempty"`
	Banned    *bool     `json:"banned,omitempty"`
}

type Claims struct {
	UserID int    `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func NewAuthHandler(db *pgxpool.Pool) *AuthHandler {
	return &AuthHandler{DB: db}
}

func validateEmail(email string) bool {
	parsed, err := mail.ParseAddress(email)
	return err == nil && parsed.Address == email
}

func validateNickname(nick string) bool {
	nick = strings.TrimSpace(nick)

	if utf8.RuneCountInString(nick) < 3 ||
		utf8.RuneCountInString(nick) > 30 {
		return false
	}

	matched, _ := regexp.MatchString(`^[a-zA-Zа-яА-ЯёЁ0-9_]+$`, nick)
	return matched
}

func validatePassword(password string) bool {
	return utf8.RuneCountInString(password) >= 8
}

func generateToken(userID int, role string) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	log.Printf("JWT_SECRET загружен: %t, длина: %d", secret != "", len(secret))
	hash := sha256.Sum256([]byte(os.Getenv("JWT_SECRET")))
	log.Printf("JWT_SECRET fingerprint: %x", hash[:])
	if secret == "" {
		return "", errors.New("JWT_SECRET не задан")
	}

	expiresIn := os.Getenv("JWT_EXPIRES_IN")
	if expiresIn == "" {
		expiresIn = "7d"
	}

	var duration time.Duration

	if strings.HasSuffix(expiresIn, "d") {
		days, err := strconv.Atoi(strings.TrimSuffix(expiresIn, "d"))
		if err != nil || days <= 0 {
			return "", errors.New("Некорректный JWT_EXPIRES_IN")
		}
		duration = time.Duration(days) * 24 * time.Hour
	} else {
		var err error
		duration, err = time.ParseDuration(expiresIn)
		if err != nil || duration <= 0 {
			return "", errors.New("Некорректный JWT_EXPIRES_IN")
		}
	}

	now := time.Now()

	claims := Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(duration)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString([]byte(secret))
}

func (h *AuthHandler) Register(c *gin.Context) {
	var request RegisterRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Некорректные данные",
		})
		return
	}

	if strings.TrimSpace(request.Nick) == "" ||
		strings.TrimSpace(request.Email) == "" ||
		request.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "nick, email и password обязательны",
		})
		return
	}

	if !validateEmail(strings.TrimSpace(request.Email)) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Некорректный email",
		})
		return
	}

	if !validateNickname(request.Nick) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Некорректный никнейм. Допустимо от 3 до 30 букв, цифр и символов _",
		})
		return
	}

	if !validatePassword(request.Password) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Пароль должен содержать минимум 8 символов",
		})
		return
	}

	nick := strings.TrimSpace(request.Nick)
	email := strings.ToLower(strings.TrimSpace(request.Email))

	hashedPassword, err := bcrypt.GenerateFromPassword(
		[]byte(request.Password),
		10,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка хеширования пароля",
		})
		return
	}

	var user UserResponse

	err = h.DB.QueryRow(
		c.Request.Context(),
		`INSERT INTO users (nick, email, hashed_password, role)
		 VALUES ($1, $2, $3, 'user')
		 RETURNING id, nick, email, role, created_at`,
		nick,
		email,
		string(hashedPassword),
	).Scan(
		&user.ID,
		&user.Nick,
		&user.Email,
		&user.Role,
		&user.CreatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError

		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			switch pgErr.ConstraintName {
			case "users_nick_key":
				c.JSON(http.StatusConflict, gin.H{
					"error": "Этот никнейм уже занят. Выберите другой.",
				})
				return

			case "users_email_key":
				c.JSON(http.StatusConflict, gin.H{
					"error": "Этот email уже зарегистрирован.",
				})
				return
			}

			c.JSON(http.StatusConflict, gin.H{
				"error": "Такой пользователь уже существует.",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка сервера",
		})
		return
	}

	c.JSON(http.StatusCreated, user)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var request LoginRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Некорректные данные",
		})
		return
	}

	if strings.TrimSpace(request.Email) == "" || request.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "email и password обязательны",
		})
		return
	}

	email := strings.ToLower(strings.TrimSpace(request.Email))

	var user UserResponse
	var hashedPassword string
	var avatarURL *string
	var banned bool

	err := h.DB.QueryRow(
		c.Request.Context(),
		`SELECT id, nick, email, hashed_password, role,
		        avatar_url, banned, created_at
		 FROM users
		 WHERE email = $1`,
		email,
	).Scan(
		&user.ID,
		&user.Nick,
		&user.Email,
		&hashedPassword,
		&user.Role,
		&avatarURL,
		&banned,
		&user.CreatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Неверный email или пароль",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка сервера",
		})
		return
	}

	if err := bcrypt.CompareHashAndPassword(
		[]byte(hashedPassword),
		[]byte(request.Password),
	); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Неверный email или пароль",
		})
		return
	}

	token, err := generateToken(user.ID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка генерации токена",
		})
		return
	}

	user.AvatarURL = avatarURL
	user.Banned = &banned

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}
