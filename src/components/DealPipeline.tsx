import { useState } from 'react'
import { Phone, MessageCircle, ChevronRight, Clock } from 'lucide-react'
import { PIPELINE_STAGES, formatPKR } from '../lib/utils'
import type { PipelineStage } from '../lib/supabase'
import type { ClientLead } from '../lib/supabase'
import type { ActionType } from '../lib/watchdog'
import { supabase } from '../lib/supabase'

interface Props {
  leads: ClientLead[]
  onTrack: (action: ActionType, target?: string | null, metadata?: Record<string, unknown>) => void
  onLeadsUpdated: () => void
}

export function DealPipeline({ leads, onTrack, onLeadsUpdated }: Props) {
  const [movingId, setMovingId] = useState<string | null>(null)

  const handleMoveStage = async (leadId: string, newStage: PipelineStage, leadName: string) => {
    setMovingId(leadId)
    const { error } = await supabase
      .from('client_leads')
      .update({ pipeline_stage: newStage, updated_at: new Date().toISOString() })
      .eq('id', leadId)

    if (!error) {
      onTrack('update_pipeline', leadName, { new_stage: newStage })
      onLeadsUpdated()
    }
    setMovingId(null)
  }

  return (
    <div className="rounded-xl border border-ink-700 bg-ink-800/80 p-5">
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-ink-400">Deal Pipeline</h3>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.pipeline_stage === stage.id)
          return (
            <div key={stage.id} className="min-w-[200px] flex-1">
              <div className={`mb-2 rounded-lg border ${stage.color} px-3 py-2`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-200">{stage.label}</span>
                  <span className="rounded-full bg-ink-900/60 px-1.5 py-0.5 text-xs text-ink-400">
                    {stageLeads.length}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {stageLeads.length === 0 && (
                  <div className="rounded-lg border border-dashed border-ink-700 p-3 text-center text-xs text-ink-600">
                    No leads
                  </div>
                )}
                {stageLeads.map((lead) => (
                  <PipelineCard
                    key={lead.id}
                    lead={lead}
                    stageId={stage.id}
                    moving={movingId === lead.id}
                    onMove={(newStage) => handleMoveStage(lead.id, newStage, lead.name)}
                    onTrack={onTrack}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PipelineCard({
  lead,
  stageId,
  moving,
  onMove,
  onTrack,
}: {
  lead: ClientLead
  stageId: PipelineStage
  moving: boolean
  onMove: (stage: PipelineStage) => void
  onTrack: (action: ActionType, target?: string | null, metadata?: Record<string, unknown>) => void
}) {
  const [showMove, setShowMove] = useState(false)

  const handleCall = () => {
    if (lead.phone) {
      onTrack('call_client', lead.name, { phone: lead.phone })
      window.location.href = `tel:${lead.phone}`
    }
  }

  const handleWhatsApp = () => {
    if (lead.phone) {
      onTrack('whatsapp_client', lead.name, { phone: lead.phone })
      const cleanPhone = lead.phone.replace(/[^0-9]/g, '')
      window.open(`https://wa.me/${cleanPhone}`, '_blank')
    }
  }

  const nextStageIndex = PIPELINE_STAGES.findIndex((s) => s.id === stageId) + 1
  const canAdvance = nextStageIndex < PIPELINE_STAGES.length

  return (
    <div className={`rounded-lg border border-ink-700 bg-ink-900/60 p-3 transition ${moving ? 'opacity-50' : ''}`}>
      <p className="text-sm font-medium text-ink-100">{lead.name}</p>
      {lead.interested_project && (
        <p className="mt-0.5 text-xs text-ink-500">{lead.interested_project}</p>
      )}
      {lead.budget_max && (
        <p className="mt-0.5 text-xs text-gold-400/70">Budget: {formatPKR(lead.budget_max)}</p>
      )}
      {lead.follow_up_date && (
        <p className="mt-1 flex items-center gap-1 text-xs text-amber-400/80">
          <Clock className="h-3 w-3" />
          {new Date(lead.follow_up_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </p>
      )}

      <div className="mt-2 flex items-center gap-1.5">
        <button
          onClick={handleCall}
          disabled={!lead.phone}
          className="flex h-7 w-7 items-center justify-center rounded border border-ink-600 text-ink-400 transition hover:border-emerald-500/40 hover:text-emerald-300 disabled:opacity-30"
        >
          <Phone className="h-3 w-3" />
        </button>
        <button
          onClick={handleWhatsApp}
          disabled={!lead.phone}
          className="flex h-7 w-7 items-center justify-center rounded border border-ink-600 text-ink-400 transition hover:border-emerald-500/40 hover:text-emerald-300 disabled:opacity-30"
        >
          <MessageCircle className="h-3 w-3" />
        </button>

        {canAdvance && (
          <button
            onClick={() => onMove(PIPELINE_STAGES[nextStageIndex].id)}
            className="ml-auto flex items-center gap-1 rounded border border-gold-500/20 bg-gold-500/10 px-2 py-1 text-xs text-gold-400 transition hover:bg-gold-500/20"
          >
            Advance
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Quick stage dropdown */}
      {showMove && (
        <select
          value={stageId}
          onChange={(e) => {
            onMove(e.target.value as PipelineStage)
            setShowMove(false)
          }}
          className="mt-2 w-full rounded border border-ink-600 bg-ink-900 px-2 py-1 text-xs text-ink-200"
        >
          {PIPELINE_STAGES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      )}
    </div>
  )
}
