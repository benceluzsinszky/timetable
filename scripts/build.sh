#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"

(cd "$ROOT/server" && npm run build)
(cd "$ROOT/client" && npm run build)
