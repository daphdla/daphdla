const express = require('express');
const prisma = require('../db');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// Full fund metrics — ADMIN + ANALYST only
router.get('/', requireRole('ADMIN', 'ANALYST'), async (_req, res) => {
  const config = await prisma.fundConfig.findUnique({ where: { id: 1 } });
  if (!config) return res.status(404).json({ error: 'Configuration fonds introuvable' });
  res.json(config);
});

module.exports = router;
