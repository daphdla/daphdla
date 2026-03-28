const express = require('express');
const prisma = require('../db');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// All LPs list — ADMIN + ANALYST only
router.get('/', requireRole('ADMIN', 'ANALYST'), async (_req, res) => {
  const lps = await prisma.lP.findMany({ orderBy: { commitment: 'desc' } });
  res.json(lps);
});

// LP user: their own data
router.get('/me', requireRole('LP'), async (req, res) => {
  if (!req.user.lpId) {
    return res.status(404).json({ error: 'Aucun profil LP associé à ce compte' });
  }
  const lp = await prisma.lP.findUnique({ where: { id: req.user.lpId } });
  if (!lp) return res.status(404).json({ error: 'LP introuvable' });
  res.json(lp);
});

router.get('/:id', requireRole('ADMIN', 'ANALYST'), async (req, res) => {
  const lp = await prisma.lP.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!lp) return res.status(404).json({ error: 'LP introuvable' });
  res.json(lp);
});

module.exports = router;
