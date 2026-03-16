#!/usr/bin/env bash
# =============================================================================
# scripts/dev.sh — Start all SciBlock services for local development
# =============================================================================
# Usage:
#   sh scripts/dev.sh            # start all services (web + api-server + go-api)
#   sh scripts/dev.sh web        # start frontend only
#   sh scripts/dev.sh api        # start Express only
#   sh scripts/dev.sh go         # start Go API only
#
# Prerequisites:
#   - pnpm installed (https://pnpm.io)
#   - Go 1.22+ installed for the go-api service
#   - DATABASE_URL exported in your shell (or .env sourced)
#
# Environment:
#   Source a .env file before running if you use one:
#     set -a && source .env && set +a && sh scripts/dev.sh
# =============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Automatically load root .env for local development.
if [ -f "${ROOT_DIR}/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/.env"
  set +a
fi

# ---------------------------------------------------------------------------
# Colour helpers
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_web()    { echo -e "${GREEN}[web]${NC}        $*"; }
log_api()    { echo -e "${BLUE}[api-server]${NC} $*"; }
log_go()     { echo -e "${CYAN}[go-api]${NC}     $*"; }
log_info()   { echo -e "${YELLOW}[dev]${NC}        $*"; }
log_error()  { echo -e "${RED}[error]${NC}      $*" >&2; }

require_node_runtime() {
  if ! command -v node &>/dev/null; then
    log_error "Node.js not found. Install Node 20.19+ or 22.12+."
    exit 1
  fi

  local node_version major minor
  node_version="$(node -p \"process.versions.node\" 2>/dev/null || true)"
  if [ -z "${node_version}" ]; then
    log_error "Unable to determine Node.js version. Install Node 20.19+ or 22.12+."
    exit 1
  fi

  IFS='.' read -r major minor _ <<< "${node_version}"
  if [ -z "${major}" ] || [ -z "${minor}" ]; then
    log_error "Unrecognized Node.js version: ${node_version}"
    exit 1
  fi

  if ! {
    [ "${major}" -eq 20 ] && [ "${minor}" -ge 19 ];
  } && ! {
    [ "${major}" -ge 22 ] && { [ "${major}" -gt 22 ] || [ "${minor}" -ge 12 ]; };
  }; then
    log_error "Node.js ${node_version} is too old. Vite 7 and tsx require Node 20.19+ or 22.12+."
    exit 1
  fi
}

# ---------------------------------------------------------------------------
# Cleanup: kill all child processes on exit / Ctrl-C
# ---------------------------------------------------------------------------
PIDS=()

cleanup() {
  log_info "Shutting down all services..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  log_info "Done."
}
trap cleanup EXIT INT TERM

# ---------------------------------------------------------------------------
# Service starters
# ---------------------------------------------------------------------------
start_web() {
  log_web "Starting Vite dev server on :${WEB_PORT:-22333}..."
  PORT="${WEB_PORT:-22333}" BASE_PATH="${BASE_PATH:-/}" \
    pnpm --filter @workspace/web run dev &
  PIDS+=($!)
  log_web "PID $!"
}

start_api() {
  log_api "Starting Express API server on :${EXPRESS_PORT:-8080}..."
  PORT="${EXPRESS_PORT:-8080}" \
    pnpm --filter @workspace/api-server run dev &
  PIDS+=($!)
  log_api "PID $!"
}

start_go() {
  local go_dir="${ROOT_DIR}/artifacts/go-api"

  if ! command -v go &>/dev/null; then
    log_go "Go not found — skipping go-api (install Go 1.22+ to enable)"
    return
  fi

  if [ ! -f "${go_dir}/go.mod" ]; then
    log_go "go.mod not found at ${go_dir} — skipping go-api"
    return
  fi

  log_go "Starting Go API server on :${GO_PORT:-8082}..."
  (
    cd "${go_dir}"
    PORT="${GO_PORT:-8082}" go run ./cmd/server/main.go
  ) &
  PIDS+=($!)
  log_go "PID $!"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
SERVICE="${1:-all}"

require_node_runtime

log_info "SciBlock dev environment"
log_info "Root: ${ROOT_DIR}"
log_info "Service: ${SERVICE}"
echo ""

case "$SERVICE" in
  web)  start_web ;;
  api)  start_api ;;
  go)   start_go  ;;
  all)
    start_api
    start_go
    start_web
    ;;
  *)
    log_error "Unknown service: ${SERVICE}. Use: web | api | go | all"
    exit 1
    ;;
esac

log_info "All services started.  Press Ctrl-C to stop."
wait
