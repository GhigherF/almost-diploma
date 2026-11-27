package models

import "time"

type Post struct {
	ID             int        `json:"id"`
	UserID         int        `json:"user_id"`
	Body           string     `json:"body"`
	CreatedAt      time.Time  `json:"created_at"`
	Deleted        bool       `json:"deleted"`
	DeletedByAdmin bool       `json:"deleted_by_admin"`
	Username       string     `json:"username"`
	UserAvatar     *string    `json:"user_avatar"`
	Files          []PostFile `json:"files"`
}

type PostFile struct {
	ID           int    `json:"id"`
	PostID       int    `json:"post_id"`
	FileURL      string `json:"file_url"`
	FileType     string `json:"file_type"`
	OriginalName string `json:"original_name"`
	MimeType     string `json:"mime_type"`
	SizeBytes    int    `json:"size_bytes"`
}
