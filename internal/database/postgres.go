package database

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/lib/pq"
	"github.com/pasDamola/schedule-management-system/internal/config"
	"github.com/sirupsen/logrus"
)

type DB struct {
	*sql.DB
}

func NewPostgresDB(cfg *config.DatabaseConfig) (*DB, error) {
	dsn := fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=%s",
		cfg.User, cfg.Password, cfg.Host, cfg.Port, cfg.DBName, cfg.SSLMode,
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %v", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %v", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	logrus.Info("Successfully connected to PostgreSQL database")
	return &DB{db}, nil
}

func (db *DB) RunMigrations() error {
	migrationPath := "internal/database/migrations/001_create_appointments.sql"
	
	migration, err := os.ReadFile(migrationPath)
	if err != nil {
		return fmt.Errorf("failed to read migration file: %v", err)
	}

	if _, err := db.Exec(string(migration)); err != nil {
		return fmt.Errorf("failed to run migration: %v", err)
	}

	logrus.Info("Database migrations completed successfully")
	return nil
}

func (db *DB) Close() error {
	logrus.Info("Closing database connection")
	return db.DB.Close()
}