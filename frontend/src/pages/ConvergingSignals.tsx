import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

/* ═══════════════════════════════════════════════════════════════════════════
   CONVERGING SIGNALS — Premium Light Theme
   ═══════════════════════════════════════════════════════════════════════════ */
const P = '#0F1729', S = '#5A6578', M = '#9CA3B4', BD = '#E4E8EF'
const CARD = '#FFFFFF', CARD2 = '#F1F3F7'
const GREEN = '#16A34A', AMBER = '#D97706', ORANGE = '#EA580C', RED = '#DC2626'
const TEAL = '#0D9488', PURPLE = '#7C3AED', BLUE = '#2563EB'
const FD = "'Plus Jakarta Sans', sans-serif"
const FM = "'JetBrains Mono', monospace"

const cs = (shadow = false): React.CSSProperties => ({
  background: CARD, borderRadius: 14, border: `1px solid ${BD}`,
  ...(shadow ? { boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' } : {}),
})

const EVIDENCE = [
  { id: 'EV-181', source: 'GAS_SENSOR', title: 'LEL Gas Sensor — Bay 3', value: '18.2%', unit: 'LEL', weight: 32, color: ORANGE, tier: 'HIGH', desc: 'Combustible gas reading at 18.2% LEL. Threshold: 20%. Rate: +0.8%/min — breach in ~2.3 minutes.', why: 'Sub-threshold alone but rising rapidly. Combined with active hot-work = detonation precondition.' },
  { id: 'EV-182', source: 'PERMIT_SYS', title: 'Hot-Work Permit #HW-4402', value: 'Active', unit: '', weight: 28, color: ORANGE, tier: 'HIGH', desc: 'Grinding and welding authorized until 16:00 in Bay 3 Structure A. Crew Chief Desai.', why: 'Hot-work creates ignition sources. Alone = routine. With rising gas = compound threat.' },
  { id: 'EV-183', source: 'MAINT_SYS', title: 'Valve V-302 Maintenance Lag', value: '72h', unit: 'overdue', weight: 22, color: AMBER, tier: 'MEDIUM', desc: 'Isolating valve maintenance flag active with incomplete purge on Pipeline Feed 302.', why: 'Incomplete purge = potential hydrocarbon pocket. Combined with gas = compound fuel source.' },
  { id: 'EV-184', source: 'SHIFT_SYS', title: 'Shift Handover Window', value: '2/4', unit: 'supervisors', weight: 18, color: AMBER, tier: 'MEDIUM', desc: 'Shift B team incoming; only 2 of 4 supervisors present during handover.', why: 'Reduced supervision = slower response. Amplifies risk of missed signals.' },
]

const SOURCES = ['Gas LEL', 'Permit', 'Valve', 'Shift', 'CCTV']
const MATRIX = [[1,0.92,0.67,0.41,0.15],[0.92,1,0.55,0.38,0.12],[0.67,0.55,1,0.23,0.08],[0.41,0.38,0.23,1,0.31],[0.15,0.12,0.08,0.31,1]]

function corrColor(v: number) { if (v>0.85) return RED; if (v>0.6) return ORANGE; if (v>0.35) return AMBER; return M }

const TIMELINE = [
  { t: '14:08:08', label: 'Permit', color: ORANGE },
  { t: '14:10:08', label: 'Shift',  color: AMBER },
  { t: '14:11:52', label: 'Valve',  color: AMBER },
  { t: '14:12:02', label: 'CCTV',   color: M },
  { t: '14:12:05', label: 'Gas',    color: ORANGE },
]

export default function ConvergingSignals() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [windowSec, setWindowSec] = useState(47)
  const totalWeight = EVIDENCE.reduce((s, e) => s + e.weight, 0)

  useEffect(() => {
    const iv = setInterval(() => setWindowSec(p => p >= 60 ? 0 : p + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  return (
    <div style={{ padding: '20px 24px', color: P, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Compound Score */}
          <div style={{ ...cs(true), padding: '24px 28px', borderLeft: `4px solid ${ORANGE}` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: M, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Compound Risk Score</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
              <span style={{ fontFamily: FM, fontSize: 56, fontWeight: 800, color: ORANGE, lineHeight: 1, letterSpacing: '-0.03em' }}>87</span>
              <span style={{ fontFamily: FM, fontSize: 16, color: M }}>/100</span>
              <span style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: '#FFF7ED', border: '1px solid #FED7AA', color: ORANGE, marginLeft: 8 }}>HIGH</span>
            </div>
            <div style={{ fontFamily: FM, fontSize: 11, color: ORANGE, letterSpacing: '0.06em', marginBottom: 16, fontWeight: 600 }}>
              INDIVIDUALLY NORMAL · JOINTLY DANGEROUS
            </div>
            {/* Score bar */}
            <div style={{ height: 8, background: '#F1F3F7', borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ height: '100%', width: '87%', borderRadius: 4, background: `linear-gradient(90deg, ${AMBER}, ${ORANGE})` }} />
            </div>
            {/* Weight bar */}
            <div style={{ display: 'flex', height: 22, borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
              {EVIDENCE.map(e => (
                <div key={e.id} style={{ width: `${(e.weight/totalWeight)*100}%`, background: e.color, opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: '#fff' }}>{e.weight}%</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              {EVIDENCE.map(e => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 3, background: e.color, opacity: 0.8 }} />
                  <span style={{ fontSize: 10, color: M }}>{e.source.replace('_',' ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Correlation Matrix */}
          <div style={{ ...cs(true), padding: '20px 24px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: M, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>Signal Correlation Matrix</div>
            <div style={{ display: 'flex', gap: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 26 }}>
                {SOURCES.map(s => (<div key={s} style={{ height: 36, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8 }}><span style={{ fontFamily: FM, fontSize: 10, color: M }}>{s}</span></div>))}
              </div>
              <div>
                <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                  {SOURCES.map(s => (<div key={s} style={{ width: 36, textAlign: 'center' }}><span style={{ fontFamily: FM, fontSize: 9, color: M }}>{s.slice(0,4)}</span></div>))}
                </div>
                {MATRIX.map((row, ri) => (
                  <div key={ri} style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
                    {row.map((v, ci) => (
                      <div key={ci} style={{
                        width: 36, height: 36, borderRadius: 6,
                        background: v===1 ? CARD2 : `${corrColor(v)}${Math.round(v*12+3).toString(16).padStart(2,'0')}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: v>0.85 && v<1 ? `1px solid ${RED}25` : `1px solid ${BD}`,
                      }}>
                        <span style={{ fontFamily: FM, fontSize: 9, color: v===1 ? M : v>0.6 ? P : S, fontWeight: v>0.7 ? 700 : 400 }}>
                          {v===1 ? '—' : v.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ ...cs(), padding: '16px 24px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: M, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>Signal Timeline — Last 5 Minutes</div>
            <div style={{ position: 'relative', height: 52, marginBottom: 4 }}>
              <div style={{ position: 'absolute', top: 18, left: 0, right: 0, height: 2, background: BD, borderRadius: 1 }} />
              {TIMELINE.map((ev, i) => (
                <div key={i} style={{ position: 'absolute', left: `${(i/(TIMELINE.length-1))*100}%`, top: 0, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontFamily: FM, fontSize: 9, color: M, marginBottom: 4 }}>{ev.t}</div>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: ev.color, border: '2px solid #fff', boxShadow: `0 0 0 1px ${BD}` }} />
                  <div style={{ fontFamily: FM, fontSize: 9, color: ev.color, marginTop: 4, fontWeight: 600 }}>{ev.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Window */}
          <div style={{ ...cs(), padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, height: 6, background: CARD2, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(windowSec/60)*100}%`, borderRadius: 3, background: `linear-gradient(90deg, ${BLUE}, ${TEAL})`, transition: 'width 1s linear' }} />
            </div>
            <div style={{ fontFamily: FM, fontSize: 10, color: S, whiteSpace: 'nowrap' }}>
              WINDOW: <span style={{ color: TEAL, fontWeight: 700 }}>{windowSec}s</span>/60s · <span style={{ color: P, fontWeight: 600 }}>4</span> SIGNALS
            </div>
          </div>
        </div>

        {/* RIGHT: Evidence Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: M, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
            Evidence Stream — {EVIDENCE.length} Active Signals
          </div>
          {EVIDENCE.map((ev, idx) => {
            const expanded = expandedId === ev.id
            return (
              <div key={ev.id} onClick={() => setExpandedId(expanded ? null : ev.id)} style={{
                ...cs(true), padding: '16px 20px', borderLeft: `3px solid ${ev.color}`, cursor: 'pointer',
                animation: `nova-slide-in 0.4s ease-out ${idx*0.08}s both`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${ev.color}08`, border: `1px solid ${ev.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.color }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: FD, fontSize: 14, fontWeight: 600, color: P }}>{ev.title}</div>
                      <div style={{ fontFamily: FM, fontSize: 10, color: M }}>{ev.id} · {ev.source}</div>
                    </div>
                  </div>
                  <span style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: `${ev.color}08`, color: ev.color }}>{ev.tier}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 8 }}>
                  <div>
                    <span style={{ fontFamily: FM, fontSize: 26, fontWeight: 700, color: ev.color }}>{ev.value}</span>
                    {ev.unit && <span style={{ fontFamily: FM, fontSize: 11, color: M, marginLeft: 4 }}>{ev.unit}</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 10, color: M }}>Weight</span>
                      <span style={{ fontFamily: FM, fontSize: 10, color: ev.color, fontWeight: 700 }}>{ev.weight}%</span>
                    </div>
                    <div style={{ height: 4, background: CARD2, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${ev.weight}%`, background: ev.color, borderRadius: 2 }} />
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: S, lineHeight: 1.6 }}>{ev.desc}</div>
                {expanded && (
                  <div style={{ marginTop: 10, padding: '12px 14px', borderRadius: 8, background: `${ev.color}04`, border: `1px solid ${ev.color}12` }}>
                    <div style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, color: ev.color, textTransform: 'uppercase', marginBottom: 6 }}>Why This Matters</div>
                    <div style={{ fontSize: 12, color: S, lineHeight: 1.65 }}>{ev.why}</div>
                  </div>
                )}
              </div>
            )
          })}
          <div style={{ display: 'flex', gap: 10, marginTop: 8, justifyContent: 'flex-end' }}>
            <Link to="/" style={{ padding: '10px 18px', borderRadius: 10, border: `1px solid ${BD}`, background: CARD, textDecoration: 'none', color: S, fontSize: 13, fontWeight: 500 }}>← Overview</Link>
            <Link to="/retrieval" style={{ padding: '10px 18px', borderRadius: 10, background: PURPLE, color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600, boxShadow: `0 2px 8px ${PURPLE}30` }}>Qdrant Retrieval →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
