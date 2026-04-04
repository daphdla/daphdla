import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface AuthUser {
  id: number; name: string; email: string; role: string; initials: string; lpId?: number
}
interface AuthContextValue {
  user: AuthUser | null; token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const DEMO_USERS: (AuthUser & { password: string })[] = [
  { id: 1, email: 'admin@fund.eu',      password: 'Admin2024!',   name: 'Marie Dubois',   role: 'ADMIN',   initials: 'MD' },
  { id: 2, email: 'analyst@fund.eu',    password: 'Analyst2024!', name: 'Thomas Laurent', role: 'ANALYST', initials: 'TL' },
  { id: 3, email: 'lp@axafund.eu',      password: 'LP2024!',      name: 'Jean Moreau',    role: 'LP',      initials: 'JM', lpId: 1 },
  { id: 4, email: 'lp@sovereign.de',    password: 'LP2024!',      name: 'Hans Mueller',   role: 'LP',      initials: 'HM', lpId: 2 },
]

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const login = useCallback(async (email: string, password: string) => {
    const found = DEMO_USERS.find(u => u.email === email && u.password === password)
    if (!found) throw new Error('Email ou mot de passe incorrect')
    const { password: _, ...u } = found
    setUser(u)
    setToken('demo-token')
  }, [])

  const logout = useCallback(() => { setUser(null); setToken(null) }, [])

  return <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function getMemoryToken() { return null }
