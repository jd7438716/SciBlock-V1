// Package config loads all runtime configuration from environment variables.
//
// Usage:
//
//	cfg := config.Load()
//	pool, _ := db.Connect(cfg.DatabaseURL)
//
// All fields have sensible defaults so the server can start in development
// without a complete .env file.  Production deployments must set at minimum
// DATABASE_URL and JWT_SECRET.
package config

import (
	"log"
	"os"
	"strconv"
)

// Config holds every runtime setting for the Go API server.
// Add new fields here as new features require new environment variables.
type Config struct {
	// Port the HTTP server listens on.
	Port string

	// Env is "development" or "production".
	Env string

	// DatabaseURL is the PostgreSQL connection string (pgx format).
	DatabaseURL string

	// JWTSecret is the HMAC key used to sign and verify JWT tokens.
	JWTSecret string

	// JWTExpiryHours is how many hours a token stays valid.
	JWTExpiryHours int

	// BcryptCost is the work factor for bcrypt password hashing.
	BcryptCost int
}

// Load reads environment variables and returns a Config.
// Missing optional variables fall back to safe defaults.
// Missing required variables (DATABASE_URL, JWT_SECRET) log a fatal error.
func Load() *Config {
	cfg := &Config{
		Port:           getEnv("PORT", "8082"),
		Env:            getEnv("ENV", "development"),
		DatabaseURL:    mustGetEnv("DATABASE_URL"),
		JWTSecret:      mustGetEnv("JWT_SECRET"),
		JWTExpiryHours: getEnvInt("JWT_EXPIRY_HOURS", 168),
		BcryptCost:     getEnvInt("BCRYPT_COST", 12),
	}
	return cfg
}

// IsDevelopment returns true when running in the development environment.
func (c *Config) IsDevelopment() bool {
	return c.Env == "development"
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func mustGetEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("required environment variable %q is not set", key)
	}
	return v
}

func getEnvInt(key string, fallback int) int {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		log.Printf("warning: env %q has invalid int value %q, using default %d", key, v, fallback)
		return fallback
	}
	return n
}
