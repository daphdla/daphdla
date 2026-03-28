import { useState } from 'react'
import { AuthProvider, useAuth } from './auth'
import Sidebar from './components/Layout/Sidebar'
import Header from './components/Layout/Header'
import LoginPage from './components/Auth/LoginPage'
import Overview from './components/Dashboard/Overview'
import PortfolioList from './components/Portfolio/PortfolioList'
import DealPipeline from './components/Deals/DealPipeline'
import LPManagement from './components/LPs/LPManagement'
import LPDashboard from './components/LPs/LPDashboard'
import KPIMetrics from './components/Metrics/KPIMetrics'

export type Page = 'dashboard' | 'portfolio' | 'deals' | 'lps' | 'metrics' | 'lp-dashboard'

// Pages accessible by role
const rolePages: Record<string, Page[]> = {
  ADMIN:   ['dashboard', 'portfolio', 'deals', 'lps', 'metrics'],
  ANALYST: ['dashboard', 'portfolio', 'deals', 'metrics'],
  LP:      ['lp-dashboard'],
}

const pages: Record<Page, React.ComponentType> = {
  'dashboard':    Overview,
  'portfolio':    PortfolioList,
  'deals':        DealPipeline,
  'lps':          LPManagement,
  'metrics':      KPIMetrics,
  'lp-dashboard': LPDashboard,
}

function AppShell() {
  const { user } = useAuth()
  const [page, setPage] = useState<Page>(() =>
    user?.role === 'LP' ? 'lp-dashboard' : 'dashboard'
  )

  if (!user) return <LoginPage />

  const allowed = rolePages[user.role] ?? []
  const safePage = allowed.includes(page) ? page : allowed[0]
  const PageComponent = pages[safePage]

  return (
    <div className="flex min-h-screen">
      <Sidebar current={safePage} onChange={setPage} allowedPages={allowed} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header page={safePage} />
        <main className="flex-1 p-6 overflow-auto">
          <PageComponent />
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
