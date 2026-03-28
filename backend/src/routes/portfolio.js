const express = require('express');
const prisma = require('../db');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// ADMIN + ANALYST only
router.get('/', requireRole('ADMIN', 'ANALYST'), async (_req, res) => {
  const companies = await prisma.portfolioCompany.findMany({ orderBy: { entryDate: 'desc' } });
  res.json(companies);
});

router.get('/:id', requireRole('ADMIN', 'ANALYST'), async (req, res) => {
  const company = await prisma.portfolioCompany.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!company) return res.status(404).json({ error: 'Société introuvable' });
  res.json(company);
});

module.exports = router;
