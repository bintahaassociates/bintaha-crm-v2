import { useState, useMemo } from 'react'
import { Calculator, X, Copy, MessageCircle, Check } from 'lucide-react'
import { SOCIETY_CONFIGS, PLOT_SIZES, formatPKR, type SocietyConfig } from '../lib/utils'
import type { ActionType } from '../lib/watchdog'

interface Props {
  onClose: () => void
  onTrack: (action: ActionType, target?: string | null, metadata?: Record<string, unknown>) => void
  agentPhone: string
}

interface CalcResult {
  transferFee: number
  mutationFee: number
  fbrTax: number
  totalCost: number
  plotPrice: number
}

export function TransferCalculator({ onClose, onTrack, agentPhone }: Props) {
  const [society, setSociety] = useState<SocietyConfig>(SOCIETY_CONFIGS[0])
  const [plotSize, setPlotSize] = useState(PLOT_SIZES[0].label)
  const [pricePerMarla, setPricePerMarla] = useState('700000')
  const [isFiler, setIsFiler] = useState(true)
  const [copied, setCopied] = useState(false)

  const result: CalcResult = useMemo(() => {
    const marlaMap: Record<string, number> = { '5 Marla': 5, '10 Marla': 10, '1 Kanal': 20 }
    const marlas = marlaMap[plotSize] || 5
    const plotPrice = (parseFloat(pricePerMarla) || 0) * marlas
    const transferFee = (plotPrice * society.transferFeePct) / 100
    const mutationFee = (plotPrice * society.mutationFeePct) / 100
    const fbrTax = (plotPrice * (isFiler ? society.fbrFilerPct : society.fbrNonFilerPct)) / 100
    const totalCost = plotPrice + transferFee + mutationFee + fbrTax
    return { transferFee, mutationFee, fbrTax, totalCost, plotPrice }
  }, [society, plotSize, pricePerMarla, isFiler])

  const generateQuoteText = (): string => {
    const lines = [
      `🏛️ *Bin Taha Associates — Quote*`,
      ``,
      `*Society:* ${society.name}`,
      `*Plot Size:* ${plotSize}`,
      `*Filer Status:* ${isFiler ? 'Filer' : 'Non-Filer'}`,
      ``,
      `*Plot Price:* ${formatPKR(result.plotPrice)}`,
      `*Transfer Fee (${society.transferFeePct}%):* ${formatPKR(result.transferFee)}`,
      `*Mutation Fee (${society.mutationFeePct}%):* ${formatPKR(result.mutationFee)}`,
      `*FBR Tax (${isFiler ? society.fbrFilerPct : society.fbrNonFilerPct}%):* ${formatPKR(result.fbrTax)}`,
      ``,
      `*Total Deal Cost:* ${formatPKR(result.totalCost)}`,
      ``,
      `📞 Contact: ${agentPhone}`,
      `_Bin Taha Associates_`,
    ]
    return lines.join('\n')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generateQuoteText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    onTrack('calculator_used', society.name, { plotSize, totalCost: result.totalCost, isFiler })
  }

  const handleWhatsApp = () => {
    const text = encodeURIComponent(generateQuoteText())
    window.open(`https://wa.me/?text=${text}`, '_blank')
    onTrack('calculator_used', society.name, { plotSize, totalCost: result.totalCost, shared: true })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4 animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-ink-700 bg-ink-800 p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-gold-400" />
            <h3 className="font-serif text-lg text-ink-50">Transfer Fee Calculator</h3>
          </div>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-300 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Society */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">Society</label>
            <select
              value={society.name}
              onChange={(e) => setSociety(SOCIETY_CONFIGS.find((s) => s.name === e.target.value) || SOCIETY_CONFIGS[0])}
              className="form-input"
            >
              {SOCIETY_CONFIGS.map((s) => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Plot Size */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">Plot Size</label>
            <div className="flex gap-1.5">
              {PLOT_SIZES.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setPlotSize(s.label)}
                  className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-medium transition ${
                    plotSize === s.label
                      ? 'bg-gold-500/15 text-gold-300 border border-gold-500/30'
                      : 'border border-ink-600 text-ink-400 hover:text-ink-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price per Marla */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">Price per Marla (PKR)</label>
            <input
              type="number"
              value={pricePerMarla}
              onChange={(e) => setPricePerMarla(e.target.value)}
              className="form-input"
              placeholder="700000"
            />
          </div>

          {/* Filer / Non-Filer */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">Filer Status</label>
            <div className="flex gap-1.5">
              <button
                onClick={() => setIsFiler(true)}
                className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-medium transition ${
                  isFiler ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'border border-ink-600 text-ink-400'
                }`}
              >
                Filer
              </button>
              <button
                onClick={() => setIsFiler(false)}
                className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-medium transition ${
                  !isFiler ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' : 'border border-ink-600 text-ink-400'
                }`}
              >
                Non-Filer
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="rounded-xl border border-ink-700 bg-ink-900/50 p-4 space-y-2.5">
            <CalcRow label="Plot Price" value={formatPKR(result.plotPrice)} />
            <CalcRow label={`Transfer Fee (${society.transferFeePct}%)`} value={formatPKR(result.transferFee)} />
            <CalcRow label={`Mutation Fee (${society.mutationFeePct}%)`} value={formatPKR(result.mutationFee)} />
            <CalcRow label={`FBR Tax (${isFiler ? society.fbrFilerPct : society.fbrNonFilerPct}%)`} value={formatPKR(result.fbrTax)} />
            <div className="border-t border-ink-700 pt-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gold-300">Total Deal Cost</span>
                <span className="font-serif text-lg font-bold text-gold-300">{formatPKR(result.totalCost)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-ink-600 px-4 py-2.5 text-sm font-medium text-ink-200 transition hover:border-gold-500/40 hover:text-gold-300"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Quote'}
            </button>
            <button
              onClick={handleWhatsApp}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500"
            >
              <MessageCircle className="h-4 w-4" />
              Share to WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CalcRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-ink-400">{label}</span>
      <span className="text-sm font-medium text-ink-100">{value}</span>
    </div>
  )
}
