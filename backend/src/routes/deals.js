const express = require('express');
const prisma = require('../db');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// ADMIN + ANALYST only — LPs don't see deal pipeline
router.get('/', requireRole('ADMIN', 'ANALYST'), async (_req, res) => {
  const deals = await prisma.deal.findMany({
    include: { lbo: true, milestones: { orderBy: { date: 'asc' } } },
    orderBy: { contactDate: 'desc' },
  });
  res.json(deals);
});

router.get('/:id', requireRole('ADMIN', 'ANALYST'), async (req, res) => {
  const deal = await prisma.deal.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { lbo: true, milestones: { orderBy: { date: 'asc' } } },
  });
  if (!deal) return res.status(404).json({ error: 'Deal introuvable' });
  res.json(deal);
});

module.exports = router;
