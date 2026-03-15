// cmd/server is the entry point for the SciBlock Go API server.
//
// Startup sequence:
//  1. Load configuration from environment variables (config.Load)
//  2. Connect to PostgreSQL via pgx (db.Connect)
//  3. Optionally run goose migrations (only when AUTO_MIGRATE=true)
//  4. Wire up dependencies: repository → service → handler
//  5. Register chi routes and start HTTP server with graceful shutdown
//
// Migration policy:
//   AUTO_MIGRATE=true  → run goose on every startup (dev convenience)
//   AUTO_MIGRATE=false → skip; run explicitly with `make migrate` or scripts/migrate.sh goose
package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"

	"sciblock/go-api/internal/config"
	"sciblock/go-api/internal/db"
	"sciblock/go-api/internal/handler"
	mw "sciblock/go-api/internal/middleware"
	"sciblock/go-api/internal/repository"
	"sciblock/go-api/internal/service"
)

func main() {
	cfg := config.Load()

	// -------------------------------------------------------------------------
	// Database
	// -------------------------------------------------------------------------
	pool, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	defer pool.Close()
	log.Println("database connected")

	// -------------------------------------------------------------------------
	// Migrations (optional — only when AUTO_MIGRATE=true)
	// -------------------------------------------------------------------------
	if cfg.AutoMigrate {
		log.Println("AUTO_MIGRATE=true: running goose migrations...")
		if err := runMigrations(cfg.DatabaseURL); err != nil {
			log.Fatalf("migration failed: %v", err)
		}
		log.Println("migrations complete")
	} else {
		log.Println("AUTO_MIGRATE not set: skipping migrations (run `make migrate` manually)")
	}

	// -------------------------------------------------------------------------
	// Dependency wiring
	// -------------------------------------------------------------------------
	userRepo := repository.NewUserRepository(pool)
	sciNoteRepo := repository.NewSciNoteRepository(pool)
	experimentRepo := repository.NewExperimentRepository(pool)

	authSvc := service.NewAuthService(userRepo, cfg.JWTSecret, cfg.JWTExpiryHours)
	sciNoteSvc := service.NewSciNoteService(sciNoteRepo)
	experimentSvc := service.NewExperimentService(experimentRepo, sciNoteRepo)

	authH := handler.NewAuthHandler(authSvc)
	sciNoteH := handler.NewSciNoteHandler(sciNoteSvc)
	experimentH := handler.NewExperimentHandler(experimentSvc)

	// -------------------------------------------------------------------------
	// Router
	// -------------------------------------------------------------------------
	r := chi.NewRouter()

	r.Use(chiMiddleware.RequestID)
	r.Use(chiMiddleware.RealIP)
	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.Recoverer)
	r.Use(mw.CORS())

	// Health check — public, no auth.
	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, `{"status":"ok","service":"sciblock-go-api"}`)
	})

	r.Route("/api", func(r chi.Router) {
		// Auth — POST /api/auth/login is public.
		r.Post("/auth/login", authH.Login)

		// All routes below require a valid JWT.
		r.Group(func(r chi.Router) {
			r.Use(mw.RequireAuth(cfg.JWTSecret))

			// Auth
			r.Get("/auth/me", authH.Me)
			r.Post("/auth/logout", authH.Logout)

			// SciNotes
			r.Get("/scinotes", sciNoteH.List)
			r.Post("/scinotes", sciNoteH.Create)
			r.Get("/scinotes/{id}", sciNoteH.Get)
			r.Patch("/scinotes/{id}", sciNoteH.Update)
			r.Delete("/scinotes/{id}", sciNoteH.Delete)

			// Experiments nested under SciNote
			r.Get("/scinotes/{id}/experiments", experimentH.ListBySciNote)
			r.Post("/scinotes/{id}/experiments", experimentH.Create)

			// Experiments standalone (by experiment ID)
			r.Get("/experiments/{id}", experimentH.Get)
			r.Patch("/experiments/{id}", experimentH.Update)
			r.Delete("/experiments/{id}", experimentH.SoftDelete)
			r.Patch("/experiments/{id}/restore", experimentH.Restore)
		})
	})

	// -------------------------------------------------------------------------
	// HTTP server with graceful shutdown
	// -------------------------------------------------------------------------
	addr := fmt.Sprintf(":%s", cfg.Port)
	srv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Printf("Go API server listening on %s (env: %s)", addr, cfg.Env)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	<-quit
	log.Println("shutting down...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("forced shutdown: %v", err)
	}
	log.Println("server stopped cleanly")
}

// runMigrations executes all pending goose migrations.
// Uses the standard database/sql driver because goose requires it.
// Migration SQL files are embedded in the db package (internal/db/migrations_embed.go).
func runMigrations(databaseURL string) error {
	sqlDB, err := sql.Open("pgx", databaseURL)
	if err != nil {
		return fmt.Errorf("open sql.DB for migrations: %w", err)
	}
	defer sqlDB.Close()

	goose.SetBaseFS(db.MigrationsFS)
	if err := goose.SetDialect("postgres"); err != nil {
		return fmt.Errorf("set goose dialect: %w", err)
	}
	if err := goose.Up(sqlDB, "migrations"); err != nil {
		return fmt.Errorf("goose up: %w", err)
	}
	return nil
}
