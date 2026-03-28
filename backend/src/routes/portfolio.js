const express = require('express');
const router = express.Router();
const { portfolio } = require('../data/mockData');

router.get('/', (req, res) => {
  res.json(portfolio);
});

router.get('/:id', (req, res) => {
  const company = portfolio.find(p => p.id === parseInt(req.params.id));
  if (!company) return res.status(404).json({ error: 'Company not found' });
  res.json(company);
});

module.exports = router;
