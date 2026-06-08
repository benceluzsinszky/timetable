#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"

ENV_FILE="$ROOT/server/.env"
EXPECTED_PORT="5433"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy server/.env.example and try again." >&2
  exit 1
fi

DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -n1 | cut -d= -f2- | tr -d '"')"
if [[ -z "$DATABASE_URL" ]]; then
  echo "DATABASE_URL is not set in $ENV_FILE" >&2
  exit 1
fi

if [[ "$DATABASE_URL" != *":$EXPECTED_PORT/"* ]]; then
  echo "DATABASE_URL in $ENV_FILE should use port $EXPECTED_PORT (docker-compose postgres)." >&2
  echo "Current value: $DATABASE_URL" >&2
  exit 1
fi

if ! docker compose -f "$ROOT/docker-compose.yml" ps --status running --services 2>/dev/null | grep -qx postgres; then
  echo "Postgres is not running. Start it with: docker compose up -d" >&2
  exit 1
fi

(cd "$ROOT/server" && npm run db:seed)
