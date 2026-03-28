import { Bell, Search, LogOut } from 'lucide-react'
import { useAuth } from '../../auth'

const titles: Record<string, string> = {
  dashboard: 'Vue d\'ensemble',
  portfolio: 'Portefeuille',
  deals: 'Pipeline Deals',
  lps: 'Investisseurs (LP)',
  metrics: 'KPIs & Métriques'
}

export default function Header({ page }: { page: string }) {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{titles[page]}</h1>
        <p className="text-xs text-slate-500 mt-0.5">Données au 28 Mars 2026</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
        </div>
        <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        {user && (
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">{user.initials}</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-slate-700">{user.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role}</p>
            </div>
            <button
              onClick={logout}
              title="Se déconnecter"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-1"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
