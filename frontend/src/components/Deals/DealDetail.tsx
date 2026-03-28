import { useState } from 'react'
import {
  ArrowLeft, FileText, Download, MapPin, User, Calendar,
  TrendingUp, CheckCircle2, Circle, Building2
} from 'lucide-react'
import type { Deal, DealLBO } from '../../types'
import { calculateLBO } from '../../utils/lboCalc'
import { exportDealMemo } from '../../utils/exportPDF'

const fmtM = (n: number) => `€${(n / 1_000_000).toFixed(1)}M`

const typeIcon: Record<string, string> = {
  contact: '📞', legal: '📄', meeting: '🤝', diligence: '🔍', closing: '🔒'
}

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

function LBOPanel({ lbo, onChange }: { lbo: DealLBO; onChange: (l: DealLBO) => void }) {
  const out = calculateLBO(lbo)

  const field = (
    key: keyof DealLBO,
    label: string,
    unit: string,
    min: number,
    max: number,
    step: number
  ) => (
    <div key={key}>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={lbo[key]}
          onChange={e => onChange({ ...lbo, [key]: parseFloat(e.target.value) || 0 })}
          className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-xs text-slate-400 w-8 shrink-0">{unit}</span>
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-700">Modèle LBO Simplifié</h3>
        <p className="text-xs text-slate-400 mt-0.5">Modifiez les inputs — les outputs se calculent en temps réel</p>
      </div>
      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Inputs</p>
          {field('entryEBITDA',   'EBITDA Entrée (€)', '€',   0,  100_000_000, 100_000)}
          {field('exitEBITDA',    'EBITDA Sortie (€)', '€',   0,  200_000_000, 100_000)}
          {field('entryMultiple', 'Multiple Entrée',   'x',   1,  50,           0.1)}
          {field('exitMultiple',  'Multiple Sortie',   'x',   1,  50,           0.1)}
          {field('leverageRatio', 'Levier (0 à 1)',    'ratio', 0, 0.8,          0.01)}
          {field('holdingPeriod', 'Horizon (années)',  'ans', 1,  10,           1)}
        </div>

        {/* Outputs */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Outputs calculés</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'EV Entrée',       value: fmtM(out.entryEV),       color: 'text-slate-800' },
              { label: 'EV Sortie',       value: fmtM(out.exitEV),        color: 'text-slate-800' },
              { label: 'Equity investie', value: fmtM(out.equityInvested), color: 'text-blue-700' },
              { label: 'Equity sortie',   value: fmtM(out.exitEquity),    color: 'text-blue-700' },
              { label: 'Dette initiale',  value: fmtM(out.initialDebt),   color: 'text-slate-600' },
              { label: 'Dette résiduelle',value: fmtM(out.remainingDebt), color: 'text-slate-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-50 rounded-lg px-3 py-2">
                <p className="text-xs text-slate-400">{label}</p>
                <p className={`text-sm font-semibold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* IRR / MOIC highlight */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="rounded-xl bg-blue-600 px-4 py-3 text-center">
              <p className="text-xs text-blue-200">IRR estimé</p>
              <p className="text-2xl font-bold text-white mt-0.5">{out.irr.toFixed(1)}%</p>
            </div>
            <div className="rounded-xl bg-emerald-600 px-4 py-3 text-center">
              <p className="text-xs text-emerald-200">MOIC estimé</p>
              <p className="text-2xl font-bold text-white mt-0.5">{out.moic.toFixed(2)}x</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MilestoneTimeline({ milestones }: { milestones: NonNullable<Deal['milestones']> }) {
  const doneCount = milestones.filter(m => m.status === 'done').length
  const pct = Math.round((doneCount / milestones.length) * 100)

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">Timeline des Jalons</h3>
        <span className="text-xs text-slate-400">{doneCount}/{milestones.length} complétés</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 rounded-full mb-5">
        <div className="h-1.5 bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-slate-100" />

        <div className="space-y-4">
          {milestones.map((m, i) => {
            const isDone = m.status === 'done'
            const isLast = i === milestones.length - 1
            const dateStr = new Date(m.date).toLocaleDateString('fr-FR', {
              day: '2-digit', month: 'short', year: 'numeric'
            })
            return (
              <div key={m.id} className="flex items-start gap-4 relative">
                <div className={`
                  w-7 h-7 rounded-full flex items-center justify-center z-10 shrink-0 text-sm
                  ${isDone ? 'bg-emerald-500' : isLast ? 'bg-blue-100 border-2 border-blue-400' : 'bg-white border-2 border-slate-200'}
                `}>
                  {isDone
                    ? <CheckCircle2 size={14} className="text-white" />
                    : <Circle size={14} className={isLast ? 'text-blue-400' : 'text-slate-300'} />
                  }
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`text-sm font-medium ${isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                      {typeIcon[m.type]} {m.label}
                    </span>
                    <span className={`text-xs ${isDone ? 'text-slate-400' : 'text-blue-500'}`}>
                      {dateStr}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface Props {
  deal: Deal
  onBack: () => void
}

export default function DealDetail({ deal, onBack }: Props) {
  const [lbo, setLbo] = useState<DealLBO>(
    deal.lbo ?? {
      entryEBITDA: deal.ebitda,
      exitEBITDA: deal.ebitda * 2.5,
      entryMultiple: deal.targetValuation / Math.max(deal.ebitda, 1) / 1,
      exitMultiple: 12,
      leverageRatio: 0.40,
      holdingPeriod: 5,
      ebitdaGrowthRate: 20
    }
  )
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      exportDealMemo({ ...deal, lbo })
    } finally {
      setTimeout(() => setExporting(false), 800)
    }
  }

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Retour au pipeline
        </button>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Download size={15} />
          {exporting ? 'Génération…' : 'Exporter Mémo PDF'}
        </button>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-600 shrink-0">
            {deal.company.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">{deal.company}</h2>
              <span className={`badge ${stageColor[deal.stage]}`}>{deal.stage}</span>
              <span className={`badge ${priorityColor[deal.priority]}`}>{deal.priority}</span>
            </div>
            <div className="flex items-center gap-4 mt-2 flex-wrap text-sm text-slate-500">
              <span className="flex items-center gap-1"><Building2 size={13} /> {deal.sector}</span>
              <span className="flex items-center gap-1"><MapPin size={13} /> {deal.country}</span>
              <span className="flex items-center gap-1"><User size={13} /> {deal.owner}</span>
              <span className="flex items-center gap-1"><Calendar size={13} /> Contact : {new Date(deal.contactDate).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Revenue', value: fmtM(deal.revenue) },
              { label: 'EBITDA', value: fmtM(deal.ebitda) },
              { label: 'Val. Cible', value: fmtM(deal.targetValuation) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-lg px-3 py-2">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-sm font-bold text-slate-800">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Thesis */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} className="text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-700">Thèse d'Investissement</h3>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
          {deal.thesis || 'Thèse non renseignée.'}
        </p>
      </div>

      {/* LBO Model */}
      <LBOPanel lbo={lbo} onChange={setLbo} />

      {/* Timeline */}
      {deal.milestones && deal.milestones.length > 0 && (
        <MilestoneTimeline milestones={deal.milestones} />
      )}
    </div>
  )
}
