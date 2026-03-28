import { useState } from 'react'
import { AuthProvider, useAuth } from './auth'
import Sidebar from './components/Layout/Sidebar'
import Header from './components/Layout/Header'
import LoginPage from './components/Auth/LoginPage'
import Overview from './components/Dashboard/Overview'
import PortfolioList from './components/Portfolio/PortfolioList'
import DealPipeline from './components/Deals/DealPipeline'
import LPManagement from './components/LPs/LPManagement'
import KPIMetrics from './components/Metrics/KPIMetrics'

type Page = 'dashboard' | 'portfolio' | 'deals' | 'lps' | 'metrics'

const pages: Record<Page, React.ComponentType> = {
  dashboard: Overview,
  portfolio: PortfolioList,
  deals: DealPipeline,
  lps: LPManagement,
  metrics: KPIMetrics
}

function AppShell() {
  const { user } = useAuth()
  const [page, setPage] = useState<Page>('dashboard')

  if (!user) return <LoginPage />

  const PageComponent = pages[page]
  return (
    <div className="flex min-h-screen">
      <Sidebar current={page} onChange={setPage} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header page={page} />
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
