#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"

cleanup() {
  kill "$SERVER_PID" "$CLIENT_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

(cd "$ROOT/server" && npm run dev) &
SERVER_PID=$!

(cd "$ROOT/client" && npm run dev) &
CLIENT_PID=$!

wait
