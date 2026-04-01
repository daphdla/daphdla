#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# PE Platform — Local development setup (one command)
# Usage: bash scripts/setup-local.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}[1/5] Installing dependencies...${NC}"
npm ci

echo -e "${YELLOW}[2/5] Setting up .env...${NC}"
if [ ! -f .env ]; then
  cp .env.example .env
  # Generate a real AUTH_SECRET
  SECRET=$(openssl rand -base64 32)
  sed -i.bak "s|your-secret-here-generate-with-openssl-rand-base64-32|${SECRET}|g" .env
  rm -f .env.bak
  echo "  Created .env with generated AUTH_SECRET"
  echo ""
  echo "  ⚠️  Set DATABASE_URL in .env before continuing"
  echo "  Default: postgresql://postgres:password@localhost:5432/pe_platform"
  echo ""
  read -rp "  Press Enter when DATABASE_URL is configured..."
fi

echo -e "${YELLOW}[3/5] Generating Prisma client...${NC}"
npx prisma generate

echo -e "${YELLOW}[4/5] Pushing database schema...${NC}"
npx prisma db push

echo -e "${YELLOW}[5/5] Seeding demo data...${NC}"
npm run db:seed

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Setup complete! Run: npm run dev${NC}"
echo -e "${GREEN}  Open: http://localhost:3000${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo "  Test accounts:"
echo "  PARTNER → partner@pe-platform.com / password123"
echo "  ANALYST → analyst@pe-platform.com / password123"
echo "  CFO     → cfo@pe-platform.com     / password123"
echo "  LP      → lp@pension-fund.com     / password123"
