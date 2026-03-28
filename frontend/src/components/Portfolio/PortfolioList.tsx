import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react'
import { fetchPortfolio } from '../../api'
import type { PortfolioCompany } from '../../types'

const fmt = (n: number) => {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(0)}M`
  return `€${n.toLocaleString('fr-FR')}`
}

const stageBadge: Record<string, string> = {
  'Early Growth': 'bg-violet-100 text-violet-700',
  'Growth': 'bg-blue-100 text-blue-700',
  'Mature': 'bg-slate-100 text-slate-700',
  'Exit': 'bg-emerald-100 text-emerald-700'
}

export default function PortfolioList() {
  const [companies, setCompanies] = useState<PortfolioCompany[]>([])
  const [filter, setFilter] = useState<'All' | 'Active' | 'Exited'>('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPortfolio().then(data => { setCompanies(data); setLoading(false) })
  }, [])

  const filtered = filter === 'All' ? companies : companies.filter(c => c.status === filter)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  const totalNAV = companies.filter(c => c.status === 'Active').reduce((s, c) => s + c.currentValuation, 0)

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-xs text-slate-500">Total participations</p>
          <p className="text-2xl font-bold mt-1">{companies.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-500">Valeur portefeuille actif</p>
          <p className="text-2xl font-bold mt-1">{fmt(totalNAV)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-500">IRR moyen (actif)</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">
            {(companies.filter(c => c.status === 'Active').reduce((s, c) => s + c.irr, 0) / companies.filter(c => c.status === 'Active').length).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['All', 'Active', 'Exited'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f === 'All' ? 'Toutes' : f === 'Active' ? 'Actives' : 'Sorties'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="table-th">Société</th>
              <th className="table-th">Secteur</th>
              <th className="table-th">Entrée</th>
              <th className="table-th">Val. Entrée</th>
              <th className="table-th">Val. Actuelle</th>
              <th className="table-th">Equity</th>
              <th className="table-th">Revenue</th>
              <th className="table-th">EBITDA</th>
              <th className="table-th">MOIC</th>
              <th className="table-th">IRR</th>
              <th className="table-th">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(c => {
              const up = c.currentValuation > c.entryValuation || c.status === 'Exited'
              return (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                        {c.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.country}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td text-xs">{c.sector}</td>
                  <td className="table-td text-xs">{new Date(c.entryDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' })}</td>
                  <td className="table-td font-medium">{fmt(c.entryValuation)}</td>
                  <td className="table-td font-medium">{c.status === 'Exited' ? fmt(c.exitValuation!) : fmt(c.currentValuation)}</td>
                  <td className="table-td">{c.equity}%</td>
                  <td className="table-td">{c.revenue ? fmt(c.revenue) : '—'}</td>
                  <td className="table-td">{c.ebitda ? fmt(c.ebitda) : '—'}</td>
                  <td className="table-td">
                    <span className={`font-semibold ${c.moic >= 2 ? 'text-emerald-600' : c.moic >= 1.5 ? 'text-blue-600' : 'text-amber-600'}`}>
                      {c.moic}x
                    </span>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      {up ? <TrendingUp size={13} className="text-emerald-500" /> : <TrendingDown size={13} className="text-red-500" />}
                      <span className={`font-semibold ${c.irr >= 25 ? 'text-emerald-600' : 'text-blue-600'}`}>{c.irr}%</span>
                    </div>
                  </td>
                  <td className="table-td">
                    <span className={`badge ${c.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {c.status === 'Active' ? 'Actif' : 'Sorti'}
                    </span>
                    <span className={`badge ml-1 ${stageBadge[c.stage] || 'bg-slate-100 text-slate-600'}`}>
                      {c.stage}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
