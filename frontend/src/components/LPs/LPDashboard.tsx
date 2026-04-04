import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts'
import { TrendingUp, DollarSign, BarChart3, ArrowUpRight, Building2, Calendar } from 'lucide-react'
import { useAuth } from '../../auth'
import { LPS } from '../../api'
import type { LP } from '../../types'

const fmt = (n: number) => {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`
  return `€${n.toLocaleString('fr-FR')}`
}

// Simulated quarterly capital call history from LP data
function buildCallHistory(lp: LP) {
  const quarters = ['Q4 2019','Q2 2020','Q4 2020','Q2 2021','Q4 2021','Q2 2022','Q4 2022','Q2 2023','Q4 2023','Q2 2024']
  const totalCalled = lp.called
  const steps = quarters.length
  return quarters.map((q, i) => ({
    quarter: q,
    called: Math.round((totalCalled / steps) * (i + 1)),
    distributed: i >= 6 ? Math.round((lp.distributed / (steps - 6)) * (i - 5)) : 0,
  }))
}

// Portfolio companies visible to LPs (subset, no confidential info)
const publicPortfolio = [
  { name: 'TechVision SAS', sector: 'SaaS / B2B', country: 'France', status: 'Active', moic: 2.49 },
  { name: 'MedTech Innovations', sector: 'MedTech', country: 'Germany', status: 'Active', moic: 3.39 },
  { name: 'GreenEnergy Co', sector: 'CleanTech', country: 'Spain', status: 'Active', moic: 1.26 },
  { name: 'FinFlow Technologies', sector: 'FinTech', country: 'Netherlands', status: 'Exited', moic: 5.2 },
  { name: 'DataSphere AI', sector: 'IA', country: 'France', status: 'Active', moic: 1.49 },
  { name: 'LogiChain Europe', sector: 'Logistique', country: 'Belgium', status: 'Active', moic: 1.45 },
]

export default function LPDashboard() {
  const { user } = useAuth()
  const [lp, setLP] = useState<LP | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const found = LPS.find(l => l.id === user?.lpId) || null
    setLP(found)
    setLoading(false)
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !lp) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 text-sm">{error || 'Aucune donnée LP trouvée.'}</p>
      </div>
    )
  }

  const callPct = Math.round((lp.called / lp.commitment) * 100)
  const callHistory = buildCallHistory(lp)
  const uncalled = lp.commitment - lp.called

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-2xl p-6 text-white">
        <p className="text-blue-200 text-sm font-medium mb-1">Bienvenue,</p>
        <h2 className="text-2xl font-bold">{lp.name}</h2>
        <div className="flex items-center gap-4 mt-2 text-blue-200 text-sm flex-wrap">
          <span>{lp.type}</span>
          <span>·</span>
          <span>{lp.country}</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Calendar size={13} /> Vintage {lp.vintage}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Engagement Total', value: fmt(lp.commitment), sub: '100% engagé', icon: DollarSign, color: 'bg-slate-50 text-slate-600' },
          { label: 'Capital Appelé', value: fmt(lp.called), sub: `${callPct}% de l'engagement`, icon: TrendingUp, color: 'bg-blue-50 text-blue-600' },
          { label: 'Distributions Reçues', value: fmt(lp.distributed), sub: `DPI : ${lp.dpi}x`, icon: ArrowUpRight, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'NAV (Valeur Résiduelle)', value: fmt(lp.nav), sub: `TVPI : ${lp.tvpi}x`, icon: BarChart3, color: 'bg-violet-50 text-violet-600' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-600 rounded-xl p-5 text-center text-white">
          <p className="text-blue-200 text-xs font-medium mb-1">IRR Net</p>
          <p className="text-3xl font-bold">{lp.irr}%</p>
          <p className="text-blue-200 text-xs mt-1">Performance nette annualisée</p>
        </div>
        <div className="bg-emerald-600 rounded-xl p-5 text-center text-white">
          <p className="text-emerald-200 text-xs font-medium mb-1">TVPI</p>
          <p className="text-3xl font-bold">{lp.tvpi}x</p>
          <p className="text-emerald-200 text-xs mt-1">Total Value / Paid-In</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-5 text-center text-white">
          <p className="text-slate-400 text-xs font-medium mb-1">Capital Non Appelé</p>
          <p className="text-3xl font-bold">{fmt(uncalled)}</p>
          <p className="text-slate-400 text-xs mt-1">{100 - callPct}% restant à appeler</p>
        </div>
      </div>

      {/* Capital call history chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Historique des Appels de Capital</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={callHistory}>
              <defs>
                <linearGradient id="calledGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tickFormatter={v => `€${v / 1_000_000}M`} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip formatter={(v: number) => [fmt(v)]} />
              <Area type="monotone" dataKey="called" stroke="#3b82f6" strokeWidth={2} fill="url(#calledGrad)" name="Appelé cumulé" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Appels vs Distributions (M€)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={callHistory.slice(-6)} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tickFormatter={v => `€${v / 1_000_000}M`} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip formatter={(v: number) => [fmt(v)]} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="called" fill="#3b82f6" name="Appelé" />
              <Bar dataKey="distributed" fill="#10b981" name="Distribué" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Portfolio overview (public) */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={16} className="text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-700">Sociétés du Portefeuille</h3>
          <span className="ml-auto text-xs text-slate-400">Informations publiques uniquement</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {publicPortfolio.map(c => (
            <div key={c.name} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                {c.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                <p className="text-xs text-slate-400">{c.sector} · {c.country}</p>
              </div>
              <div className="text-right shrink-0">
                <span className={`badge ${c.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {c.status === 'Active' ? 'Actif' : 'Sorti'}
                </span>
                <p className="text-xs font-semibold text-blue-600 mt-0.5">{c.moic}x</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Capital breakdown */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Répartition du Capital</h3>
        <div className="space-y-3">
          {[
            { label: 'Engagement Total', value: lp.commitment, color: 'bg-slate-300', pct: 100 },
            { label: 'Capital Appelé', value: lp.called, color: 'bg-blue-500', pct: (lp.called / lp.commitment) * 100 },
            { label: 'Distributions Reçues', value: lp.distributed, color: 'bg-emerald-500', pct: (lp.distributed / lp.commitment) * 100 },
            { label: 'NAV Résiduelle', value: lp.nav, color: 'bg-violet-500', pct: (lp.nav / lp.commitment) * 100 },
          ].map(({ label, value, color, pct }) => (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">{label}</span>
                <span className="font-semibold text-slate-700">{fmt(value)}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full">
                <div className={`h-2 ${color} rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
