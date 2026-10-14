import { supabase, type StaffActivity } from './supabase'

/**
 * Silent Watchdog — logs agent actions to staff_activities without blocking UI.
 * Every call is fire-and-forget; errors are swallowed silently.
 */

export type ActionType =
  | 'login'
  | 'logout'
  | 'view_property'
  | 'call_client'
  | 'whatsapp_client'
  | 'add_lead'
  | 'update_lead'
  | 'update_pipeline'
  | 'add_deal'
  | 'filter_search'
  | 'view_inventory'
  | 'view_dashboard'
  | 'calculator_used'
  | 'share_listing'
  | 'log_call_note'
  | 'whatsapp_template'

export function logActivity(
  staffId: string,
  actionType: ActionType,
  targetEntity: string | null = null,
  metadata: Record<string, unknown> = {},
): void {
  const payload: Omit<StaffActivity, 'id' | 'created_at'> = {
    staff_id: staffId,
    action_type: actionType,
    target_entity: targetEntity,
    metadata,
  }
  Promise.resolve(supabase.from('staff_activities').insert(payload))
    .then(() => {})
    .catch(() => {})
}

/**
 * Hash a PIN string using SHA-256 (browser Web Crypto API).
 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
