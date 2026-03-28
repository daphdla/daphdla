import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import axios from 'axios'

interface AuthUser {
  id: number
  name: string
  email: string
  role: string
  initials: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Stockage en mémoire (pas localStorage pour éviter les attaques XSS sur le token)
let _memoryToken: string | null = null

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const login = useCallback(async (email: string, password: string) => {
    const res = await axios.post<{ token: string; user: AuthUser }>('/api/auth/login', {
      email,
      password
    })
    _memoryToken = res.data.token
    setToken(res.data.token)
    setUser(res.data.user)
    // Injecte le header Authorization pour tous les appels suivants
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
  }, [])

  const logout = useCallback(() => {
    _memoryToken = null
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
    axios.post('/api/auth/logout').catch(() => {})
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function getMemoryToken() {
  return _memoryToken
}
