const express = require('express');
const cors = require('cors');

const portfolioRoutes = require('./routes/portfolio');
const dealsRoutes = require('./routes/deals');
const lpsRoutes = require('./routes/lps');
const metricsRoutes = require('./routes/metrics');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/portfolio', portfolioRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/lps', lpsRoutes);
app.use('/api/metrics', metricsRoutes);

app.listen(PORT, () => {
  console.log(`PE Dashboard API running on http://localhost:${PORT}`);
});
