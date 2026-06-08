#!/bin/sh
set -e

cd /app/server

echo "Applying database schema..."
./node_modules/.bin/prisma db push

echo "Starting server..."
exec node dist/index.js
