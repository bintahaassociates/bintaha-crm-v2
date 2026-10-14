import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
})

// ---- Types ----

export type Tier = 'Bronze' | 'Silver' | 'Gold Eagle'
export type PipelineStage = 'new' | 'call_made' | 'site_visit' | 'token_received' | 'deal_closed'

export interface StaffMember {
  id: string
  name: string
  role: string
  access_code: string
  pin_hash: string
  phone: string | null
  email: string | null
  monthly_target: number
  commission_rate: number
  tier: Tier
  active: boolean
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  project_name: string
  plot_number: string
  block: string | null
  size: string | null
  price: number
  status: 'available' | 'reserved' | 'sold'
  assigned_agent_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ClientLead {
  id: string
  agent_id: string | null
  name: string
  phone: string | null
  email: string | null
  budget_min: number | null
  budget_max: number | null
  interested_project: string | null
  status: 'new' | 'contacted' | 'interested' | 'negotiating' | 'won' | 'lost'
  pipeline_stage: PipelineStage
  follow_up_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Deal {
  id: string
  property_id: string | null
  agent_id: string | null
  client_name: string
  client_phone: string | null
  deal_type: 'booking' | 'sale'
  amount: number
  commission_earned: number
  commission_paid: boolean
  status: 'pending' | 'confirmed' | 'cancelled'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface StaffActivity {
  id: string
  staff_id: string | null
  action_type: string
  target_entity: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface CallNote {
  id: string
  staff_id: string | null
  lead_id: string | null
  note_text: string
  call_duration_sec: number
  created_at: string
}
