import { useEffect, useState } from 'react'
import { fetchDeals } from '../../api'
import type { Deal } from '../../types'

const fmt = (n: number) => {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(0)}M`
  return `€${n.toLocaleString('fr-FR')}`
}

const STAGES = ['Screening', 'Initial Contact', 'Due Diligence', 'Term Sheet', 'LOI Signed']

const stageColor: Record<string, string> = {
  'Screening': 'bg-slate-100 text-slate-600',
  'Initial Contact': 'bg-blue-100 text-blue-700',
  'Due Diligence': 'bg-amber-100 text-amber-700',
  'Term Sheet': 'bg-violet-100 text-violet-700',
  'LOI Signed': 'bg-emerald-100 text-emerald-700'
}

const priorityColor: Record<string, string> = {
  'High': 'bg-red-100 text-red-600',
  'Medium': 'bg-amber-100 text-amber-600',
  'Low': 'bg-slate-100 text-slate-500'
}

export default function DealPipeline() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'kanban' | 'table'>('kanban')

  useEffect(() => {
    fetchDeals().then(data => { setDeals(data); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  const totalPipeline = deals.reduce((s, d) => s + d.targetValuation, 0)

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-xs text-slate-500">Deals en pipeline</p>
          <p className="text-2xl font-bold mt-1">{deals.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-500">Valorisation totale pipeline</p>
          <p className="text-2xl font-bold mt-1">{fmt(totalPipeline)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-500">Deals High Priority</p>
          <p className="text-2xl font-bold mt-1 text-red-500">{deals.filter(d => d.priority === 'High').length}</p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('kanban')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            view === 'kanban' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Vue Kanban
        </button>
        <button
          onClick={() => setView('table')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            view === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Vue Tableau
        </button>
      </div>

      {view === 'kanban' ? (
        <div className="grid grid-cols-5 gap-3">
          {STAGES.map(stage => {
            const stageDeals = deals.filter(d => d.stage === stage)
            return (
              <div key={stage} className="bg-slate-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className={`badge ${stageColor[stage]}`}>{stage}</span>
                  <span className="text-xs text-slate-400 font-medium">{stageDeals.length}</span>
                </div>
                <div className="space-y-2">
                  {stageDeals.map(deal => (
                    <div key={deal.id} className="bg-white rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <p className="text-sm font-semibold text-slate-800 leading-tight">{deal.company}</p>
                        <span className={`badge text-xs shrink-0 ${priorityColor[deal.priority]}`}>{deal.priority}</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{deal.sector} · {deal.country}</p>
                      <p className="text-sm font-bold text-blue-600">{fmt(deal.targetValuation)}</p>
                      <p className="text-xs text-slate-400 mt-1">{deal.equity}% equity cible</p>
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-500">Owner: {deal.owner}</p>
                      </div>
                    </div>
                  ))}
                  {stageDeals.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">Aucun deal</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="table-th">Société</th>
                <th className="table-th">Secteur</th>
                <th className="table-th">Valorisation</th>
                <th className="table-th">Revenue</th>
                <th className="table-th">EBITDA</th>
                <th className="table-th">Equity Cible</th>
                <th className="table-th">Etape</th>
                <th className="table-th">Priorité</th>
                <th className="table-th">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {deals.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-td">
                    <p className="font-medium text-slate-800">{d.company}</p>
                    <p className="text-xs text-slate-400">{d.country}</p>
                  </td>
                  <td className="table-td text-xs">{d.sector}</td>
                  <td className="table-td font-medium">{fmt(d.targetValuation)}</td>
                  <td className="table-td">{fmt(d.revenue)}</td>
                  <td className="table-td">{fmt(d.ebitda)}</td>
                  <td className="table-td">{d.targetEquity}%</td>
                  <td className="table-td">
                    <span className={`badge ${stageColor[d.stage]}`}>{d.stage}</span>
                  </td>
                  <td className="table-td">
                    <span className={`badge ${priorityColor[d.priority]}`}>{d.priority}</span>
                  </td>
                  <td className="table-td text-xs">{d.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
