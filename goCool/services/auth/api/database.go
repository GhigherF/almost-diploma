package main

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

func ConnectDB() (*pgxpool.Pool, error) {
	connString := "postgres://postgres:postgres@127.0.0.1:5433/microblog?sslmode=disable"

	db, err := pgxpool.New(context.Background(), connString)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(context.Background()); err != nil {
		db.Close()
		return nil, err
	}

	return db, nil
}
