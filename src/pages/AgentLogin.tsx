import { Lock, Eye, EyeOff, ArrowRight, AlertCircle, Building2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAgent } from '../lib/auth'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'

export default function AgentLogin() {
  const { agent, login, loading } = useAgent()
  const navigate = useNavigate()
  const [accessCode, setAccessCode] = useState('')
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && agent) {
      navigate('/agent/dashboard')
    }
  }, [agent, loading, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error: loginError } = await login(accessCode, pin)
    if (loginError) {
      setError(loginError)
      setSubmitting(false)
    } else {
      navigate('/agent/dashboard')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-ink-950 px-4">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-gold-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-gold-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl border border-gold-500/30 bg-gold-500/10">
            <Building2 className="h-8 w-8 text-gold-400" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-gold-300">Bin Taha Associates</h1>
          <p className="mt-1 text-sm text-ink-400">Agent Portal</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-ink-700 bg-ink-800/80 p-8 shadow-2xl backdrop-blur">
          <h2 className="mb-1 font-serif text-xl text-ink-50">Staff Sign In</h2>
          <p className="mb-6 text-sm text-ink-400">Enter your agent access code and PIN</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Access Code */}
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">
                Access Code
              </label>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="BT-FATIMA-101"
                autoComplete="username"
                className="w-full rounded-lg border border-ink-600 bg-ink-900 px-4 py-3 text-ink-50 placeholder-ink-500 outline-none transition focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                required
              />
            </div>

            {/* PIN */}
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">
                PIN / Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-ink-600 bg-ink-900 px-4 py-3 pl-10 pr-10 text-ink-50 placeholder-ink-500 outline-none transition focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300 transition"
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300 animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-gold-500 px-4 py-3 font-medium text-ink-950 transition hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950 border-t-transparent" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Demo codes */}
          <div className="mt-6 rounded-lg border border-ink-700 bg-ink-900/50 p-3">
            <p className="text-xs text-ink-500">
              Demo codes: <span className="text-gold-400">BT-FATIMA-101</span> /{' '}
              <span className="text-gold-400">BT-ALI-104</span> /{' '}
              <span className="text-gold-400">BT-BILAL-107</span>
            </p>
          </div>
        </div>

        {/* Owner link */}
        <p className="mt-6 text-center text-sm text-ink-500">
          Are you the owner?{' '}
          <Link to="/owner" className="font-medium text-gold-400 hover:text-gold-300 transition">
            Access Master Dashboard
          </Link>
        </p>
      </div>
    </div>
  )
}
