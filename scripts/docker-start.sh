#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Entrypoint for Docker container
# Runs migrations before starting the Next.js server
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

echo "[startup] Running Prisma migrations..."
npx prisma migrate deploy

echo "[startup] Starting PE Platform..."
exec node server.js
