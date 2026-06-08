#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"

PRETTIER="$ROOT/client/node_modules/.bin/prettier"
"$PRETTIER" --write "$ROOT/client" "$ROOT/server" --ignore-path "$ROOT/.prettierignore"
