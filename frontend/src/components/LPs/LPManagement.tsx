import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { fetchLPs } from '../../api'
import type { LP } from '../../types'

const fmt = (n: number) => {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(0)}M`
  return `€${n.toLocaleString('fr-FR')}`
}

const typeBadge: Record<string, string> = {
  'Fonds de Pension': 'bg-blue-100 text-blue-700',
  'Family Office': 'bg-violet-100 text-violet-700',
  'Asset Manager': 'bg-amber-100 text-amber-700',
  'Fonds de Fonds': 'bg-emerald-100 text-emerald-700'
}

export default function LPManagement() {
  const [lps, setLPs] = useState<LP[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLPs().then(data => { setLPs(data); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  const totalCommitment = lps.reduce((s, l) => s + l.commitment, 0)
  const totalCalled = lps.reduce((s, l) => s + l.called, 0)
  const totalDistributed = lps.reduce((s, l) => s + l.distributed, 0)
  const totalNAV = lps.reduce((s, l) => s + l.nav, 0)

  const chartData = lps.map(l => ({
    name: l.name.split(' ').slice(0, 2).join(' '),
    Engagé: l.commitment / 1_000_000,
    Appelé: l.called / 1_000_000,
    Distribué: l.distributed / 1_000_000,
    NAV: l.nav / 1_000_000
  }))

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-xs text-slate-500">Total Engagé</p>
          <p className="text-2xl font-bold mt-1">{fmt(totalCommitment)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-500">Capital Appelé</p>
          <p className="text-2xl font-bold mt-1">{fmt(totalCalled)}</p>
          <p className="text-xs text-slate-400 mt-1">{((totalCalled / totalCommitment) * 100).toFixed(0)}% appelé</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-500">Distributions</p>
          <p className="text-2xl font-bold mt-1">{fmt(totalDistributed)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-500">NAV Total LPs</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">{fmt(totalNAV)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Capital par Investisseur (M€)</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} barSize={16}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis unit="M€" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip formatter={(v: number) => [`€${v.toFixed(0)}M`]} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="Engagé" fill="#dbeafe" />
            <Bar dataKey="Appelé" fill="#3b82f6" />
            <Bar dataKey="Distribué" fill="#10b981" />
            <Bar dataKey="NAV" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="table-th">Investisseur</th>
              <th className="table-th">Type</th>
              <th className="table-th">Pays</th>
              <th className="table-th">Engagement</th>
              <th className="table-th">Appelé</th>
              <th className="table-th">Distribué</th>
              <th className="table-th">NAV</th>
              <th className="table-th">DPI</th>
              <th className="table-th">TVPI</th>
              <th className="table-th">IRR Net</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {lps.map(l => (
              <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                <td className="table-td">
                  <p className="font-medium text-slate-800">{l.name}</p>
                </td>
                <td className="table-td">
                  <span className={`badge ${typeBadge[l.type] || 'bg-slate-100 text-slate-600'}`}>{l.type}</span>
                </td>
                <td className="table-td text-xs">{l.country}</td>
                <td className="table-td font-medium">{fmt(l.commitment)}</td>
                <td className="table-td">
                  <div>
                    <span className="font-medium">{fmt(l.called)}</span>
                    <div className="h-1 bg-slate-100 rounded-full mt-1 w-20">
                      <div
                        className="h-1 bg-blue-500 rounded-full"
                        style={{ width: `${(l.called / l.commitment) * 100}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="table-td text-emerald-600 font-medium">{fmt(l.distributed)}</td>
                <td className="table-td font-medium">{fmt(l.nav)}</td>
                <td className="table-td font-semibold">{l.dpi}x</td>
                <td className="table-td font-semibold text-blue-600">{l.tvpi}x</td>
                <td className="table-td font-semibold text-emerald-600">{l.irr}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
