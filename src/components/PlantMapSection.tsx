import { useThemeStore } from '../store/useThemeStore'

const ZONES_LARGE = [
  { id: 'A1', label: 'Distillation Unit', risk: 'low', x: 0, y: 0, w: 3, h: 2, case: null },
  { id: 'A2', label: 'Heat Exchanger Row', risk: 'low', x: 3, y: 0, w: 3, h: 1, case: null },
  { id: 'A3', label: 'Storage Array', risk: 'medium', x: 6, y: 0, w: 2, h: 2, case: null },
  { id: 'B1', label: 'Pump Station', risk: 'low', x: 3, y: 1, w: 3, h: 1, case: null },
  { id: 'B3', label: 'Bay 3 — Compressor', risk: 'high', x: 0, y: 2, w: 3, h: 3, case: 'c_8f21' },
  { id: 'B4', label: 'Control Room', risk: 'low', x: 3, y: 2, w: 3, h: 1, case: null },
  { id: 'C1', label: 'Maintenance Yard', risk: 'low', x: 3, y: 3, w: 2, h: 2, case: null },
  { id: 'C2', label: 'Loading Bay', risk: 'medium', x: 5, y: 3, w: 3, h: 2, case: null },
  { id: 'D1', label: 'Utility Corridor', risk: 'low', x: 0, y: 5, w: 8, h: 1, case: null },
]

const AUDIT_ENTRIES = [
  { ts: '14:42:08', event: 'Gas sensor H2S +8.2% detected — Bay 3', type: 'SENSOR', risk: 'medium' },
  { ts: '14:42:09', event: 'PTW-0441 hot-work permit active — Zone B3', type: 'PERMIT', risk: 'high' },
  { ts: '14:42:11', event: 'Qdrant retrieval — 3 historical matches, top score 0.88', type: 'QDRANT', risk: 'low' },
  { ts: '14:42:12', event: 'Compound score computed: 0.72 → tier HIGH', type: 'VIGIL', risk: 'high' },
  { ts: '14:42:14', event: 'Rime voice call initiated → Officer Sharma', type: 'VOICE', risk: 'high' },
  { ts: '14:42:28', event: 'Officer authorised: permit suspended', type: 'ACTION', risk: 'low' },
]

export default function PlantMapSection() {
  const { theme } = useThemeStore()
  const isDark = theme === 'dark'

  const CELL = 56
  const RISK_FILL: Record<string, string> = {
    low: isDark ? 'rgba(132,255,0,0.05)' : 'rgba(74,103,65,0.08)',
    medium: isDark ? 'rgba(251,191,36,0.12)' : 'rgba(217,119,6,0.1)',
    high: isDark ? 'rgba(249,115,22,0.2)' : 'rgba(234,88,12,0.15)',
  }
  const RISK_STROKE: Record<string, string> = {
    low: isDark ? 'rgba(132,255,0,0.25)' : 'rgba(74,103,65,0.35)',
    medium: 'rgba(251,191,36,0.5)',
    high: 'rgba(249,115,22,0.85)',
  }
  const TEXT_COLOR = isDark ? 'rgba(232,245,226,0.55)' : 'rgba(26,36,22,0.45)'

  return (
    <section className="bg-bg-primary pt-24 pb-0" style={{ paddingTop: '10px' }}>
      <div className="container">
        {/* Header */}
        <div className="mb-12">
          <div className="font-mono text-[0.65rem] tracking-[0.16em] uppercase text-accent mb-3">
            LIVE PLANT RISK VIEW
          </div>
          <h2 className="font-heading text-[clamp(2.5rem,4vw,4rem)] text-text-primary leading-none max-w-[700px]">
            Built for the moment{' '}
            <span className="text-accent">a wrong click has real consequences.</span>
          </h2>
          <p className="font-body text-base font-light text-text-secondary max-w-[560px] leading-relaxed mt-4">
            Fully audit-able decisions with voice recordings, tool-call logs and immutable timestamps. Every action traceable, repeatable, and auditor-ready.
          </p>
        </div>

        {/* Two-column: plant map + audit log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start" style={{ paddingBottom: '10px' }}>
          {/* Plant map */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="font-body font-bold text-sm text-text-primary">
                Facility Floor Plan
              </span>
              <div className="flex gap-2.5">
                {(['low', 'medium', 'high'] as const).map(r => (
                  <span
                    key={r}
                    className="font-mono text-[0.55rem] px-2 py-0.5 uppercase"
                    style={{
                      border: `1px solid ${RISK_STROKE[r]}`,
                      background: RISK_FILL[r],
                      color: isDark ? 'var(--text-secondary)' : 'var(--text-muted)',
                    }}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative border border-[var(--border)] bg-bg-secondary overflow-hidden">
              <div className="scan-overlay" />
              <svg
                width="100%"
                viewBox={`0 0 ${8 * CELL} ${6 * CELL}`}
                xmlns="http://www.w3.org/2000/svg"
                className="block"
              >
                {ZONES_LARGE.map(z => (
                  <g key={z.id} className="cursor-pointer">
                    <rect
                      x={z.x * CELL + 2} y={z.y * CELL + 2}
                      width={z.w * CELL - 4} height={z.h * CELL - 4}
                      fill={RISK_FILL[z.risk]}
                      stroke={RISK_STROKE[z.risk]}
                      strokeWidth={z.risk === 'high' ? 1.5 : 1}
                      rx="2"
                    />
                    {/* Zone ID */}
                    <text
                      x={z.x * CELL + 8} y={z.y * CELL + 18}
                      fontFamily="var(--font-mono)" fontSize="9"
                      fontWeight="700"
                      fill={z.risk === 'high' ? 'var(--risk-high)' : TEXT_COLOR}
                    >{z.id}</text>
                    {/* Zone label (if tall enough) */}
                    {z.h >= 2 && (
                      <text
                        x={z.x * CELL + z.w * CELL / 2}
                        y={z.y * CELL + z.h * CELL / 2 + 5}
                        textAnchor="middle"
                        fontFamily="var(--font-body)" fontSize="8"
                        fill={TEXT_COLOR}
                      >{z.label}</text>
                    )}
                    {/* Case open indicator */}
                    {z.case && (
                      <>
                        <circle
                          cx={z.x * CELL + z.w * CELL - 10}
                          cy={z.y * CELL + 10}
                          r="5"
                          fill="var(--risk-high)"
                          opacity="0.9"
                        >
                          <animate attributeName="r" values="4;7;4" dur="1.2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.2s" repeatCount="indefinite" />
                        </circle>
                        <text
                          x={z.x * CELL + z.w * CELL / 2}
                          y={z.y * CELL + z.h * CELL / 2 + 18}
                          textAnchor="middle"
                          fontFamily="var(--font-mono)" fontSize="7"
                          fill="var(--risk-high)"
                          opacity="0.8"
                        >CASE {z.case}</text>
                      </>
                    )}
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Audit trail preview */}
          <div>
            <div className="font-body font-bold text-sm text-text-primary mb-3 flex justify-between items-center">
              <span>Audit Trail — Case c_8f21</span>
              <span className="font-mono text-[0.6rem] text-accent border border-accent px-2 py-0.5">
                IMMUTABLE
              </span>
            </div>

            <div className="border border-[var(--border)] bg-bg-secondary overflow-hidden">
              {AUDIT_ENTRIES.map((e, i) => (
                <div
                  key={i}
                  className={`flex gap-4 items-start p-3 border-b last:border-b-0 border-[var(--border)] transition-colors duration-200 hover:bg-card-bg ${e.risk === 'high' ? 'bg-risk-high/5' : 'bg-transparent'
                    }`}
                >
                  {/* Timestamp */}
                  <span className="font-mono text-[0.6rem] text-text-muted whitespace-nowrap shrink-0 pt-0.5">
                    {e.ts}
                  </span>
                  {/* Type badge */}
                  <span className="font-mono text-[0.55rem] px-1.5 py-0.5 shrink-0 border border-[var(--border)] text-text-muted bg-bg-panel">
                    {e.type}
                  </span>
                  {/* Event */}
                  <span className="font-body text-xs font-normal text-text-secondary leading-normal">
                    {e.event}
                  </span>
                </div>
              ))}
            </div>

            {/* Export button */}
            <button className="mt-4 bg-transparent border border-[var(--border)] text-text-muted font-mono text-[0.65rem] tracking-wider px-5 py-2 cursor-pointer uppercase transition-colors duration-200 w-full hover:border-accent hover:text-accent">
              Export Audit Trail as JSON ↓
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
