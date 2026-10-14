import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase, type StaffMember } from './supabase'
import { hashPin, logActivity, type ActionType } from './watchdog'

interface AgentContextValue {
  agent: StaffMember | null
  loading: boolean
  login: (accessCode: string, pin: string) => Promise<{ error: string | null }>
  logout: () => void
  track: (action: ActionType, target?: string | null, metadata?: Record<string, unknown>) => void
}

const AgentContext = createContext<AgentContextValue | null>(null)

const STORAGE_KEY = 'bt_agent_session'

export function AgentProvider({ children }: { children: ReactNode }) {
  const [agent, setAgent] = useState<StaffMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [loginTime, setLoginTime] = useState<number | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as StaffMember
        setAgent(parsed)
        setLoginTime(Date.now())
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setLoading(false)
  }, [])

  const login = async (accessCode: string, pin: string): Promise<{ error: string | null }> => {
    const code = accessCode.trim().toUpperCase()

    const { data, error } = await supabase
      .from('staff_members')
      .select('*')
      .eq('access_code', code)
      .eq('active', true)
      .maybeSingle()

    if (error || !data) {
      return { error: 'Invalid access code. Please check and try again.' }
    }

    const hashedPin = await hashPin(pin)
    if (hashedPin !== data.pin_hash) {
      return { error: 'Incorrect PIN. Please try again.' }
    }

    const staff = data as StaffMember
    setAgent(staff)
    setLoginTime(Date.now())
    localStorage.setItem(STORAGE_KEY, JSON.stringify(staff))
    logActivity(staff.id, 'login', null, { timestamp: new Date().toISOString() })

    return { error: null }
  }

  const logout = () => {
    if (agent && loginTime) {
      const durationSec = Math.round((Date.now() - loginTime) / 1000)
      logActivity(agent.id, 'logout', null, { session_duration_sec: durationSec })
    }
    setAgent(null)
    setLoginTime(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const track = (action: ActionType, target?: string | null, metadata?: Record<string, unknown>) => {
    if (agent) {
      logActivity(agent.id, action, target ?? null, metadata ?? {})
    }
  }

  return (
    <AgentContext.Provider value={{ agent, loading, login, logout, track }}>
      {children}
    </AgentContext.Provider>
  )
}

export function useAgent(): AgentContextValue {
  const ctx = useContext(AgentContext)
  if (!ctx) throw new Error('useAgent must be used within AgentProvider')
  return ctx
}
