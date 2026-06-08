#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"

(cd "$ROOT/client" && npm install)
(cd "$ROOT/server" && npm install)
