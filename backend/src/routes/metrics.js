const express = require('express');
const router = express.Router();
const { fundMetrics } = require('../data/mockData');

router.get('/', (req, res) => {
  res.json(fundMetrics);
});

module.exports = router;
