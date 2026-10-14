import { useState, useMemo } from 'react'
import { Bell, MessageCircle, Phone, X, StickyNote, ChevronDown } from 'lucide-react'
import { WHATSAPP_TEMPLATES, type WhatsAppTemplate } from '../lib/utils'
import type { ClientLead } from '../lib/supabase'
import type { ActionType } from '../lib/watchdog'
import { supabase } from '../lib/supabase'

interface Props {
  leads: ClientLead[]
  agentName: string
  agentId: string
  onTrack: (action: ActionType, target?: string | null, metadata?: Record<string, unknown>) => void
  onLeadsUpdated: () => void
}

export function ActionCenter({ leads, agentName, agentId, onTrack, onLeadsUpdated }: Props) {
  const [showNoteModal, setShowNoteModal] = useState<ClientLead | null>(null)
  const [showTemplatePicker, setShowTemplatePicker] = useState<ClientLead | null>(null)

  const today = new Date().toISOString().slice(0, 10)
  const todayFollowUps = useMemo(
    () => leads.filter((l) => l.follow_up_date === today),
    [leads, today],
  )
  const overdueFollowUps = useMemo(
    () => leads.filter((l) => l.follow_up_date && l.follow_up_date < today && !['won', 'lost'].includes(l.status)),
    [leads, today],
  )

  const handleCall = (lead: ClientLead) => {
    if (lead.phone) {
      onTrack('call_client', lead.name, { phone: lead.phone })
      window.location.href = `tel:${lead.phone}`
    }
  }

  const handleSendTemplate = (lead: ClientLead, template: WhatsAppTemplate) => {
    const text = encodeURIComponent(
      template.body({
        agentName,
        clientName: lead.name,
        project: lead.interested_project || undefined,
      }),
    )
    const cleanPhone = lead.phone?.replace(/[^0-9]/g, '') || ''
    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank')
    } else {
      window.open(`https://wa.me/?text=${text}`, '_blank')
    }
    onTrack('whatsapp_template', lead.name, { template: template.id })
    setShowTemplatePicker(null)
  }

  return (
    <div className="rounded-xl border border-ink-700 bg-ink-800/80 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-gold-400" />
          <h3 className="text-sm font-medium uppercase tracking-wider text-ink-400">Today's Action Center</h3>
        </div>
        {(todayFollowUps.length > 0 || overdueFollowUps.length > 0) && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500/20 px-1.5 text-xs font-semibold text-rose-300">
            {todayFollowUps.length + overdueFollowUps.length}
          </span>
        )}
      </div>

      {/* Follow-up reminders */}
      {(todayFollowUps.length > 0 || overdueFollowUps.length > 0) ? (
        <div className="space-y-2">
          {overdueFollowUps.map((lead) => (
            <FollowUpRow
              key={lead.id}
              lead={lead}
              overdue
              onCall={() => handleCall(lead)}
              onNote={() => setShowNoteModal(lead)}
              onTemplate={() => setShowTemplatePicker(lead)}
            />
          ))}
          {todayFollowUps.map((lead) => (
            <FollowUpRow
              key={lead.id}
              lead={lead}
              onCall={() => handleCall(lead)}
              onNote={() => setShowNoteModal(lead)}
              onTemplate={() => setShowTemplatePicker(lead)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-ink-700 p-4 text-center text-xs text-ink-600">
          No follow-ups due today. You're all caught up!
        </div>
      )}

      {/* Quick template buttons */}
      <div className="mt-4 border-t border-ink-700/50 pt-4">
        <p className="mb-2 text-xs text-ink-500">Quick WhatsApp Templates</p>
        <div className="flex flex-wrap gap-1.5">
          {WHATSAPP_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setShowTemplatePicker({ name: '', phone: null, id: '', interested_project: null } as ClientLead)}
              className="rounded-lg border border-ink-600 px-2.5 py-1.5 text-xs text-ink-300 transition hover:border-emerald-500/40 hover:text-emerald-300"
            >
              <MessageCircle className="mr-1 inline h-3 w-3" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Call Note Modal */}
      {showNoteModal && (
        <CallNoteModal
          lead={showNoteModal}
          agentId={agentId}
          onClose={() => setShowNoteModal(null)}
          onSaved={() => {
            setShowNoteModal(null)
            onLeadsUpdated()
          }}
          onTrack={onTrack}
        />
      )}

      {/* Template Picker */}
      {showTemplatePicker && (
        <TemplatePickerModal
          lead={showTemplatePicker}
          templates={WHATSAPP_TEMPLATES}
          agentName={agentName}
          onClose={() => setShowTemplatePicker(null)}
          onSend={(template) => handleSendTemplate(showTemplatePicker, template)}
        />
      )}
    </div>
  )
}

function FollowUpRow({
  lead,
  overdue,
  onCall,
  onNote,
  onTemplate,
}: {
  lead: ClientLead
  overdue?: boolean
  onCall: () => void
  onNote: () => void
  onTemplate: () => void
}) {
  return (
    <div className={`flex items-center justify-between rounded-lg border p-3 transition ${
      overdue ? 'border-rose-500/20 bg-rose-500/5' : 'border-amber-500/20 bg-amber-500/5'
    }`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium text-ink-100">{lead.name}</p>
          {overdue && (
            <span className="rounded-full bg-rose-500/20 px-1.5 py-0.5 text-xs text-rose-300">Overdue</span>
          )}
        </div>
        <p className="truncate text-xs text-ink-500">
          {lead.interested_project || 'No project'} · {lead.phone || 'No phone'}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={onCall}
          disabled={!lead.phone}
          className="flex h-7 w-7 items-center justify-center rounded border border-ink-600 text-ink-400 transition hover:border-emerald-500/40 hover:text-emerald-300 disabled:opacity-30"
        >
          <Phone className="h-3 w-3" />
        </button>
        <button
          onClick={onTemplate}
          disabled={!lead.phone}
          className="flex h-7 w-7 items-center justify-center rounded border border-ink-600 text-ink-400 transition hover:border-emerald-500/40 hover:text-emerald-300 disabled:opacity-30"
        >
          <MessageCircle className="h-3 w-3" />
        </button>
        <button
          onClick={onNote}
          className="flex h-7 w-7 items-center justify-center rounded border border-ink-600 text-ink-400 transition hover:border-gold-500/40 hover:text-gold-300"
        >
          <StickyNote className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

function CallNoteModal({
  lead,
  agentId,
  onClose,
  onSaved,
  onTrack,
}: {
  lead: ClientLead
  agentId: string
  onClose: () => void
  onSaved: () => void
  onTrack: (action: ActionType, target?: string | null, metadata?: Record<string, unknown>) => void
}) {
  const [note, setNote] = useState('')
  const [duration, setDuration] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!note.trim()) return
    setSaving(true)
    setError(null)

    const { error: insertError } = await supabase.from('call_notes').insert({
      staff_id: agentId,
      lead_id: lead.id,
      note_text: note.trim(),
      call_duration_sec: duration ? parseInt(duration) : 0,
    })

    if (insertError) {
      setError('Failed to save call note.')
      setSaving(false)
      return
    }

    onTrack('log_call_note', lead.name, { duration: duration ? parseInt(duration) : 0 })
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-ink-700 bg-ink-800 p-6 shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-gold-400" />
            <h3 className="font-serif text-lg text-ink-50">Quick Call Note</h3>
          </div>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-300 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 rounded-lg border border-ink-700 bg-ink-900/50 p-3">
          <p className="text-sm text-ink-200">{lead.name}</p>
          <p className="text-xs text-ink-500">{lead.phone || 'No phone'} · {lead.interested_project || 'No project'}</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">Call Summary</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
              className="form-input min-h-[80px] resize-none"
              placeholder="Summary of the conversation..."
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">Duration (seconds, optional)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="form-input"
              placeholder="120"
            />
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-gold-500 px-4 py-3 font-medium text-ink-950 transition hover:bg-gold-400 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Call Note'}
          </button>
        </form>
      </div>
    </div>
  )
}

function TemplatePickerModal({
  lead,
  templates,
  agentName,
  onClose,
  onSend,
}: {
  lead: ClientLead
  templates: WhatsAppTemplate[]
  agentName: string
  onClose: () => void
  onSend: (template: WhatsAppTemplate) => void
}) {
  const [selected, setSelected] = useState<WhatsAppTemplate | null>(null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-ink-700 bg-ink-800 p-6 shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-gold-400" />
            <h3 className="font-serif text-lg text-ink-50">WhatsApp Template</h3>
          </div>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-300 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {lead.name && (
          <div className="mb-4 rounded-lg border border-ink-700 bg-ink-900/50 p-3">
            <p className="text-sm text-ink-200">{lead.name}</p>
            <p className="text-xs text-ink-500">{lead.phone || 'No phone'}</p>
          </div>
        )}

        <div className="space-y-2">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t)}
              className={`w-full rounded-lg border p-3 text-left transition ${
                selected?.id === t.id
                  ? 'border-gold-500/40 bg-gold-500/10'
                  : 'border-ink-700 bg-ink-900/30 hover:border-ink-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink-100">{t.label}</span>
                <ChevronDown className="h-4 w-4 text-ink-500" />
              </div>
              {selected?.id === t.id && (
                <p className="mt-2 whitespace-pre-wrap rounded bg-ink-900/50 p-2 text-xs text-ink-400">
                  {t.body({ agentName, clientName: lead.name || 'Client', project: lead.interested_project || undefined })}
                </p>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => selected && onSend(selected)}
          disabled={!selected}
          className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          Send via WhatsApp
        </button>
      </div>
    </div>
  )
}
