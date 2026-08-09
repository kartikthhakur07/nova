import { useThemeStore } from '../store/useThemeStore'

const SOURCES = [
  {
    id: 'gas', label: 'Gas Sensors / SCADA',
    desc: 'Real-time H₂S, CH₄, O₂, pressure telemetry across all zones — 2-second polling.',
    icon: '◈',
  },
  {
    id: 'permits', label: 'Permit-to-Work',
    desc: 'Active hot-work, confined-space and electrical permits with zone and time windows.',
    icon: '◉',
  },
  {
    id: 'maint', label: 'Maintenance Logs',
    desc: 'CMMS fault codes, recurring drift signatures, and open work orders by equipment.',
    icon: '◎',
  },
  {
    id: 'shift', label: 'Shift Roster / Handover',
    desc: 'Changeover timestamps, unassigned zone windows, and supervisor continuity gaps.',
    icon: '◐',
  },
  {
    id: 'cctv', label: 'CCTV-Derived Events',
    desc: 'Pre-processed computer-vision labels: restricted-zone entry, PPE compliance flags.',
    icon: '◑',
  },
  {
    id: 'hist', label: 'Historical Incidents',
    desc: '9,200+ near-miss and incident records in Qdrant — retrieved by hybrid semantic+lexical search.',
    icon: '◍',
  },
]

export default function InfraSection() {
  const { theme } = useThemeStore()
  const isDark = theme === 'dark'

  return (
    <section id="approach" className="section bg-bg-primary">
      <div className="container">
        {/* Section header */}
        <div className="mb-14">
          <div className="font-mono text-[0.65rem] tracking-[0.16em] uppercase text-accent mb-3">
            SIGNAL CORRELATION ENGINE
          </div>
          <h2 className="font-heading text-[clamp(2.5rem,4vw,4rem)] text-text-primary leading-none max-w-[580px]">
            Infrastructure we built —{' '}
            <span className="text-accent">Signals we correlate</span>
          </h2>
          <p className="font-body text-base font-light text-text-secondary max-w-[560px] leading-relaxed mt-4">
            Aggregated, synchronised, and reasoned signals from plant systems so no-one misses anomalies before they escalate.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mt-10">
          {/* Left: source cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 mt-10 bg-[var(--border)]">
            {SOURCES.map((src) => (
              <div
                key={src.id}
                className={`bg-card-bg backdrop-blur-md p-5 transition-colors duration-250 cursor-default ${isDark ? 'hover:bg-accent/10' : 'hover:bg-accent/5'
                  }`}
              >
                <div className="font-mono text-xl text-accent mb-1.5">{src.icon}</div>
                <div className="font-body text-[0.78rem] font-bold text-text-primary mb-1.5 tracking-wide">
                  {src.label}
                </div>
                <div className="font-body text-[0.72rem] font-light text-text-muted leading-relaxed">
                  {src.desc}
                </div>
              </div>
            ))}
          </div>

          {/* Right: mini plant map preview */}
          <PlantMapPreview isDark={isDark} />
        </div>
      </div>
    </section>
  )
}

/* ─── Mini animated plant map ────────────────────────────────────── */
function PlantMapPreview({ isDark }: { isDark: boolean }) {
  const ZONES = [
    { id: 'A1', risk: 'low', x: 0, y: 0, w: 2, h: 1 },
    { id: 'A2', risk: 'low', x: 2, y: 0, w: 2, h: 1 },
    { id: 'A3', risk: 'medium', x: 4, y: 0, w: 2, h: 1 },
    { id: 'B1', risk: 'low', x: 0, y: 1, w: 2, h: 2 },
    { id: 'B2', risk: 'medium', x: 2, y: 1, w: 2, h: 1 },
    { id: 'B3', risk: 'high', x: 4, y: 1, w: 2, h: 2 },
    { id: 'B4', risk: 'low', x: 2, y: 2, w: 2, h: 1 },
    { id: 'C1', risk: 'low', x: 0, y: 3, w: 3, h: 1 },
    { id: 'C2', risk: 'medium', x: 3, y: 3, w: 3, h: 1 },
    { id: 'D1', risk: 'low', x: 0, y: 4, w: 6, h: 1 },
  ]

  const CELL = 50
  const RISK_FILL: Record<string, string> = {
    low: isDark ? 'rgba(132,255,0,0.08)' : 'rgba(74,103,65,0.1)',
    medium: isDark ? 'rgba(251,191,36,0.15)' : 'rgba(217,119,6,0.12)',
    high: isDark ? 'rgba(249,115,22,0.25)' : 'rgba(234,88,12,0.18)',
  }
  const RISK_STROKE: Record<string, string> = {
    low: isDark ? 'rgba(132,255,0,0.3)' : 'rgba(74,103,65,0.4)',
    medium: 'rgba(251,191,36,0.5)',
    high: 'rgba(249,115,22,0.8)',
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="font-mono text-[0.62rem] text-text-muted tracking-widest">
            PLANT FLOOR MAP
          </div>
          <div className="font-body text-sm font-semibold text-text-primary mt-0.5">
            Bay 3 — Case Open ↑
          </div>
        </div>
        <div className="flex gap-3">
          {(['low', 'medium', 'high'] as const).map((r) => (
            <div key={r} className="flex items-center gap-1.25">
              <span
                className="w-2 h-2 rounded-xs"
                style={{ background: RISK_FILL[r], border: `1px solid ${RISK_STROKE[r]}` }}
              />
              <span className="font-mono text-[0.55rem] text-text-muted uppercase">{r}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG map */}
      <div className="relative border border-[var(--border)] bg-bg-secondary overflow-hidden">
        {/* Scan line */}
        <div className="scan-overlay" />

        <svg
          width="100%"
          viewBox={`0 0 ${6 * CELL} ${5 * CELL}`}
          xmlns="http://www.w3.org/2000/svg"
          className="block"
        >
          {ZONES.map((z) => (
            <g key={z.id}>
              <rect
                x={z.x * CELL + 1}
                y={z.y * CELL + 1}
                width={z.w * CELL - 2}
                height={z.h * CELL - 2}
                fill={RISK_FILL[z.risk]}
                stroke={RISK_STROKE[z.risk]}
                strokeWidth="1"
                rx="1"
              />
              <text
                x={z.x * CELL + (z.w * CELL) / 2}
                y={z.y * CELL + (z.h * CELL) / 2 + 4}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="9"
                fill={isDark ? 'rgba(232,245,226,0.6)' : 'rgba(26,36,22,0.5)'}
              >
                {z.id}
              </text>
              {z.risk === 'high' && (
                <circle
                  cx={z.x * CELL + z.w * CELL - 10}
                  cy={z.y * CELL + 10}
                  r="5"
                  fill="var(--risk-high)"
                  opacity="0.9"
                >
                  <animate attributeName="r" values="4;6;4" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Zone detail */}
      <div className="mt-4 bg-card-bg border border-risk-high backdrop-blur-md p-4 flex justify-between items-center">
        <div>
          <div className="font-mono text-[0.6rem] text-risk-high tracking-widest mb-1">
            ZONE B3 · ACTIVE CASE
          </div>
          <div className="font-body text-xs text-text-secondary">
            4 converging signals · compound score 0.72
          </div>
        </div>
        <div className="font-mono text-2xl font-bold text-risk-high">
          HIGH
        </div>
      </div>
    </div>
  )
}