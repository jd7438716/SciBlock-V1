# =============================================================================
# artifacts/go-api/Makefile — Go API server build & dev commands
# =============================================================================
# Usage (from workspace root):
#   cd artifacts/go-api && make dev
#   cd artifacts/go-api && make build
#   cd artifacts/go-api && make migrate
#
# Or from workspace root via npm scripts:
#   pnpm dev:go
#   pnpm build:go
#   pnpm migrate:goose
#
# Environment variables required:
#   DATABASE_URL  — PostgreSQL connection string
#   JWT_SECRET    — HMAC secret for JWT signing
#   PORT          — Port to listen on (default: 8082)
# =============================================================================

.PHONY: dev build migrate migrate-down migrate-status test clean tidy

BINARY_NAME := bin/server
CMD_PATH    := ./cmd/server

# Default port if not set in environment
PORT ?= 8082

## dev: Run the server with live-reload (requires air).
##      Falls back to plain `go run` if air is not installed.
dev:
	@if command -v air > /dev/null 2>&1; then \
		air -c .air.toml; \
	else \
		echo "[go-api] air not found — running with go run (no hot reload)"; \
		go run $(CMD_PATH)/main.go; \
	fi

## build: Compile a production binary to bin/server.
build:
	@mkdir -p bin
	go build -ldflags="-s -w" -o $(BINARY_NAME) $(CMD_PATH)
	@echo "Built → $(BINARY_NAME)"

## run: Run the compiled binary (run `make build` first).
run: build
	./$(BINARY_NAME)

## migrate: Run all pending goose migrations (up).
migrate:
	@if ! command -v goose > /dev/null 2>&1; then \
		echo "[migrate] installing goose..."; \
		go install github.com/pressly/goose/v3/cmd/goose@latest; \
	fi
	goose -dir internal/db/migrations postgres "$(DATABASE_URL)" up

## migrate-down: Roll back the last goose migration.
migrate-down:
	goose -dir internal/db/migrations postgres "$(DATABASE_URL)" down

## migrate-status: Show which migrations have run.
migrate-status:
	goose -dir internal/db/migrations postgres "$(DATABASE_URL)" status

## test: Run all Go tests.
test:
	go test ./... -v -race

## tidy: Tidy go.mod and go.sum.
tidy:
	go mod tidy

## clean: Remove compiled binary.
clean:
	rm -rf bin/

## help: Show this help message.
help:
	@grep -E '^##' Makefile | sed 's/## //'
