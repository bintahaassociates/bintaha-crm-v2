import {
  Building2,
  Users,
  TrendingUp,
  Activity,
  Home,
  Phone,
  MessageCircle,
  Plus,
  Search,
  Eye,
  X,
  ChevronRight,
  Crown,
  Clock,
  Filter,
  ArrowLeft,
} from 'lucide-react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase, type StaffMember, type Property, type ClientLead, type Deal, type StaffActivity } from '../lib/supabase'
import { formatPKR, timeAgo, STATUS_COLORS, ACTION_LABELS, ACTION_ICONS } from '../lib/utils'

type Tab = 'overview' | 'staff' | 'watchdog' | 'inventory' | 'leads' | 'deals'

export default function OwnerDashboard() {
  const [tab, setTab] = useState<Tab>('overview')
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [activities, setActivities] = useState<(StaffActivity & { staff_members: Pick<StaffMember, 'name' | 'role' | 'access_code'> | null })[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [leads, setLeads] = useState<(ClientLead & { staff_members: Pick<StaffMember, 'name'> | null })[]>([])
  const [deals, setDeals] = useState<(Deal & { staff_members: Pick<StaffMember, 'name'> | null })[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activityFilter, setActivityFilter] = useState('all')
  const [staffFilter, setStaffFilter] = useState('all')

  const fetchAll = useCallback(async () => {
    const [staffRes, actRes, propsRes, leadsRes, dealsRes] = await Promise.all([
      supabase.from('staff_members').select('*').order('name'),
      supabase
        .from('staff_activities')
        .select('*, staff_members(name, role, access_code)')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase.from('properties').select('*').order('created_at', { ascending: false }),
      supabase.from('client_leads').select('*, staff_members(name)').order('created_at', { ascending: false }),
      supabase.from('deals').select('*, staff_members(name)').order('created_at', { ascending: false }),
    ])
    if (staffRes.data) setStaff(staffRes.data as StaffMember[])
    if (actRes.data) setActivities(actRes.data as typeof activities)
    if (propsRes.data) setProperties(propsRes.data as Property[])
    if (leadsRes.data) setLeads(leadsRes.data as typeof leads)
    if (dealsRes.data) setDeals(dealsRes.data as typeof deals)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 5000)
    return () => clearInterval(interval)
  }, [fetchAll])

  // Stats
  const totalRevenue = deals.filter((d) => d.status === 'confirmed').reduce((s, d) => s + d.amount, 0)
  const monthRevenue = deals
    .filter((d) => {
      const dd = new Date(d.created_at)
      const now = new Date()
      return dd.getMonth() === now.getMonth() && dd.getFullYear() === now.getFullYear() && d.status === 'confirmed'
    })
    .reduce((s, d) => s + d.amount, 0)
  const availableCount = properties.filter((p) => p.status === 'available').length
  const reservedCount = properties.filter((p) => p.status === 'reserved').length
  const soldCount = properties.filter((p) => p.status === 'sold').length
  const activeLeads = leads.filter((l) => !['won', 'lost'].includes(l.status)).length

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      const matchesAction = activityFilter === 'all' || a.action_type === activityFilter
      const matchesStaff = staffFilter === 'all' || a.staff_id === staffFilter
      const matchesSearch =
        !searchQuery ||
        (a.staff_members?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        a.action_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.target_entity?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      return matchesAction && matchesStaff && matchesSearch
    })
  }, [activities, activityFilter, staffFilter, searchQuery])

  // Per-agent stats for staff tab
  const agentStats = useMemo(() => {
    return staff.map((s) => {
      const sLeads = leads.filter((l) => l.agent_id === s.id)
      const sDeals = deals.filter((d) => d.agent_id === s.id)
      const sRevenue = sDeals.filter((d) => d.status === 'confirmed').reduce((sum, d) => sum + d.amount, 0)
      const sActivities = activities.filter((a) => a.staff_id === s.id)
      const lastActive = sActivities[0]?.created_at
      return {
        staff: s,
        leadCount: sLeads.length,
        dealCount: sDeals.length,
        revenue: sRevenue,
        activityCount: sActivities.length,
        lastActive,
        targetProgress: s.monthly_target > 0 ? Math.min((sRevenue / s.monthly_target) * 100, 100) : 0,
      }
    })
  }, [staff, leads, deals, activities])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-950">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-ink-700 bg-ink-900/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold-500/40 bg-gold-500/15">
              <Crown className="h-5 w-5 text-gold-400" />
            </div>
            <div>
              <h1 className="font-serif text-sm font-semibold text-gold-300">Bin Taha Associates</h1>
              <p className="text-xs text-ink-500">Owner Master Dashboard</p>
            </div>
          </div>
          <Link
            to="/agent"
            className="flex items-center gap-1.5 rounded-lg border border-ink-600 px-3 py-1.5 text-xs text-ink-400 transition hover:text-ink-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Agent Portal
          </Link>
        </div>

        {/* Tabs */}
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2">
          {([
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'staff', label: 'Staff', icon: Users },
            { id: 'watchdog', label: 'Watchdog', icon: Activity },
            { id: 'inventory', label: 'Inventory', icon: Home },
            { id: 'leads', label: 'Leads', icon: Phone },
            { id: 'deals', label: 'Deals', icon: Building2 },
          ] as { id: Tab; label: string; icon: typeof Home }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                tab === t.id ? 'bg-gold-500/15 text-gold-300' : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              {t.id === 'watchdog' && activities.length > 0 && (
                <span className="ml-0.5 rounded-full bg-gold-500/20 px-1.5 text-xs text-gold-400">
                  {activities.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="Total Revenue" value={formatPKR(totalRevenue)} icon={TrendingUp} sub={`${deals.length} deals total`} />
              <StatCard label="This Month" value={formatPKR(monthRevenue)} icon={Building2} sub="confirmed deals" />
              <StatCard label="Active Leads" value={String(activeLeads)} icon={Users} sub={`${leads.length} total`} />
              <StatCard label="Available Plots" value={String(availableCount)} icon={Home} sub={`${reservedCount} reserved, ${soldCount} sold`} />
            </div>

            {/* Recent activity feed (mini) */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium uppercase tracking-wider text-ink-400">Live Watchdog Feed</h3>
                <button onClick={() => setTab('watchdog')} className="text-xs text-gold-400 hover:text-gold-300 transition">
                  View all →
                </button>
              </div>
              <ActivityFeed activities={activities.slice(0, 8)} compact />
            </div>

            {/* Quick inventory summary */}
            <div>
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-ink-400">Inventory Summary</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <StatusSummary label="Available" count={availableCount} total={properties.length} color="emerald" />
                <StatusSummary label="Reserved" count={reservedCount} total={properties.length} color="amber" />
                <StatusSummary label="Sold" count={soldCount} total={properties.length} color="rose" />
              </div>
            </div>
          </div>
        )}

        {/* STAFF */}
        {tab === 'staff' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="font-serif text-xl text-ink-50">Staff Performance</h2>
              <p className="mt-0.5 text-sm text-ink-400">{staff.length} team members</p>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {agentStats.map((stat) => (
                <div key={stat.staff.id} className="rounded-xl border border-ink-700 bg-ink-800/50 p-5">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-serif text-lg text-ink-50">{stat.staff.name}</p>
                        {!stat.staff.active && (
                          <span className="rounded-full bg-ink-700 px-2 py-0.5 text-xs text-ink-400">Inactive</span>
                        )}
                      </div>
                      <p className="text-xs text-ink-500">{stat.staff.role} · {stat.staff.access_code}</p>
                      <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-xs ${stat.staff.tier === 'Gold Eagle' ? 'border-gold-500/30 text-gold-300' : stat.staff.tier === 'Silver' ? 'border-slate-400/30 text-slate-300' : 'border-amber-600/30 text-amber-600'}`}>{stat.staff.tier}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-serif text-xl font-semibold text-gold-300">{formatPKR(stat.revenue)}</p>
                      <p className="text-xs text-ink-500">revenue</p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-ink-400">Monthly Target</span>
                      <span className="text-gold-400">{stat.targetProgress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-ink-900">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-500"
                        style={{ width: `${stat.targetProgress}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <MiniStat label="Leads" value={stat.leadCount} />
                    <MiniStat label="Deals" value={stat.dealCount} />
                    <MiniStat label="Actions" value={stat.activityCount} />
                  </div>
                  {stat.lastActive && (
                    <p className="mt-3 flex items-center gap-1 text-xs text-ink-500">
                      <Clock className="h-3 w-3" />
                      Last active {timeAgo(stat.lastActive)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WATCHDOG */}
        {tab === 'watchdog' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="flex items-center gap-2 font-serif text-xl text-ink-50">
                <Activity className="h-5 w-5 text-gold-400" />
                Silent Watchdog Activity Tracker
              </h2>
              <p className="mt-0.5 text-sm text-ink-400">
                Real-time log of all agent actions — updates every 5 seconds
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by agent, action, or target..."
                  className="w-full rounded-lg border border-ink-600 bg-ink-800 px-4 py-2.5 pl-10 text-sm text-ink-50 placeholder-ink-500 outline-none transition focus:border-gold-500"
                />
              </div>
              <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="rounded-lg border border-ink-600 bg-ink-800 px-3 py-2.5 text-sm text-ink-200 outline-none focus:border-gold-500"
              >
                <option value="all">All actions</option>
                {Object.entries(ACTION_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="rounded-lg border border-ink-600 bg-ink-800 px-3 py-2.5 text-sm text-ink-200 outline-none focus:border-gold-500"
              >
                <option value="all">All staff</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Activity feed */}
            {filteredActivities.length === 0 ? (
              <div className="rounded-lg border border-ink-700 bg-ink-800/50 p-8 text-center text-sm text-ink-500">
                No activities recorded yet. Agent actions will appear here in real time.
              </div>
            ) : (
              <ActivityFeed activities={filteredActivities} />
            )}
          </div>
        )}

        {/* INVENTORY */}
        {tab === 'inventory' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="font-serif text-xl text-ink-50">Full Inventory</h2>
              <p className="mt-0.5 text-sm text-ink-400">{properties.length} properties across all projects</p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-ink-700">
              <table className="w-full text-sm">
                <thead className="bg-ink-800 text-left text-xs uppercase tracking-wider text-ink-400">
                  <tr>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Plot</th>
                    <th className="px-4 py-3">Block</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-700">
                  {properties.map((p) => (
                    <tr key={p.id} className="bg-ink-800/30 hover:bg-ink-800/60 transition">
                      <td className="px-4 py-3 text-ink-200">{p.project_name}</td>
                      <td className="px-4 py-3 font-medium text-ink-100">{p.plot_number}</td>
                      <td className="px-4 py-3 text-ink-400">{p.block || '—'}</td>
                      <td className="px-4 py-3 text-ink-400">{p.size || '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gold-300">{formatPKR(p.price)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[p.status] || ''}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LEADS */}
        {tab === 'leads' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="font-serif text-xl text-ink-50">All Client Leads</h2>
              <p className="mt-0.5 text-sm text-ink-400">{leads.length} leads across all agents</p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-ink-700">
              <table className="w-full text-sm">
                <thead className="bg-ink-800 text-left text-xs uppercase tracking-wider text-ink-400">
                  <tr>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Budget</th>
                    <th className="px-4 py-3">Agent</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-700">
                  {leads.map((l) => (
                    <tr key={l.id} className="bg-ink-800/30 hover:bg-ink-800/60 transition">
                      <td className="px-4 py-3 font-medium text-ink-100">{l.name}</td>
                      <td className="px-4 py-3 text-ink-400">{l.phone || '—'}</td>
                      <td className="px-4 py-3 text-ink-400">{l.interested_project || '—'}</td>
                      <td className="px-4 py-3 text-ink-400">
                        {l.budget_min && l.budget_max
                          ? `${formatPKR(l.budget_min)}–${formatPKR(l.budget_max)}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-ink-300">{l.staff_members?.name || 'Unassigned'}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[l.status] || ''}`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DEALS */}
        {tab === 'deals' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="font-serif text-xl text-ink-50">All Deals & Bookings</h2>
              <p className="mt-0.5 text-sm text-ink-400">{deals.length} deals across all agents</p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-ink-700">
              <table className="w-full text-sm">
                <thead className="bg-ink-800 text-left text-xs uppercase tracking-wider text-ink-400">
                  <tr>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Commission</th>
                    <th className="px-4 py-3">Agent</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-700">
                  {deals.map((d) => (
                    <tr key={d.id} className="bg-ink-800/30 hover:bg-ink-800/60 transition">
                      <td className="px-4 py-3 font-medium text-ink-100">{d.client_name}</td>
                      <td className="px-4 py-3 text-ink-400">{d.client_phone || '—'}</td>
                      <td className="px-4 py-3 text-ink-400 capitalize">{d.deal_type}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gold-300">{formatPKR(d.amount)}</td>
                      <td className="px-4 py-3 text-right text-gold-400/70">{d.commission_earned ? formatPKR(d.commission_earned) : '—'}</td>
                      <td className="px-4 py-3 text-ink-300">{d.staff_members?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[d.status] || ''}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-500">{timeAgo(d.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ---- Sub Components ----

function StatCard({ label, value, icon: Icon, sub }: { label: string; value: string; icon: typeof Home; sub?: string }) {
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-800/50 p-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-400">{label}</p>
        <Icon className="h-4 w-4 text-gold-500/60" />
      </div>
      <p className="font-serif text-2xl font-semibold text-gold-300">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-500">{sub}</p>}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-900/50 py-2">
      <p className="font-serif text-lg font-semibold text-ink-100">{value}</p>
      <p className="text-xs text-ink-500">{label}</p>
    </div>
  )
}

function StatusSummary({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  }
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-800/50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-ink-300">{label}</span>
        <span className="font-serif text-xl font-bold text-ink-50">{count}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink-900">
        <div className={`h-full rounded-full ${colorMap[color] || 'bg-ink-500'} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-ink-500">{pct.toFixed(0)}% of inventory</p>
    </div>
  )
}

function ActivityFeed({
  activities,
  compact,
}: {
  activities: (StaffActivity & { staff_members: Pick<StaffMember, 'name' | 'role' | 'access_code'> | null })[]
  compact?: boolean
}) {
  return (
    <div className="space-y-1.5">
      {activities.map((a) => (
        <div
          key={a.id}
          className="flex items-start gap-3 rounded-lg border border-ink-700 bg-ink-800/40 px-3 py-2.5 transition hover:bg-ink-800/70 animate-fade-in"
        >
          {/* Icon */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-500/10 text-sm">
            {ACTION_ICONS[a.action_type] || '•'}
          </div>
          {/* Content */}
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink-100">
              <span className="font-medium text-gold-300">{a.staff_members?.name || 'Unknown'}</span>{' '}
              <span className="text-ink-400">{ACTION_LABELS[a.action_type] || a.action_type}</span>
              {a.target_entity && (
                <>
                  {' '}
                  <span className="text-ink-300">→</span>{' '}
                  <span className="text-ink-200">{a.target_entity}</span>
                </>
              )}
            </p>
            {!compact && a.metadata && Object.keys(a.metadata).length > 0 && (
              <p className="mt-0.5 text-xs text-ink-500 font-mono">
                {JSON.stringify(a.metadata)}
              </p>
            )}
          </div>
          {/* Time */}
          <span className="shrink-0 text-xs text-ink-500">{timeAgo(a.created_at)}</span>
        </div>
      ))}
    </div>
  )
}
