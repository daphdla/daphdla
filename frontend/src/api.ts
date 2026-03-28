import axios from 'axios'
import type { PortfolioCompany, Deal, LP, FundMetrics } from './types'

const BASE = '/api'

export const fetchPortfolio = () =>
  axios.get<PortfolioCompany[]>(`${BASE}/portfolio`).then(r => r.data)

export const fetchDeals = () =>
  axios.get<Deal[]>(`${BASE}/deals`).then(r => r.data)

export const fetchLPs = () =>
  axios.get<LP[]>(`${BASE}/lps`).then(r => r.data)

export const fetchMetrics = () =>
  axios.get<FundMetrics>(`${BASE}/metrics`).then(r => r.data)
