const express = require('express');
const router = express.Router();
const { lps } = require('../data/mockData');

router.get('/', (req, res) => {
  res.json(lps);
});

router.get('/:id', (req, res) => {
  const lp = lps.find(l => l.id === parseInt(req.params.id));
  if (!lp) return res.status(404).json({ error: 'LP not found' });
  res.json(lp);
});

module.exports = router;
