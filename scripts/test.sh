#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"

echo "==> server tests"
(cd "$ROOT/server" && npm run test)

echo "==> client tests"
(cd "$ROOT/client" && npm run test)

echo "All tests passed."
