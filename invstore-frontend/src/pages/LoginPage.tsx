import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Button, Input, Field, Alert } from '../components/ui'
import type { Role } from '../types'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [role, setRole]       = useState<Role>('admin')
  const [username, setUser]   = useState('')
  const [password, setPass]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username || !password) { setError('Completa todos los campos'); return }
    setError(''); setLoading(true)
    try {
      await login(username, password)
      navigate(role === 'admin' ? '/dashboard' : '/solicitar', { replace: true })
    } catch {
      setError('Usuario o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">

          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-800">Inv<span className="text-brand-600">Store</span></span>
          </div>
          <p className="text-xs text-slate-400 mb-6">Sistema de gestión de insumos</p>

          {/* Role tabs */}
          <div className="flex bg-slate-100 rounded-lg p-1 gap-1 mb-5 border border-slate-200">
            {(['admin', 'worker'] as Role[]).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => { setRole(r); setError('') }}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
                  role === r
                    ? 'bg-white text-brand-600 font-semibold shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {r === 'admin' ? 'Administrador' : 'Trabajador'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert type="error">⚠️ {error}</Alert>}

            <Field label="Usuario">
              <Input
                type="text"
                placeholder="Tu usuario"
                value={username}
                onChange={e => setUser(e.target.value)}
                autoFocus
                autoComplete="username"
              />
            </Field>

            <Field label="Contraseña">
              <Input
                type="password"
                placeholder="Tu contraseña"
                value={password}
                onChange={e => setPass(e.target.value)}
                autoComplete="current-password"
              />
            </Field>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full justify-center py-2.5 text-sm mt-1"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>

          {/* Demo hint */}
          <div className="mt-5 px-3 py-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 text-center leading-relaxed">
            <strong className="text-slate-600">Demo</strong> — Admin: <code className="bg-white px-1 py-0.5 rounded border border-slate-200">admin / Admin2024!</code><br />
            Trabajador: <code className="bg-white px-1 py-0.5 rounded border border-slate-200">worker / Worker2024!</code>
          </div>
        </div>
      </div>
    </div>
  )
}
