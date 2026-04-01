#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# PE Platform — Vercel + Neon setup guide (interactive script)
# Run: bash scripts/setup-vercel-neon.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   PE Platform — Vercel + Neon Setup      ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

# ─── 1. Check CLIs ────────────────────────────────────────────────────────────
echo -e "${YELLOW}[1/5] Checking required CLIs...${NC}"

check_cli() {
  if ! command -v "$1" &>/dev/null; then
    echo "  ✗ $1 not found. Install: $2"
    exit 1
  fi
  echo "  ✓ $1"
}

check_cli "vercel"  "npm i -g vercel"
check_cli "npx"     "npm install -g npx"

# ─── 2. Vercel login + link ───────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[2/5] Vercel setup...${NC}"
vercel login
vercel link

# ─── 3. Generate AUTH_SECRET ──────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[3/5] Generating AUTH_SECRET...${NC}"
AUTH_SECRET=$(openssl rand -base64 32)
echo "  Generated: ${AUTH_SECRET:0:8}..."

# ─── 4. Set Vercel env vars ───────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[4/5] Setting Vercel environment variables...${NC}"
echo ""
echo -e "  ${CYAN}You need a Neon PostgreSQL URL.${NC}"
echo -e "  Get one free at: https://neon.tech"
echo ""
read -rp "  Paste your Neon DATABASE_URL: " DATABASE_URL
read -rp "  Your Vercel app URL (e.g. https://pe-platform.vercel.app): " APP_URL

# Set secrets on all environments
for env in production preview development; do
  echo "$DATABASE_URL"   | vercel env add DATABASE_URL    "$env" --force
  echo "$AUTH_SECRET"    | vercel env add AUTH_SECRET     "$env" --force
  echo "$APP_URL"        | vercel env add AUTH_URL        "$env" --force
  echo "$APP_URL"        | vercel env add NEXT_PUBLIC_APP_URL "$env" --force
done

echo "  ✓ Environment variables set"

# ─── 5. Run migrations on Neon ────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[5/5] Running database migrations...${NC}"
DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy
echo "  ✓ Migrations applied"

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Setup complete!${NC}"
echo -e "${GREEN}  Run: vercel --prod${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo "  Don't forget to seed production data:"
echo "  DATABASE_URL=\"$DATABASE_URL\" npm run db:seed"
