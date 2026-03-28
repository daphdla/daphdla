import { jsPDF } from 'jspdf'
import type { Deal } from '../types'
import { calculateLBO } from './lboCalc'

const fmtM = (n: number) => `€${(n / 1_000_000).toFixed(1)}M`
const fmtPct = (n: number) => `${n.toFixed(1)}%`

export function exportDealMemo(deal: Deal): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const MARGIN = 20
  const COL = W - MARGIN * 2
  let y = 0

  // ── Helpers ──────────────────────────────────────────────────────────────
  const line = (dy = 5) => { y += dy }
  const hRule = (color = '#e2e8f0') => {
    doc.setDrawColor(color)
    doc.setLineWidth(0.3)
    doc.line(MARGIN, y, W - MARGIN, y)
    line(4)
  }
  const text = (txt: string, x: number, size = 10, style: 'normal' | 'bold' = 'normal', color = '#1e293b') => {
    doc.setFontSize(size)
    doc.setFont('helvetica', style)
    doc.setTextColor(color)
    doc.text(txt, x, y)
  }
  const wrap = (txt: string, size = 9.5) => {
    doc.setFontSize(size)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor('#334155')
    const lines = doc.splitTextToSize(txt, COL) as string[]
    doc.text(lines, MARGIN, y)
    y += lines.length * (size * 0.4) + 2
  }

  // ── HEADER ────────────────────────────────────────────────────────────────
  y = 18
  doc.setFillColor('#1e3a8a')
  doc.rect(0, 0, W, 14, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor('#ffffff')
  doc.text('European Growth Fund III — Mémo d\'Investissement', MARGIN, 9)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`, W - MARGIN - 48, 9)

  line(2)
  text(deal.company, MARGIN, 18, 'bold', '#1e3a8a')
  line(6)
  text(`${deal.sector}  ·  ${deal.country}  ·  ${deal.stage}  ·  Responsable : ${deal.owner}`, MARGIN, 9, 'normal', '#64748b')
  line(6)
  hRule()

  // ── RÉSUMÉ EXÉCUTIF ───────────────────────────────────────────────────────
  text('RÉSUMÉ EXÉCUTIF', MARGIN, 10, 'bold', '#1e3a8a')
  line(5)
  const kpis = [
    ['Valorisation cible', fmtM(deal.targetValuation)],
    ['Revenue LTM', fmtM(deal.revenue)],
    ['EBITDA LTM', fmtM(deal.ebitda)],
    ['Participation visée', `${deal.targetEquity}%`],
    ['Multiple EV/EBITDA', `${(deal.targetValuation / deal.ebitda).toFixed(1)}x`],
    ['Priorité', deal.priority]
  ]
  const colW = COL / 3
  kpis.forEach(([lbl, val], i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const bx = MARGIN + col * colW
    const by = y + row * 10
    doc.setFillColor('#f8fafc')
    doc.roundedRect(bx, by - 4, colW - 3, 8, 1, 1, 'F')
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor('#64748b')
    doc.text(lbl, bx + 2, by)
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor('#0f172a')
    doc.text(val, bx + 2, by + 5)
  })
  y += 24
  hRule()

  // ── THÈSE ─────────────────────────────────────────────────────────────────
  text('THÈSE D\'INVESTISSEMENT', MARGIN, 10, 'bold', '#1e3a8a')
  line(5)
  wrap(deal.thesis || 'Non renseignée.')
  line(3)
  hRule()

  // ── LBO ───────────────────────────────────────────────────────────────────
  if (deal.lbo) {
    text('ANALYSE LBO SIMPLIFIÉE', MARGIN, 10, 'bold', '#1e3a8a')
    line(5)
    const out = calculateLBO(deal.lbo)
    const rows: [string, string, string, string][] = [
      ['Entrée EV', fmtM(out.entryEV), 'Sortie EV', fmtM(out.exitEV)],
      ['Equity investie', fmtM(out.equityInvested), 'Equity de sortie', fmtM(out.exitEquity)],
      ['Dette initiale', fmtM(out.initialDebt), 'Dette résiduelle', fmtM(out.remainingDebt)],
      ['Multiple entrée', `${deal.lbo.entryMultiple}x EV/EBITDA`, 'Multiple sortie', `${deal.lbo.exitMultiple}x EV/EBITDA`],
      ['Horizon', `${deal.lbo.holdingPeriod} ans`, 'Levier', `${(deal.lbo.leverageRatio * 100).toFixed(0)}%`],
    ]
    rows.forEach(([l1, v1, l2, v2]) => {
      const half = COL / 2
      doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor('#64748b')
      doc.text(l1 + ' :', MARGIN, y)
      doc.setFont('helvetica', 'bold'); doc.setTextColor('#0f172a')
      doc.text(v1, MARGIN + 38, y)
      doc.setFont('helvetica', 'normal'); doc.setTextColor('#64748b')
      doc.text(l2 + ' :', MARGIN + half, y)
      doc.setFont('helvetica', 'bold'); doc.setTextColor('#0f172a')
      doc.text(v2, MARGIN + half + 38, y)
      line(5.5)
    })
    // IRR & MOIC highlight
    doc.setFillColor('#1e3a8a')
    doc.roundedRect(MARGIN, y, 42, 14, 2, 2, 'F')
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor('#93c5fd')
    doc.text('IRR estimé', MARGIN + 4, y + 5)
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor('#ffffff')
    doc.text(fmtPct(out.irr), MARGIN + 4, y + 12)

    doc.setFillColor('#0f766e')
    doc.roundedRect(MARGIN + 46, y, 42, 14, 2, 2, 'F')
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor('#99f6e4')
    doc.text('MOIC estimé', MARGIN + 50, y + 5)
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor('#ffffff')
    doc.text(`${out.moic.toFixed(2)}x`, MARGIN + 50, y + 12)
    line(18)
    hRule()
  }

  // ── TIMELINE ─────────────────────────────────────────────────────────────
  if (deal.milestones && deal.milestones.length > 0) {
    text('TIMELINE DES JALONS', MARGIN, 10, 'bold', '#1e3a8a')
    line(5)
    deal.milestones.forEach(m => {
      const isDone = m.status === 'done'
      const dot = isDone ? '✓' : '○'
      const dateStr = new Date(m.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(isDone ? '#059669' : '#94a3b8')
      doc.text(dot, MARGIN, y)
      doc.setFont('helvetica', isDone ? 'bold' : 'normal')
      doc.setTextColor(isDone ? '#0f172a' : '#64748b')
      doc.text(m.label, MARGIN + 6, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor('#94a3b8')
      doc.text(dateStr, W - MARGIN - 28, y)
      line(5.5)
    })
    hRule()
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.height
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor('#94a3b8')
  doc.text(
    'Document confidentiel — European Growth Fund III — Pour usage interne uniquement',
    W / 2, pageH - 8, { align: 'center' }
  )

  doc.save(`Memo_${deal.company.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`)
}
