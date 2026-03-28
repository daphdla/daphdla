require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authMiddleware = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const portfolioRoutes = require('./routes/portfolio');
const dealsRoutes = require('./routes/deals');
const lpsRoutes = require('./routes/lps');
const metricsRoutes = require('./routes/metrics');

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Sécurité HTTP headers ───────────────────────────────────────────────────
app.use(helmet());

// ─── CORS restreint ──────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

// ─── Rate limiting global (toutes routes) ────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120,                  // 120 requêtes par IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes. Réessayez dans un moment.' }
});
app.use(globalLimiter);

app.use(express.json({ limit: '10kb' })); // Limite la taille des payloads

// ─── Routes publiques ─────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);

// ─── Routes protégées (JWT requis) ───────────────────────────────────────────
app.use('/api/portfolio', authMiddleware, portfolioRoutes);
app.use('/api/deals',     authMiddleware, dealsRoutes);
app.use('/api/lps',       authMiddleware, lpsRoutes);
app.use('/api/metrics',   authMiddleware, metricsRoutes);

// ─── Gestion des routes inconnues ────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route introuvable' });
});

// ─── Gestion globale des erreurs ─────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

app.listen(PORT, () => {
  console.log(`PE Dashboard API running on http://localhost:${PORT}`);
  console.log(`CORS allowed origin: ${process.env.ALLOWED_ORIGIN || 'http://localhost:3000'}`);
});
