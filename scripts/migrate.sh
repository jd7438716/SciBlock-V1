#!/usr/bin/env bash
# =============================================================================
# scripts/migrate.sh — Run all database migrations for SciBlock
# =============================================================================
# Usage:
#   sh scripts/migrate.sh              # run all pending migrations
#   sh scripts/migrate.sh drizzle      # Drizzle only (Express tables)
#   sh scripts/migrate.sh goose        # goose only (Go backend tables)
#   sh scripts/migrate.sh goose down   # roll back the last goose migration
#   sh scripts/migrate.sh goose status # show goose migration status
#
# Prerequisites:
#   DATABASE_URL must be set in the environment.
#
# Migration ownership:
#   Drizzle → lib/db/migrations/        (users, students, papers, weekly_reports,
#                                         report_comments, messages)
#   goose   → artifacts/go-api/internal/db/migrations/
#                                        (users.role, scinotes, experiment_records)
# =============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ---------------------------------------------------------------------------
# Colour helpers
# ---------------------------------------------------------------------------
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log()       { echo -e "${YELLOW}[migrate]${NC} $*"; }
log_ok()    { echo -e "${GREEN}[migrate]${NC} $*"; }
log_error() { echo -e "${RED}[migrate]${NC} $*" >&2; }

# ---------------------------------------------------------------------------
# Check DATABASE_URL
# ---------------------------------------------------------------------------
if [ -z "${DATABASE_URL:-}" ]; then
  log_error "DATABASE_URL is not set. Export it before running this script."
  log_error "Example: export DATABASE_URL=postgresql://user:pass@localhost:5432/sciblock"
  exit 1
fi

log "DATABASE_URL is set."

# ---------------------------------------------------------------------------
# Drizzle migration
# ---------------------------------------------------------------------------
run_drizzle() {
  log "Running Drizzle migrations (Express tables)..."

  # Try migration mode first; fall back to push if no migration files exist yet.
  if [ -d "${ROOT_DIR}/lib/db/migrations" ] && [ "$(ls -A "${ROOT_DIR}/lib/db/migrations" 2>/dev/null)" ]; then
    pnpm --filter @workspace/db run migrate 2>/dev/null \
      || pnpm db:push
  else
    log "No Drizzle migration files found — using db:push (schema sync)."
    pnpm db:push
  fi

  log_ok "Drizzle migration complete."
}

# ---------------------------------------------------------------------------
# goose migration
# ---------------------------------------------------------------------------
run_goose() {
  local subcommand="${1:-up}"
  local migrations_dir="${ROOT_DIR}/artifacts/go-api/internal/db/migrations"

  if ! command -v goose &>/dev/null; then
    # Try to find goose in the Go path
    local goose_bin
    goose_bin="$(go env GOPATH)/bin/goose"
    if [ -f "$goose_bin" ]; then
      alias goose="$goose_bin"
    else
      log "goose not found — installing..."
      go install github.com/pressly/goose/v3/cmd/goose@latest
    fi
  fi

  log "Running goose ${subcommand} (Go backend tables)..."
  goose -dir "${migrations_dir}" postgres "${DATABASE_URL}" "${subcommand}"
  log_ok "goose ${subcommand} complete."
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
MODE="${1:-all}"

case "$MODE" in
  drizzle)
    run_drizzle
    ;;
  goose)
    SUBCMD="${2:-up}"
    run_goose "$SUBCMD"
    ;;
  all)
    run_drizzle
    run_goose up
    log_ok "All migrations complete."
    ;;
  *)
    log_error "Unknown mode: ${MODE}. Use: all | drizzle | goose [up|down|status]"
    exit 1
    ;;
esac
