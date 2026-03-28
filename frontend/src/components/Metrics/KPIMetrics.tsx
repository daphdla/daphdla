import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts'
import { fetchMetrics, fetchPortfolio } from '../../api'
import type { FundMetrics, PortfolioCompany } from '../../types'

const fmt = (n: number) => {
  if (n >= 1_000_000_000) return `€${(n / 1_000_000_000).toFixed(1)}Md`
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(0)}M`
  return `€${n.toLocaleString('fr-FR')}`
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']

export default function KPIMetrics() {
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

  const companyMetrics = portfolio.filter(c => c.status === 'Active').map(c => ({
    name: c.name.split(' ')[0],
    IRR: c.irr,
    MOIC: c.moic,
    Revenue: c.revenue / 1_000_000,
    EBITDA: c.ebitda / 1_000_000
  }))

  return (
    <div className="space-y-5">
      {/* Fund-Level KPIs */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">KPIs Fonds — {metrics.fundName}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'IRR Brut', value: `${metrics.grossIRR}%`, sub: 'Performance brute', color: 'text-emerald-600' },
            { label: 'IRR Net', value: `${metrics.netIRR}%`, sub: 'Après frais & carried', color: 'text-blue-600' },
            { label: 'MOIC Brut', value: `${metrics.grossMOIC}x`, sub: 'Multiple of invested capital', color: 'text-violet-600' },
            { label: 'MOIC Net', value: `${metrics.netMOIC}x`, sub: 'Net des frais', color: 'text-indigo-600' },
            { label: 'DPI', value: `${metrics.dpi}x`, sub: 'Distributions / Paid-in', color: 'text-amber-600' },
            { label: 'TVPI', value: `${metrics.tvpi}x`, sub: 'Total Value / Paid-in', color: 'text-blue-600' },
            { label: 'RVPI', value: `${metrics.rvpi}x`, sub: 'Residual Value / Paid-in', color: 'text-slate-600' },
            { label: 'Vintage', value: `${metrics.vintage}`, sub: 'Année de création', color: 'text-slate-600' }
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* NAV + J-Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Evolution NAV (Tous trimestres)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={metrics.navByQuarter}>
              <defs>
                <linearGradient id="navGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="quarter" tick={{ fontSize: 9, fill: '#94a3b8' }} interval={2} />
              <YAxis tickFormatter={v => `€${v / 1_000_000}M`} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip formatter={(v: number) => [fmt(v), 'NAV']} />
              <Area type="monotone" dataKey="nav" stroke="#3b82f6" strokeWidth={2} fill="url(#navGrad2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">IRR & MOIC par Société</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={companyMetrics} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="IRR" fill="#3b82f6" name="IRR (%)" />
              <Bar dataKey="MOIC" fill="#10b981" name="MOIC (x)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Allocations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Allocation Sectorielle</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={metrics.sectorAllocation}
                cx="50%"
                cy="48%"
                outerRadius={85}
                dataKey="percentage"
                nameKey="sector"
                label={({ name, percentage }) => `${name}: ${percentage}%`}
              >
                {metrics.sectorAllocation.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Allocation Géographique</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={metrics.geoAllocation}
                cx="50%"
                cy="48%"
                innerRadius={50}
                outerRadius={85}
                dataKey="percentage"
                nameKey="country"
                label={({ name, percentage }) => `${name}: ${percentage}%`}
              >
                {metrics.geoAllocation.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue / EBITDA par société */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Revenue & EBITDA par Société (M€)</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={companyMetrics} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
            <YAxis unit="M€" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip formatter={(v: number) => [`€${v.toFixed(1)}M`]} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="Revenue" fill="#3b82f6" name="Revenue (M€)" />
            <Bar dataKey="EBITDA" fill="#10b981" name="EBITDA (M€)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
