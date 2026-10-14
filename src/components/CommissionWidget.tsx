import { Wallet, TrendingUp, Award, ArrowUpRight } from 'lucide-react'
import { formatPKR, TIER_CONFIG, getTierFromRevenue, type Tier } from '../lib/utils'
import type { Deal, StaffMember } from '../lib/supabase'

interface Props {
  agent: StaffMember
  deals: Deal[]
}

export function CommissionWidget({ agent, deals }: Props) {
  const now = new Date()
  const monthDeals = deals.filter((d) => {
    const dDate = new Date(d.created_at)
    return dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear()
  })

  const confirmedMonthDeals = monthDeals.filter((d) => d.status === 'confirmed')
  const earnedCommission = confirmedMonthDeals.reduce((s, d) => s + d.commission_earned, 0)
  const pendingDeals = monthDeals.filter((d) => d.status === 'pending')
  const pendingPayout = pendingDeals.reduce((s, d) => s + d.commission_earned, 0)

  const totalRevenue = deals.filter((d) => d.status === 'confirmed').reduce((s, d) => s + d.amount, 0)
  const currentTier: Tier = agent.tier || getTierFromRevenue(totalRevenue)
  const tierCfg = TIER_CONFIG[currentTier]
  const nextTier = tierCfg.nextTier ? TIER_CONFIG[tierCfg.nextTier] : null
  const nextThreshold = tierCfg.nextTier ? TIER_CONFIG[tierCfg.nextTier].threshold : 0
  const progressToNext = nextTier ? Math.min((totalRevenue / nextThreshold) * 100, 100) : 100
  const remaining = nextThreshold > 0 ? Math.max(nextThreshold - totalRevenue, 0) : 0

  return (
    <div className="rounded-xl border border-ink-700 bg-ink-800/80 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Wallet className="h-4 w-4 text-gold-400" />
        <h3 className="text-sm font-medium uppercase tracking-wider text-ink-400">Commission & Wallet</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Earned this month */}
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <div className="flex items-center gap-1.5 text-xs text-ink-400">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            Earned (Month)
          </div>
          <p className="mt-1 font-serif text-xl font-semibold text-emerald-300">
            {formatPKR(earnedCommission)}
          </p>
          <p className="mt-0.5 text-xs text-ink-500">{confirmedMonthDeals.length} confirmed deals</p>
        </div>

        {/* Pending payout */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <div className="flex items-center gap-1.5 text-xs text-ink-400">
            <Wallet className="h-3 w-3 text-amber-400" />
            Pending Payout
          </div>
          <p className="mt-1 font-serif text-xl font-semibold text-amber-300">
            {formatPKR(pendingPayout)}
          </p>
          <p className="mt-0.5 text-xs text-ink-500">{pendingDeals.length} pending deals</p>
        </div>
      </div>

      {/* Tier / Milestone */}
      <div className={`mt-3 rounded-lg border ${tierCfg.border} ${tierCfg.bg} p-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{tierCfg.icon}</span>
            <div>
              <p className="text-xs text-ink-400">Current Tier</p>
              <p className={`font-serif text-sm font-semibold ${tierCfg.color}`}>{currentTier}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-400">Commission Rate</p>
            <p className="font-serif text-sm font-semibold text-gold-300">{agent.commission_rate}%</p>
          </div>
        </div>

        {nextTier && (
          <div className="mt-3 border-t border-ink-700/50 pt-3">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-ink-400">
                <Award className="h-3 w-3" />
                Next: <span className={nextTier.color}>{tierCfg.nextTier}</span>
              </span>
              <span className="text-ink-500">
                {formatPKR(remaining)} to go
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ink-900">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-700"
                style={{ width: `${progressToNext}%` }}
              />
            </div>
          </div>
        )}

        {!nextTier && (
          <div className="mt-3 flex items-center gap-1.5 border-t border-ink-700/50 pt-3 text-xs text-gold-400">
            <ArrowUpRight className="h-3 w-3" />
            Maximum tier reached — Gold Eagle!
          </div>
        )}
      </div>
    </div>
  )
}
