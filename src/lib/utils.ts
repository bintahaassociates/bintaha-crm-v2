import type { Tier as TierType, PipelineStage } from './supabase'

export type Tier = TierType

export function formatPKR(amount: number): string {
  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(2)} Cr`
  }
  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(2)} Lac`
  }
  return `Rs ${amount.toLocaleString()}`
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const days = Math.floor(hr / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export const STATUS_COLORS: Record<string, string> = {
  available: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  reserved: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  sold: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  new: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  contacted: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  interested: 'bg-gold-500/15 text-gold-300 border-gold-500/30',
  negotiating: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  won: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  lost: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  confirmed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  cancelled: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
}

export const PIPELINE_STAGES: { id: PipelineStage; label: string; color: string }[] = [
  { id: 'new', label: 'New Inquiry', color: 'border-sky-500/40 bg-sky-500/5' },
  { id: 'call_made', label: 'Call Made', color: 'border-violet-500/40 bg-violet-500/5' },
  { id: 'site_visit', label: 'Site Visit', color: 'border-gold-500/40 bg-gold-500/5' },
  { id: 'token_received', label: 'Token Received', color: 'border-orange-500/40 bg-orange-500/5' },
  { id: 'deal_closed', label: 'Deal Closed', color: 'border-emerald-500/40 bg-emerald-500/5' },
]

export const PIPELINE_STAGE_COLORS: Record<PipelineStage, string> = {
  new: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  call_made: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  site_visit: 'bg-gold-500/15 text-gold-300 border-gold-500/30',
  token_received: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  deal_closed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
}

export const TIER_CONFIG: Record<Tier, { color: string; bg: string; border: string; icon: string; nextTier: Tier | null; threshold: number }> = {
  Bronze: { color: 'text-amber-600', bg: 'bg-amber-600/10', border: 'border-amber-600/30', icon: '🥉', nextTier: 'Silver', threshold: 5000000 },
  Silver: { color: 'text-slate-300', bg: 'bg-slate-400/10', border: 'border-slate-400/30', icon: '🥈', nextTier: 'Gold Eagle', threshold: 10000000 },
  'Gold Eagle': { color: 'text-gold-400', bg: 'bg-gold-500/10', border: 'border-gold-500/30', icon: '🦅', nextTier: null, threshold: 0 },
}

export function getTierFromRevenue(revenue: number): Tier {
  if (revenue >= 10000000) return 'Gold Eagle'
  if (revenue >= 5000000) return 'Silver'
  return 'Bronze'
}

export const ACTION_LABELS: Record<string, string> = {
  login: 'Logged in',
  logout: 'Logged out',
  view_property: 'Viewed property',
  call_client: 'Called client',
  whatsapp_client: 'Messaged client on WhatsApp',
  add_lead: 'Added new lead',
  update_lead: 'Updated lead',
  update_pipeline: 'Moved lead in pipeline',
  add_deal: 'Logged a deal',
  filter_search: 'Searched/filtered',
  view_inventory: 'Viewed inventory',
  view_dashboard: 'Opened dashboard',
  calculator_used: 'Used transfer calculator',
  share_listing: 'Shared listing card',
  log_call_note: 'Logged call note',
  whatsapp_template: 'Sent WhatsApp template',
}

export const ACTION_ICONS: Record<string, string> = {
  login: '🔓',
  logout: '🔒',
  view_property: '🏠',
  call_client: '📞',
  whatsapp_client: '💬',
  add_lead: '👤',
  update_lead: '✏️',
  update_pipeline: '📋',
  add_deal: '💼',
  filter_search: '🔍',
  view_inventory: '📋',
  view_dashboard: '📊',
  calculator_used: '🧮',
  share_listing: '📤',
  log_call_note: '📝',
  whatsapp_template: '📨',
}

// ---- Transfer Fee Calculator Config ----

export interface SocietyConfig {
  name: string
  transferFeePct: number
  mutationFeePct: number
  fbrFilerPct: number
  fbrNonFilerPct: number
}

export const SOCIETY_CONFIGS: SocietyConfig[] = [
  { name: 'LDA Avenue 1', transferFeePct: 1.0, mutationFeePct: 0.5, fbrFilerPct: 1.0, fbrNonFilerPct: 2.0 },
  { name: 'Jubilee Town', transferFeePct: 0.8, mutationFeePct: 0.5, fbrFilerPct: 1.0, fbrNonFilerPct: 2.0 },
  { name: 'Johar Town', transferFeePct: 1.2, mutationFeePct: 0.5, fbrFilerPct: 1.0, fbrNonFilerPct: 2.0 },
]

export interface PlotSizeConfig {
  label: string
  sqft: number
}

export const PLOT_SIZES: PlotSizeConfig[] = [
  { label: '5 Marla', sqft: 1125 },
  { label: '10 Marla', sqft: 2250 },
  { label: '1 Kanal', sqft: 4500 },
]

// ---- WhatsApp Templates ----

export interface WhatsAppTemplate {
  id: string
  label: string
  body: (context: { agentName: string; clientName: string; project?: string; plot?: string; price?: string }) => string
}

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'price_update',
    label: 'Price Update',
    body: ({ agentName, clientName, project, price }) =>
      `Assalam o Alaikum ${clientName}!\n\nThis is ${agentName} from Bin Taha Associates. I wanted to share an updated price for ${project || 'our project'}:\n\n*New Price: ${price || 'PKR ___'}*\n\nThis is a limited-time offer. Let me know if you're interested!\n\nBest regards,\n${agentName}\nBin Taha Associates`,
  },
  {
    id: 'site_visit',
    label: 'Site Visit Invite',
    body: ({ agentName, clientName, project }) =>
      `Assalam o Alaikum ${clientName}!\n\nThis is ${agentName} from Bin Taha Associates. We'd like to invite you for a *site visit* at ${project || 'our project'} this weekend.\n\nWe'll show you available plots and answer all your questions.\n\nPlease confirm your availability.\n\nBest regards,\n${agentName}`,
  },
  {
    id: 'plot_details',
    label: 'Plot Details Sheet',
    body: ({ agentName, clientName, project, plot, price }) =>
      `Assalam o Alaikum ${clientName}!\n\nHere are the plot details from Bin Taha Associates:\n\n*Project:* ${project || '___'}\n*Plot:* ${plot || '___'}\n*Price:* ${price || '___'}\n\nFor more information or to book a visit, please contact me.\n\nBest regards,\n${agentName}\nBin Taha Associates`,
  },
]

// ---- Commission helpers ----

export function calculateCommission(dealAmount: number, commissionRate: number): number {
  return (dealAmount * commissionRate) / 100
}

export function generateListingCard(property: {
  project_name: string
  plot_number: string
  block: string | null
  size: string | null
  price: number
  status: string
}, agentName: string, agentPhone: string): string {
  return `🏛️ *Bin Taha Associates*\n\n*Project:* ${property.project_name}\n*Plot:* ${property.plot_number}${property.block ? ` · ${property.block}` : ''}\n*Size:* ${property.size || 'N/A'}\n*Price:* ${formatPKR(property.price)}\n*Status:* ${property.status.toUpperCase()}\n\n📞 Contact: ${agentName}\n📱 ${agentPhone}\n\n_Bin Taha Associates — Trusted Real Estate Experts_`
}
