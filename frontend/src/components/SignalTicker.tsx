const SIGNALS = [
  { type: 'GAS', label: 'Bay 3 · H₂S +8.2% baseline', risk: 'medium' },
  { type: 'PERMIT', label: 'PTW-0441 hot-work activated · Zone B3', risk: 'high' },
  { type: 'MAINT', label: 'Compressor C-12 drift flagged', risk: 'medium' },
  { type: 'SHIFT', label: 'Changeover in 18 min · Bay 3 supervisor unassigned', risk: 'high' },
  { type: 'NOVA', label: 'Compound score 0.72 → CASE c_8f21 opened', risk: 'high' },
  { type: 'CCTV', label: 'Unscheduled entry detected · Restricted zone A4', risk: 'medium' },
  { type: 'SCADA', label: 'Pressure variance +4% · Unit 7 pump P-204B', risk: 'low' },
  { type: 'VOICE', label: 'Officer Sharma responded · permit suspended', risk: 'low' },
  { type: 'MEMORY', label: 'Lesson LS-0028 written → Qdrant lessons_learned', risk: 'low' },
  { type: 'GAS', label: 'Bay 1 · CH₄ within normal bounds', risk: 'low' },
]

const RISK_COLORS: Record<string, string> = {
  low: 'var(--risk-low)',
  medium: 'var(--risk-medium)',
  high: 'var(--risk-high)',
}

const TYPE_COLORS: Record<string, string> = {
  GAS: '#06b6d4',
  PERMIT: '#f59e0b',
  MAINT: '#8b5cf6',
  SHIFT: '#ec4899',
  VIGIL: 'var(--accent)',
  CCTV: '#f97316',
  SCADA: '#6366f1',
  VOICE: '#10b981',
  MEMORY: '#84cc16',
}

export default function SignalTicker() {
  // Double the array so the infinite scroll looks seamless
  const items = [...SIGNALS, ...SIGNALS]

  return (
    <div className="border-y border-[var(--border)] bg-bg-secondary overflow-hidden h-10 flex items-center">
      {/* Left label */}
      <div className="shrink-0 px-4 flex items-center gap-1.5 border-r border-[var(--border)] h-full bg-bg-panel">
        <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_var(--accent)]" />
        <span className="font-mono text-[0.6rem] font-bold tracking-widest text-accent whitespace-nowrap">
          SIGNAL FEED
        </span>
      </div>

      {/* Scrolling track */}
      <div className="overflow-hidden flex-1">
        <div className="ticker-track gap-12 px-8 flex">
          {items.map((s, i) => (
            <div key={i} className="flex items-center gap-2 shrink-0">
              {/* Type badge */}
              <span
                className="font-mono text-[0.55rem] font-bold tracking-wider px-1.5 py-0.5 rounded-xs"
                style={{
                  color: TYPE_COLORS[s.type] ?? 'var(--text-muted)',
                  background: `color-mix(in srgb, ${TYPE_COLORS[s.type] ?? 'transparent'} 12%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${TYPE_COLORS[s.type] ?? 'transparent'} 30%, transparent)`,
                }}
              >
                {s.type}
              </span>

              {/* Label */}
              <span className="font-body text-[0.72rem] font-normal text-text-secondary whitespace-nowrap">
                {s.label}
              </span>

              {/* Risk dot */}
              <span
                className="w-1.25 h-1.25 rounded-full shrink-0"
                style={{ background: RISK_COLORS[s.risk] ?? 'var(--text-muted)' }}
              />

              {/* Separator */}
              <span className="text-[var(--border)] text-xs">╱</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
