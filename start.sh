#!/bin/bash
echo "🚀 Lancement Private Equity Dashboard..."

# Backend setup
cd backend
cp .env.example .env 2>/dev/null || true
npm install --silent
npx prisma generate --silent
npx prisma db push --force-reset
node prisma/seed.js
node src/index.js &
BACKEND_PID=$!
echo "✅ Backend démarré (port 4000)"

# Frontend setup
cd ../frontend
npm install --silent
echo "✅ Frontend en cours de démarrage..."
npm run dev &

echo ""
echo "🎉 Ouvre http://localhost:3000"
echo "   Login: admin@fund.eu / Admin2024!"
echo ""
echo "Appuie sur Ctrl+C pour arrêter"
wait
