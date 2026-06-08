#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"

echo "==> client typecheck"
(cd "$ROOT/client" && npm run typecheck)

echo "==> client lint"
(cd "$ROOT/client" && npm run lint)

echo "==> server prisma generate"
(cd "$ROOT/server" && npm run db:generate)

echo "==> server typecheck"
(cd "$ROOT/server" && npm run typecheck)

echo "==> server lint"
(cd "$ROOT/server" && npm run lint)

echo "All checks passed."
