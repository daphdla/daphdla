import { useState, type FormEvent } from 'react'
import { useAuth } from '../../auth'
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react'

const DEMO_ACCOUNTS = [
  { email: 'admin@fund.eu',    password: 'Admin2024!',   role: 'Administrateur' },
  { email: 'analyst@fund.eu',  password: 'Analyst2024!', role: 'Analyste' },
  { email: 'lp@axafund.eu',    password: 'LP2024!',      role: 'LP — AXA' },
  { email: 'lp@sovereign.de',  password: 'LP2024!',      role: 'LP — Sovereign Capital' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Identifiants incorrects'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(acc: typeof DEMO_ACCOUNTS[0]) {
    setEmail(acc.email)
    setPassword(acc.password)
    setError('')
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4">
            <span className="text-white font-bold text-xl">PE</span>
          </div>
          <h1 className="text-white text-2xl font-bold">European Growth Fund III</h1>
          <p className="text-slate-400 text-sm mt-1">Accès sécurisé au dashboard</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h2 className="text-slate-800 text-lg font-semibold mb-6">Connexion</h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="prenom@fund.eu"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion…
                </span>
              ) : 'Se connecter'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium mb-2">Comptes de démonstration (cliquer pour remplir) :</p>
            <div className="space-y-1.5">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className="w-full text-left flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 transition-colors group"
                >
                  <span className="text-xs text-slate-600 font-mono">{acc.email}</span>
                  <span className="text-xs text-slate-400 group-hover:text-blue-600">{acc.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">Connexion sécurisée · JWT · TLS</p>
      </div>
    </div>
  )
}
