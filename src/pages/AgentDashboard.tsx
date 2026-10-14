import {
  Building2,
  LogOut,
  Phone,
  MessageCircle,
  Plus,
  Home,
  Users,
  TrendingUp,
  Search,
  X,
  Eye,
  ChevronRight,
  Calculator,
  Share2,
  Check,
  SlidersHorizontal,
} from 'lucide-react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAgent } from '../lib/auth'
import { useNavigate } from 'react-router-dom'
import { supabase, type Property, type ClientLead, type Deal } from '../lib/supabase'
import { formatPKR, STATUS_COLORS, PIPELINE_STAGES, PIPELINE_STAGE_COLORS, generateListingCard } from '../lib/utils'
import type { ActionType } from '../lib/watchdog'
import { CommissionWidget } from '../components/CommissionWidget'
import { TransferCalculator } from '../components/TransferCalculator'
import { DealPipeline } from '../components/DealPipeline'
import { ActionCenter } from '../components/ActionCenter'

type Tab = 'dashboard' | 'pipeline' | 'inventory' | 'leads' | 'deals'

export default function AgentDashboard() {
  const { agent, loading, logout, track } = useAgent()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('dashboard')
  const [properties, setProperties] = useState<Property[]>([])
  const [leads, setLeads] = useState<ClientLead[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [societyFilter, setSocietyFilter] = useState('all')
  const [blockFilter, setBlockFilter] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  const [showAddLead, setShowAddLead] = useState(false)
  const [showAddDeal, setShowAddDeal] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [shareCopiedId, setShareCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !agent) {
      navigate('/agent')
    }
  }, [agent, loading, navigate])

  const fetchData = useCallback(async () => {
    if (!agent) return
    const [propsRes, leadsRes, dealsRes] = await Promise.all([
      supabase.from('properties').select('*').order('created_at', { ascending: false }),
      supabase.from('client_leads').select('*').eq('agent_id', agent.id).order('created_at', { ascending: false }),
      supabase.from('deals').select('*').eq('agent_id', agent.id).order('created_at', { ascending: false }),
    ])
    if (propsRes.data) setProperties(propsRes.data as Property[])
    if (leadsRes.data) setLeads(leadsRes.data as ClientLead[])
    if (dealsRes.data) setDeals(dealsRes.data as Deal[])
    setDataLoading(false)
  }, [agent])

  useEffect(() => {
    if (agent) {
      fetchData()
      track('view_dashboard')
    }
  }, [agent]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!searchQuery) return
    const timer = setTimeout(() => {
      track('filter_search', searchQuery, { query: searchQuery, tab })
    }, 800)
    return () => clearTimeout(timer)
  }, [searchQuery, tab]) // eslint-disable-line react-hooks/exhaustive-deps

  // Get unique societies and blocks for filters
  const societies = useMemo(() => [...new Set(properties.map((p) => p.project_name))], [properties])
  const blocks = useMemo(() => [...new Set(properties.filter((p) => p.block).map((p) => p.block!))], [properties])

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.plot_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.block?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      const matchesSociety = societyFilter === 'all' || p.project_name === societyFilter
      const matchesBlock = blockFilter === 'all' || p.block === blockFilter
      let matchesPrice = true
      if (priceRange !== 'all') {
        const ranges: Record<string, [number, number]> = {
          '0-3m': [0, 3000000],
          '3-6m': [3000000, 6000000],
          '6-10m': [6000000, 10000000],
          '10m+': [10000000, Infinity],
        }
        const [min, max] = ranges[priceRange] || [0, Infinity]
        matchesPrice = p.price >= min && p.price < max
      }
      return matchesSearch && matchesStatus && matchesSociety && matchesBlock && matchesPrice
    })
  }, [properties, searchQuery, statusFilter, societyFilter, blockFilter, priceRange])

  const now = new Date()
  const monthDeals = deals.filter((d) => {
    const dDate = new Date(d.created_at)
    return dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear() && d.status === 'confirmed'
  })
  const monthlyRevenue = monthDeals.reduce((sum, d) => sum + d.amount, 0)
  const targetProgress = agent ? Math.min((monthlyRevenue / agent.monthly_target) * 100, 100) : 0

  const handleViewProperty = (prop: Property) => {
    setSelectedProperty(prop)
    track('view_property', prop.plot_number, { project: prop.project_name, price: prop.price })
  }

  const handleCall = (lead: ClientLead) => {
    if (lead.phone) {
      track('call_client', lead.name, { phone: lead.phone })
      window.location.href = `tel:${lead.phone}`
    }
  }

  const handleWhatsApp = (lead: ClientLead) => {
    if (lead.phone) {
      track('whatsapp_client', lead.name, { phone: lead.phone })
      const cleanPhone = lead.phone.replace(/[^0-9]/g, '')
      window.open(`https://wa.me/${cleanPhone}`, '_blank')
    }
  }

  const handleShareListing = (prop: Property) => {
    const card = generateListingCard(prop, agent?.name || '', agent?.phone || '')
    navigator.clipboard.writeText(card)
    setShareCopiedId(prop.id)
    setTimeout(() => setShareCopiedId(null), 2000)
    track('share_listing', prop.plot_number, { project: prop.project_name })

    if (agent?.phone) {
      const text = encodeURIComponent(card)
      window.open(`https://wa.me/?text=${text}`, '_blank')
    }
  }

  const handleFilterTrack = (filterType: string, value: string) => {
    track('filter_search', `${filterType}:${value}`, { filter: filterType, value })
  }

  if (loading || !agent) {
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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold-500/30 bg-gold-500/10">
              <Building2 className="h-5 w-5 text-gold-400" />
            </div>
            <div>
              <h1 className="font-serif text-sm font-semibold text-gold-300">Bin Taha Associates</h1>
              <p className="text-xs text-ink-500">Agent Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCalculator(true)}
              className="flex items-center gap-1.5 rounded-lg border border-gold-500/30 bg-gold-500/10 px-3 py-1.5 text-xs text-gold-400 transition hover:bg-gold-500/20"
            >
              <Calculator className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Calculator</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg border border-ink-600 px-3 py-1.5 text-xs text-ink-400 transition hover:border-rose-500/40 hover:text-rose-300"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2">
          {([
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'pipeline', label: 'Pipeline', icon: SlidersHorizontal },
            { id: 'inventory', label: 'Inventory', icon: Home },
            { id: 'leads', label: 'Leads', icon: Users },
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
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* DASHBOARD TAB */}
        {tab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* Greeting */}
            <div>
              <h2 className="font-serif text-2xl text-ink-50">
                Welcome back, {agent.name.split(' ')[0]}
              </h2>
              <p className="mt-0.5 text-sm text-ink-400">{agent.role}</p>
            </div>

            {/* Top row: Target + Commission */}
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Target Progress */}
              <div className="rounded-xl border border-ink-700 bg-ink-800/80 p-6">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-ink-400">
                      Monthly Target Progress
                    </p>
                    <p className="mt-1 font-serif text-2xl text-gold-300">
                      {formatPKR(monthlyRevenue)}{' '}
                      <span className="text-base text-ink-500">/ {formatPKR(agent.monthly_target)}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-3xl font-bold text-gold-400">
                      {targetProgress.toFixed(0)}%
                    </p>
                    <p className="text-xs text-ink-500">
                      {monthDeals.length} deal{monthDeals.length !== 1 ? 's' : ''} this month
                    </p>
                  </div>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-ink-900">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-700"
                    style={{ width: `${targetProgress}%` }}
                  />
                </div>
              </div>

              {/* Commission Widget */}
              <CommissionWidget agent={agent} deals={deals} />
            </div>

            {/* Action Center */}
            <ActionCenter
              leads={leads}
              agentName={agent.name}
              agentId={agent.id}
              onTrack={track}
              onLeadsUpdated={fetchData}
            />

            {/* Quick Actions */}
            <div>
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-ink-400">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <QuickAction icon={Home} label="View Inventory" onClick={() => { setTab('inventory'); track('view_inventory') }} />
                <QuickAction icon={Plus} label="Add Lead" onClick={() => setShowAddLead(true)} />
                <QuickAction icon={Building2} label="Log Deal" onClick={() => setShowAddDeal(true)} />
                <QuickAction icon={Calculator} label="Fee Calculator" onClick={() => setShowCalculator(true)} />
              </div>
            </div>

            {/* Recent Leads with quick contact */}
            <div>
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-ink-400">
                Your Leads — Quick Contact
              </h3>
              <div className="space-y-2">
                {dataLoading && (
                  <div className="rounded-lg border border-ink-700 bg-ink-800/50 p-6 text-center text-sm text-ink-500">
                    Loading leads...
                  </div>
                )}
                {!dataLoading && leads.length === 0 && (
                  <div className="rounded-lg border border-ink-700 bg-ink-800/50 p-6 text-center text-sm text-ink-500">
                    No leads yet. Add your first client lead to get started.
                  </div>
                )}
                {leads.slice(0, 5).map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between rounded-lg border border-ink-700 bg-ink-800/50 p-3 transition hover:border-gold-500/20"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-100">{lead.name}</p>
                      <p className="truncate text-xs text-ink-500">
                        {lead.interested_project || 'No project'} · {lead.phone || 'No phone'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCall(lead)}
                        disabled={!lead.phone}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-600 text-ink-400 transition hover:border-emerald-500/40 hover:text-emerald-300 disabled:opacity-30"
                        title="Call"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleWhatsApp(lead)}
                        disabled={!lead.phone}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-600 text-ink-400 transition hover:border-emerald-500/40 hover:text-emerald-300 disabled:opacity-30"
                        title="WhatsApp"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PIPELINE TAB */}
        {tab === 'pipeline' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="font-serif text-xl text-ink-50">Deal Pipeline</h2>
              <p className="mt-0.5 text-sm text-ink-400">
                Track leads from inquiry to deal close — tap "Advance" to move stages
              </p>
            </div>
            <DealPipeline leads={leads} onTrack={track} onLeadsUpdated={fetchData} />
          </div>
        )}

        {/* INVENTORY TAB */}
        {tab === 'inventory' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="font-serif text-xl text-ink-50">Available Inventory</h2>
              <p className="mt-0.5 text-sm text-ink-400">
                Real-time plot availability — use filters to narrow down
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by project, plot, or block..."
                className="w-full rounded-lg border border-ink-600 bg-ink-800 px-4 py-2.5 pl-10 text-sm text-ink-50 placeholder-ink-500 outline-none transition focus:border-gold-500"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              {/* Society filter */}
              <FilterDropdown
                label="Society"
                value={societyFilter}
                options={[{ value: 'all', label: 'All Societies' }, ...societies.map((s) => ({ value: s, label: s }))]}
                onChange={(v) => { setSocietyFilter(v); handleFilterTrack('society', v) }}
              />
              {/* Block filter */}
              <FilterDropdown
                label="Block"
                value={blockFilter}
                options={[{ value: 'all', label: 'All Blocks' }, ...blocks.map((b) => ({ value: b, label: b }))]}
                onChange={(v) => { setBlockFilter(v); handleFilterTrack('block', v) }}
              />
              {/* Price filter */}
              <FilterDropdown
                label="Price"
                value={priceRange}
                options={[
                  { value: 'all', label: 'Any Price' },
                  { value: '0-3m', label: 'Under 3M' },
                  { value: '3-6m', label: '3M - 6M' },
                  { value: '6-10m', label: '6M - 10M' },
                  { value: '10m+', label: '10M+' },
                ]}
                onChange={(v) => { setPriceRange(v); handleFilterTrack('price', v) }}
              />
              {/* Status filter */}
              <div className="flex gap-1.5">
                {['all', 'available', 'reserved', 'sold'].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setStatusFilter(s); handleFilterTrack('status', s) }}
                    className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition ${
                      statusFilter === s
                        ? 'bg-gold-500/15 text-gold-300 border border-gold-500/30'
                        : 'border border-ink-600 text-ink-400 hover:text-ink-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Active filter summary */}
            {(societyFilter !== 'all' || blockFilter !== 'all' || priceRange !== 'all' || statusFilter !== 'all') && (
              <p className="text-xs text-ink-500">
                Showing {filteredProperties.length} of {properties.length} properties
              </p>
            )}

            {/* Property grid */}
            {dataLoading && (
              <div className="py-12 text-center text-sm text-ink-500">Loading inventory...</div>
            )}
            {!dataLoading && filteredProperties.length === 0 && (
              <div className="py-12 text-center text-sm text-ink-500">No properties match your filters.</div>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProperties.map((prop) => (
                <div
                  key={prop.id}
                  className="group rounded-xl border border-ink-700 bg-ink-800/50 p-4 transition hover:border-gold-500/30 hover:bg-ink-800"
                >
                  <button
                    onClick={() => handleViewProperty(prop)}
                    className="w-full text-left"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <p className="text-xs text-ink-500">{prop.project_name}</p>
                        <p className="font-serif text-lg text-ink-50">
                          {prop.plot_number}
                          {prop.block && <span className="text-sm text-ink-400"> · {prop.block}</span>}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                          STATUS_COLORS[prop.status] || 'border-ink-600 text-ink-400'
                        }`}
                      >
                        {prop.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-ink-500">{prop.size || 'N/A'}</p>
                        <p className="text-sm font-semibold text-gold-300">{formatPKR(prop.price)}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-ink-600 transition group-hover:translate-x-0.5 group-hover:text-gold-400" />
                    </div>
                  </button>

                  {/* Share Listing Card */}
                  <button
                    onClick={() => handleShareListing(prop)}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-ink-600 px-3 py-2 text-xs text-ink-300 transition hover:border-emerald-500/40 hover:text-emerald-300"
                  >
                    {shareCopiedId === prop.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        Copied! Opening WhatsApp...
                      </>
                    ) : (
                      <>
                        <Share2 className="h-3.5 w-3.5" />
                        Share Listing Card
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LEADS TAB */}
        {tab === 'leads' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl text-ink-50">Client Leads</h2>
                <p className="mt-0.5 text-sm text-ink-400">{leads.length} total leads</p>
              </div>
              <button
                onClick={() => setShowAddLead(true)}
                className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-3 py-2 text-sm font-medium text-ink-950 transition hover:bg-gold-400"
              >
                <Plus className="h-4 w-4" />
                Add Lead
              </button>
            </div>
            <div className="space-y-2">
              {leads.length === 0 && (
                <div className="rounded-lg border border-ink-700 bg-ink-800/50 p-8 text-center text-sm text-ink-500">
                  No leads yet. Click "Add Lead" to create your first client.
                </div>
              )}
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="rounded-lg border border-ink-700 bg-ink-800/50 p-4 transition hover:border-gold-500/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-ink-100">{lead.name}</p>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                            STATUS_COLORS[lead.status] || 'border-ink-600 text-ink-400'
                          }`}
                        >
                          {lead.status}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                            PIPELINE_STAGE_COLORS[lead.pipeline_stage] || 'border-ink-600 text-ink-400'
                          }`}
                        >
                          {PIPELINE_STAGES.find((s) => s.id === lead.pipeline_stage)?.label || lead.pipeline_stage}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-ink-500">
                        {lead.interested_project || 'No project preference'}
                        {lead.budget_min && lead.budget_max
                          ? ` · Budget: ${formatPKR(lead.budget_min)}–${formatPKR(lead.budget_max)}`
                          : ''}
                        {lead.follow_up_date && ` · Follow-up: ${new Date(lead.follow_up_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                      </p>
                      {lead.notes && (
                        <p className="mt-1 text-xs text-ink-400">{lead.notes}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => handleCall(lead)}
                        disabled={!lead.phone}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-600 text-ink-400 transition hover:border-emerald-500/40 hover:text-emerald-300 disabled:opacity-30"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleWhatsApp(lead)}
                        disabled={!lead.phone}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-600 text-ink-400 transition hover:border-emerald-500/40 hover:text-emerald-300 disabled:opacity-30"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DEALS TAB */}
        {tab === 'deals' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl text-ink-50">Deals & Bookings</h2>
                <p className="mt-0.5 text-sm text-ink-400">{deals.length} total deals</p>
              </div>
              <button
                onClick={() => setShowAddDeal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-3 py-2 text-sm font-medium text-ink-950 transition hover:bg-gold-400"
              >
                <Plus className="h-4 w-4" />
                Log Deal
              </button>
            </div>
            <div className="space-y-2">
              {deals.length === 0 && (
                <div className="rounded-lg border border-ink-700 bg-ink-800/50 p-8 text-center text-sm text-ink-500">
                  No deals yet. Click "Log Deal" to record a booking or sale.
                </div>
              )}
              {deals.map((deal) => (
                <div
                  key={deal.id}
                  className="rounded-lg border border-ink-700 bg-ink-800/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-ink-100">{deal.client_name}</p>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                            STATUS_COLORS[deal.status] || ''
                          }`}
                        >
                          {deal.status}
                        </span>
                        <span className="rounded-full border border-ink-600 px-2 py-0.5 text-xs text-ink-400 capitalize">
                          {deal.deal_type}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-ink-500">
                        {deal.client_phone || 'No phone'}
                        {deal.commission_earned > 0 && ` · Commission: ${formatPKR(deal.commission_earned)}`}
                      </p>
                    </div>
                    <p className="font-serif text-lg font-semibold text-gold-300">
                      {formatPKR(deal.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Property Detail Modal */}
      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onShare={() => handleShareListing(selectedProperty)}
          shareCopied={shareCopiedId === selectedProperty.id}
        />
      )}

      {/* Add Lead Modal */}
      {showAddLead && agent && (
        <AddLeadModal
          agentId={agent.id}
          onClose={() => setShowAddLead(false)}
          onAdded={() => { setShowAddLead(false); fetchData() }}
          onTrack={track}
        />
      )}

      {/* Add Deal Modal */}
      {showAddDeal && agent && (
        <AddDealModal
          agentId={agent.id}
          commissionRate={agent.commission_rate}
          properties={properties}
          onClose={() => setShowAddDeal(false)}
          onAdded={() => { setShowAddDeal(false); fetchData() }}
          onTrack={track}
        />
      )}

      {/* Transfer Calculator */}
      {showCalculator && agent && (
        <TransferCalculator
          onClose={() => setShowCalculator(false)}
          onTrack={track}
          agentPhone={agent.phone || ''}
        />
      )}
    </div>
  )
}

// ---- Sub Components ----

function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Home
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-2 rounded-xl border border-ink-700 bg-ink-800/50 p-4 transition hover:border-gold-500/30 hover:bg-ink-800"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400 transition group-hover:bg-gold-500/20">
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-medium text-ink-300">{label}</span>
    </button>
  )
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 pr-8 text-xs text-ink-200 outline-none transition focus:border-gold-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronRight className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 rotate-90 text-ink-500" />
    </div>
  )
}

function PropertyDetailModal({
  property,
  onClose,
  onShare,
  shareCopied,
}: {
  property: Property
  onClose: () => void
  onShare: () => void
  shareCopied: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4 animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-ink-700 bg-ink-800 p-6 shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-gold-400" />
            <h3 className="font-serif text-lg text-ink-50">Property Details</h3>
          </div>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-300 transition">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3">
          <DetailRow label="Project" value={property.project_name} />
          <DetailRow label="Plot" value={`${property.plot_number}${property.block ? ` · Block ${property.block}` : ''}`} />
          <DetailRow label="Size" value={property.size || 'N/A'} />
          <DetailRow label="Price" value={formatPKR(property.price)} highlight />
          <div className="flex items-center justify-between border-t border-ink-700 pt-3">
            <span className="text-sm text-ink-400">Status</span>
            <span
              className={`rounded-full border px-3 py-0.5 text-xs font-medium capitalize ${
                STATUS_COLORS[property.status] || ''
              }`}
            >
              {property.status}
            </span>
          </div>
          {property.notes && (
            <div className="rounded-lg border border-ink-700 bg-ink-900/50 p-3">
              <p className="text-xs text-ink-500">Notes</p>
              <p className="mt-1 text-sm text-ink-300">{property.notes}</p>
            </div>
          )}
        </div>
        <button
          onClick={onShare}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20"
        >
          {shareCopied ? (
            <>
              <Check className="h-4 w-4" />
              Copied! Opening WhatsApp...
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4" />
              Share Listing Card
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-ink-400">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-gold-300' : 'text-ink-100'}`}>{value}</span>
    </div>
  )
}

function AddLeadModal({
  agentId,
  onClose,
  onAdded,
  onTrack,
}: {
  agentId: string
  onClose: () => void
  onAdded: () => void
  onTrack: (action: ActionType, target?: string | null, metadata?: Record<string, unknown>) => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [project, setProject] = useState('')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('new')
  const [followUpDate, setFollowUpDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const pipelineMap: Record<string, string> = {
      new: 'new', contacted: 'call_made', interested: 'site_visit',
      negotiating: 'token_received', won: 'deal_closed', lost: 'new',
    }

    const { error: insertError } = await supabase.from('client_leads').insert({
      agent_id: agentId,
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      interested_project: project.trim() || null,
      budget_min: budgetMin ? parseFloat(budgetMin) : null,
      budget_max: budgetMax ? parseFloat(budgetMax) : null,
      notes: notes.trim() || null,
      status,
      pipeline_stage: pipelineMap[status] || 'new',
      follow_up_date: followUpDate || null,
    })

    if (insertError) {
      setError('Failed to save lead. Please try again.')
      setSaving(false)
      return
    }

    onTrack('add_lead', name, { project, status, followUpDate })
    onAdded()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-ink-700 bg-ink-800 p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-lg text-ink-50">Add New Client Lead</h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-300 transition">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Client Name" required>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="form-input" placeholder="Full name" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Phone">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="form-input" placeholder="+92..." />
            </FormField>
            <FormField label="Email">
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" placeholder="email@..." />
            </FormField>
          </div>
          <FormField label="Interested Project">
            <input value={project} onChange={(e) => setProject(e.target.value)} className="form-input" placeholder="e.g., LDA Avenue 1" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Budget Min (PKR)">
              <input type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} className="form-input" placeholder="3000000" />
            </FormField>
            <FormField label="Budget Max (PKR)">
              <input type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} className="form-input" placeholder="5000000" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-input">
                {['new', 'contacted', 'interested', 'negotiating', 'won', 'lost'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Follow-up Date">
              <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="form-input" />
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="form-input min-h-[60px] resize-none" placeholder="Additional notes..." />
          </FormField>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button type="submit" disabled={saving} className="w-full rounded-lg bg-gold-500 px-4 py-3 font-medium text-ink-950 transition hover:bg-gold-400 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Lead'}
          </button>
        </form>
      </div>
    </div>
  )
}

function AddDealModal({
  agentId,
  commissionRate,
  properties,
  onClose,
  onAdded,
  onTrack,
}: {
  agentId: string
  commissionRate: number
  properties: Property[]
  onClose: () => void
  onAdded: () => void
  onTrack: (action: ActionType, target?: string | null, metadata?: Record<string, unknown>) => void
}) {
  const [propertyId, setPropertyId] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [dealType, setDealType] = useState<'booking' | 'sale'>('booking')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState('pending')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const commissionAmount = (parseFloat(amount) || 0) * commissionRate / 100

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { error: insertError } = await supabase.from('deals').insert({
      property_id: propertyId || null,
      agent_id: agentId,
      client_name: clientName.trim(),
      client_phone: clientPhone.trim() || null,
      deal_type: dealType,
      amount: parseFloat(amount) || 0,
      commission_earned: commissionAmount,
      status,
    })

    if (insertError) {
      setError('Failed to save deal. Please try again.')
      setSaving(false)
      return
    }

    onTrack('add_deal', clientName, { deal_type: dealType, amount: parseFloat(amount) || 0, commission: commissionAmount })

    if (propertyId && status === 'confirmed') {
      const newStatus = dealType === 'sale' ? 'sold' : 'reserved'
      await supabase.from('properties').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', propertyId)
    }

    onAdded()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-ink-700 bg-ink-800 p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-lg text-ink-50">Log New Deal / Booking</h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-300 transition">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Property (optional)">
            <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className="form-input">
              <option value="">— Select property —</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_name} · {p.plot_number} ({p.size})
                </option>
              ))}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Client Name" required>
              <input value={clientName} onChange={(e) => setClientName(e.target.value)} required className="form-input" placeholder="Full name" />
            </FormField>
            <FormField label="Client Phone">
              <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="form-input" placeholder="+92..." />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Deal Type">
              <select value={dealType} onChange={(e) => setDealType(e.target.value as 'booking' | 'sale')} className="form-input">
                <option value="booking">Booking</option>
                <option value="sale">Sale</option>
              </select>
            </FormField>
            <FormField label="Amount (PKR)" required>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required className="form-input" placeholder="6500000" />
            </FormField>
          </div>
          {commissionAmount > 0 && (
            <div className="rounded-lg border border-gold-500/20 bg-gold-500/5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-400">Commission Earned ({commissionRate}%)</span>
                <span className="font-serif text-sm font-semibold text-gold-300">{formatPKR(commissionAmount)}</span>
              </div>
            </div>
          )}
          <FormField label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-input">
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </FormField>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button type="submit" disabled={saving} className="w-full rounded-lg bg-gold-500 px-4 py-3 font-medium text-ink-950 transition hover:bg-gold-400 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Deal'}
          </button>
        </form>
      </div>
    </div>
  )
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-400">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      {children}
    </div>
  )
}
