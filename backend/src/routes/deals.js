const express = require('express');
const router = express.Router();
const { deals } = require('../data/mockData');

router.get('/', (req, res) => {
  res.json(deals);
});

router.get('/:id', (req, res) => {
  const deal = deals.find(d => d.id === parseInt(req.params.id));
  if (!deal) return res.status(404).json({ error: 'Deal not found' });
  res.json(deal);
});

module.exports = router;
