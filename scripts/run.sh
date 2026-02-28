#!/usr/bin/env bash
# ─────────────────────────────────────────────
# NVC Chat Talk — Frontend & Backend 실행 스크립트
# Usage: bash scripts/run.sh
# ─────────────────────────────────────────────
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_PORT=8000
FRONTEND_PORT=3000

# ── 색상 ──
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()  { echo -e "${RED}[ERR]${NC}   $*"; }

# ── 포트 점유 프로세스 Kill ──
kill_port() {
  local port=$1
  # Windows: netstat + taskkill
  if command -v taskkill &>/dev/null; then
    local pids
    pids=$(netstat -ano 2>/dev/null | grep "LISTENING" | grep ":${port} " | awk '{print $NF}' | sort -u)
    if [[ -n "$pids" ]]; then
      for pid in $pids; do
        if [[ "$pid" =~ ^[0-9]+$ && "$pid" -ne 0 ]]; then
          warn "포트 ${port} 점유 프로세스 종료 (PID: ${pid})"
          taskkill //F //PID "$pid" 2>/dev/null || true
        fi
      done
    fi
  # Linux/Mac: lsof
  elif command -v lsof &>/dev/null; then
    local pids
    pids=$(lsof -ti :"$port" 2>/dev/null || true)
    if [[ -n "$pids" ]]; then
      for pid in $pids; do
        warn "포트 ${port} 점유 프로세스 종료 (PID: ${pid})"
        kill -9 "$pid" 2>/dev/null || true
      done
    fi
  fi
}

# ── Ctrl+C 시 자식 프로세스 정리 ──
cleanup() {
  echo ""
  warn "종료 중... 자식 프로세스 정리"
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  wait 2>/dev/null
  log "정리 완료"
  exit 0
}
trap cleanup SIGINT SIGTERM

# ── 포트 Kill ──
log "기존 포트 점유 프로세스 확인 중..."
kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT
sleep 1

# ── Backend 실행 (FastAPI + uvicorn) ──
log "Backend 시작 (포트 ${BACKEND_PORT})..."
cd "$ROOT_DIR"
uv run uvicorn backend.main:app --reload --port $BACKEND_PORT &
BACKEND_PID=$!

# ── Frontend 실행 (Next.js) ──
log "Frontend 시작 (포트 ${FRONTEND_PORT})..."
cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

cd "$ROOT_DIR"

echo ""
log "========================================="
log "  Backend  → http://localhost:${BACKEND_PORT}"
log "  Frontend → http://localhost:${FRONTEND_PORT}"
log "  종료: Ctrl+C"
log "========================================="
echo ""

# ── 자식 프로세스 대기 ──
wait
