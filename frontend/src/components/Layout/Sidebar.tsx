import { LayoutDashboard, Briefcase, TrendingUp, Users, PieChart } from 'lucide-react'

type Page = 'dashboard' | 'portfolio' | 'deals' | 'lps' | 'metrics'

interface SidebarProps {
  current: Page
  onChange: (page: Page) => void
}

const nav: { id: Page; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'dashboard', label: 'Vue d\'ensemble', icon: LayoutDashboard },
  { id: 'portfolio', label: 'Portefeuille', icon: Briefcase },
  { id: 'deals', label: 'Pipeline Deals', icon: TrendingUp },
  { id: 'lps', label: 'Investisseurs (LP)', icon: Users },
  { id: 'metrics', label: 'KPIs & Métriques', icon: PieChart }
]

export default function Sidebar({ current, onChange }: SidebarProps) {
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

      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-medium">MD</span>
          </div>
          <div>
            <p className="text-white text-xs font-medium">Marie Dubois</p>
            <p className="text-slate-400 text-xs">Partner</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
