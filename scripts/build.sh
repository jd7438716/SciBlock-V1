#!/usr/bin/env bash
# =============================================================================
# scripts/build.sh — Production build for all SciBlock services
# =============================================================================
# Usage:
#   sh scripts/build.sh           # build everything
#   sh scripts/build.sh web       # build frontend only
#   sh scripts/build.sh api       # build Express only
#   sh scripts/build.sh go        # build Go binary only
#
# Outputs:
#   artifacts/web/dist/public/    → frontend static files (serve with Nginx)
#   artifacts/api-server/dist/    → Express bundle  (node dist/index.cjs)
#   artifacts/go-api/bin/server   → Go binary       (./bin/server)
# =============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ---------------------------------------------------------------------------
# Colour helpers
# ---------------------------------------------------------------------------
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()       { echo -e "${YELLOW}[build]${NC} $*"; }
log_ok()    { echo -e "${GREEN}[build]${NC} $*"; }
log_error() { echo -e "${RED}[build]${NC} $*" >&2; }

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
# Build steps
# ---------------------------------------------------------------------------
build_web() {
  log "Building frontend (React + Vite)..."
  BASE_PATH="${BASE_PATH:-/}" \
    pnpm --filter @workspace/web run build
  log_ok "Frontend built → artifacts/web/dist/public/"
}

build_api() {
  log "Building Express API server (esbuild)..."
  pnpm --filter @workspace/api-server run build
  log_ok "Express built → artifacts/api-server/dist/index.cjs"
}

build_go() {
  local go_dir="${ROOT_DIR}/artifacts/go-api"

  if ! command -v go &>/dev/null; then
    log_error "Go not found — skipping go-api build"
    return
  fi

  if [ ! -f "${go_dir}/go.mod" ]; then
    log_error "go.mod not found — skipping go-api build"
    return
  fi

  log "Building Go API server..."
  mkdir -p "${go_dir}/bin"
  cd "${go_dir}"
  go build -ldflags="-s -w" -o bin/server ./cmd/server
  cd "${ROOT_DIR}"
  log_ok "Go binary built → artifacts/go-api/bin/server"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
SERVICE="${1:-all}"
START_TIME=$(date +%s)

require_node_runtime

log "Starting build (service: ${SERVICE})"

case "$SERVICE" in
  web) build_web ;;
  api) build_api ;;
  go)  build_go  ;;
  all)
    build_web
    build_api
    build_go
    ;;
  *)
    log_error "Unknown service: ${SERVICE}. Use: web | api | go | all"
    exit 1
    ;;
esac

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))
log_ok "Build complete in ${ELAPSED}s"
