import { LayoutDashboard, Briefcase, TrendingUp, Users, PieChart, Building2, type LucideIcon } from 'lucide-react'
import { useAuth } from '../../auth'
import type { Page } from '../../App'

interface SidebarProps {
  current: Page
  onChange: (page: Page) => void
  allowedPages: Page[]
}

const ALL_NAV: { id: Page; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard',    label: 'Vue d\'ensemble',   icon: LayoutDashboard },
  { id: 'portfolio',    label: 'Portefeuille',       icon: Briefcase },
  { id: 'deals',        label: 'Pipeline Deals',     icon: TrendingUp },
  { id: 'lps',          label: 'Investisseurs (LP)', icon: Users },
  { id: 'metrics',      label: 'KPIs & Métriques',   icon: PieChart },
  { id: 'lp-dashboard', label: 'Mon Dashboard',      icon: Building2 },
]

const roleBadge: Record<string, { label: string; color: string }> = {
  ADMIN:   { label: 'Admin',   color: 'bg-blue-700 text-blue-100' },
  ANALYST: { label: 'Analyste', color: 'bg-slate-700 text-slate-200' },
  LP:      { label: 'LP',       color: 'bg-emerald-800 text-emerald-200' },
}

export default function Sidebar({ current, onChange, allowedPages }: SidebarProps) {
  const { user } = useAuth()
  const nav = ALL_NAV.filter(n => allowedPages.includes(n.id))
  const badge = roleBadge[user?.role ?? 'ANALYST']

  return (
    <aside className="w-64 min-h-screen bg-slate-900 flex flex-col">
      <div className="px-6 py-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">PE</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">European Growth</p>
            <p className="text-slate-400 text-xs">Fund III</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`nav-link w-full ${current === id ? 'nav-link-active' : 'nav-link-inactive'}`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      {user && (
        <div className="px-4 py-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-semibold">{user.initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{user.name}</p>
              <span className={`inline-block text-xs px-1.5 py-0.5 rounded font-medium mt-0.5 ${badge.color}`}>
                {badge.label}
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
