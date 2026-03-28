import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { TrendingUp, Building2, DollarSign, BarChart3, ArrowUpRight } from 'lucide-react'
import { fetchMetrics, fetchPortfolio } from '../../api'
import type { FundMetrics, PortfolioCompany } from '../../types'

const fmt = (n: number) => {
  if (n >= 1_000_000_000) return `€${(n / 1_000_000_000).toFixed(1)}Md`
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(0)}M`
  return `€${n.toLocaleString('fr-FR')}`
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']

export default function Overview() {
  const [metrics, setMetrics] = useState<FundMetrics | null>(null)
  const [portfolio, setPortfolio] = useState<PortfolioCompany[]>([])

  useEffect(() => {
    fetchMetrics().then(setMetrics)
    fetchPortfolio().then(setPortfolio)
  }, [])

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  const navData = metrics.navByQuarter.slice(-8)
  const activeCompanies = portfolio.filter(p => p.status === 'Active').slice(0, 4)

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">NAV Total</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{fmt(metrics.totalNAV)}</p>
              <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                <ArrowUpRight size={12} /> +12.4% ce trimestre
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <DollarSign size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">IRR Net</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.netIRR}%</p>
              <p className="text-xs text-slate-400 mt-1">Brut: {metrics.grossIRR}%</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp size={20} className="text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">MOIC Net</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.netMOIC}x</p>
              <p className="text-xs text-slate-400 mt-1">TVPI: {metrics.tvpi}x</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
              <BarChart3 size={20} className="text-violet-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Sociétés</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.portfolioCompanies}</p>
              <p className="text-xs text-slate-400 mt-1">{metrics.activeInvestments} actives · {metrics.exits} sortie(s)</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Building2 size={20} className="text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* NAV Evolution */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Evolution de la NAV</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={navData}>
              <defs>
                <linearGradient id="navGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tickFormatter={v => `€${v / 1_000_000}M`} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip formatter={(v: number) => [fmt(v), 'NAV']} />
              <Area type="monotone" dataKey="nav" stroke="#3b82f6" strokeWidth={2} fill="url(#navGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Sector Allocation */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Répartition Sectorielle</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={metrics.sectorAllocation}
                cx="50%"
                cy="45%"
                outerRadius={75}
                dataKey="percentage"
                nameKey="sector"
                label={({ percentage }) => `${percentage}%`}
                labelLine={false}
              >
                {metrics.sectorAllocation.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fund Stats + Top Companies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Capital Deployment */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Déploiement du Capital</h2>
          <div className="space-y-4">
            {[
              { label: 'Taille du Fonds', value: fmt(metrics.fundSize), pct: 100 },
              { label: 'Capital Appelé', value: fmt(metrics.totalCalled), pct: (metrics.totalCalled / metrics.fundSize) * 100 },
              { label: 'Capital Distribué', value: fmt(metrics.totalDistributed), pct: (metrics.totalDistributed / metrics.fundSize) * 100 },
              { label: 'NAV', value: fmt(metrics.totalNAV), pct: (metrics.totalNAV / metrics.fundSize) * 100 }
            ].map(({ label, value, pct }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium text-slate-700">{value}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full">
                  <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-slate-400">DPI</p>
              <p className="text-sm font-bold text-slate-900">{metrics.dpi}x</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">TVPI</p>
              <p className="text-sm font-bold text-slate-900">{metrics.tvpi}x</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">RVPI</p>
              <p className="text-sm font-bold text-slate-900">{metrics.rvpi}x</p>
            </div>
          </div>
        </div>

        {/* Top companies */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Participations Actives</h2>
          <div className="space-y-3">
            {activeCompanies.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                    {c.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.sector} · {c.country}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Valorisation</p>
                    <p className="text-sm font-semibold text-slate-800">{fmt(c.currentValuation)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">MOIC</p>
                    <p className="text-sm font-semibold text-emerald-600">{c.moic}x</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">IRR</p>
                    <p className="text-sm font-semibold text-blue-600">{c.irr}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
