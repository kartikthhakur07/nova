import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

/* ═══════════════════════════════════════════════════════════════════════════
   CONFIRMATION — Premium Light Theme
   ═══════════════════════════════════════════════════════════════════════════ */
const P = '#0F1729', S = '#5A6578', M = '#9CA3B4', BD = '#E4E8EF'
const CARD = '#FFFFFF', CARD2 = '#F1F3F7'
const GREEN = '#16A34A', AMBER = '#D97706', ORANGE = '#EA580C', RED = '#DC2626'
const TEAL = '#0D9488', PURPLE = '#7C3AED', BLUE = '#2563EB'
const FD = "'Plus Jakarta Sans', sans-serif"
const FM = "'JetBrains Mono', monospace"
const cs = (shadow = false): React.CSSProperties => ({ background: CARD, borderRadius: 14, border: `1px solid ${BD}`, ...(shadow ? { boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' } : {}) })

export default function Confirmation() {
  const [decision, setDecision] = useState<'pending'|'approved'|'denied'>('pending')
  const [timer, setTimer] = useState(300)

  useEffect(() => {
    if (decision !== 'pending') return
    const t = setInterval(() => setTimer(p => Math.max(0, p-1)), 1000)
    return () => clearInterval(t)
  }, [decision])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (decision !== 'pending') return
      if (e.key === 'Escape') setDecision('denied')
      if (e.key === 'Enter') setDecision('approved')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [decision])

  const urgent = timer < 60

  if (decision === 'pending') {
    return (
      <div style={{ padding: '20px 24px', color: P, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          {/* Alert bar */}
          <div style={{ ...cs(true), padding: '14px 18px', borderLeft: `4px solid ${ORANGE}`, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: ORANGE, animation: 'nova-pulse 1.5s infinite' }} />
              <span style={{ fontSize: 13, color: P }}>NOVA identified a <strong style={{ color: ORANGE }}>compound risk</strong> requiring immediate authorization.</span>
            </div>
            <span style={{ fontFamily: FM, fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 8, background: '#FFF7ED', border: '1px solid #FED7AA', color: ORANGE }}>87/100</span>
          </div>

          {/* Stage */}
          <div style={{ fontFamily: FM, fontSize: 11, color: ORANGE, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>STAGE 4 — CONFIRMATION GATE</div>
          <h1 style={{ fontFamily: FD, fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 20 }}>High-Stakes Authorization Required</h1>

          {/* Decision Card */}
          <div style={{ ...cs(true), padding: '28px 32px', borderTop: `3px solid ${ORANGE}`, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontFamily: FM, fontSize: 11, color: M }}>Action: <span style={{ color: AMBER, fontWeight: 600 }}>ACT-901</span></span>
                <span style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#FFF7ED', color: ORANGE }}>HIGH</span>
              </div>
              <span style={{ fontFamily: FM, fontSize: 10, color: M }}>Policy: SR-09</span>
            </div>

            <h2 style={{ fontFamily: FD, fontSize: 20, fontWeight: 700, lineHeight: 1.4, marginBottom: 24, color: P }}>
              Suspend Hot-Work Permit #HW-4402 and initiate safety isolation on Bay 3 gas supply.
            </h2>

            {/* 3 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 28 }}>
              <div style={{ ...cs(), padding: '16px 18px' }}>
                <div style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, color: BLUE, textTransform: 'uppercase', marginBottom: 10 }}>Why — Evidence</div>
                {[{ l: 'Gas LEL', v: '18.2%', d: '+0.8%/min' }, { l: 'Active Permit', v: 'HW-4402', d: 'Same zone' }, { l: 'Valve V-302', v: '72h overdue', d: 'Purge incomplete' }, { l: 'Manning', v: '2/4', d: 'Handover' }].map(e => (
                  <div key={e.l} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: S }}>{e.l}</span>
                      <span style={{ fontFamily: FM, fontSize: 11, color: ORANGE, fontWeight: 700 }}>{e.v}</span>
                    </div>
                    <div style={{ fontFamily: FM, fontSize: 9, color: M }}>{e.d}</div>
                  </div>
                ))}
                <div style={{ marginTop: 8, padding: '6px 8px', borderRadius: 6, background: `${PURPLE}04`, border: `1px solid ${PURPLE}12`, fontFamily: FM, fontSize: 9, color: PURPLE }}>Precedent: INC-2024-1182 (0.94)</div>
              </div>

              <div style={{ ...cs(), padding: '16px 18px' }}>
                <div style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, color: AMBER, textTransform: 'uppercase', marginBottom: 10 }}>What — Before → After</div>
                {[{ l: 'Permit', b: 'ACTIVE', a: 'SUSPENDED' }, { l: 'Gas Supply', b: 'OPEN', a: 'ISOLATED' }, { l: 'Crew', b: 'WORKING', a: 'MUSTERED' }, { l: 'Protocol', b: 'STANDARD', a: 'ENHANCED' }].map(s => (
                  <div key={s.l} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${BD}` }}>
                    <div style={{ fontSize: 11, color: S, marginBottom: 2 }}>{s.l}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: FM, fontSize: 10, color: RED, textDecoration: 'line-through' }}>{s.b}</span>
                      <span style={{ color: M }}>→</span>
                      <span style={{ fontFamily: FM, fontSize: 10, color: GREEN, fontWeight: 700 }}>{s.a}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ ...cs(), padding: '16px 18px' }}>
                <div style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, color: GREEN, textTransform: 'uppercase', marginBottom: 10 }}>Safety Assessment</div>
                {[{ l: 'Confidence', v: '94%', c: GREEN }, { l: 'Outcome', v: 'No injury (INC-1182)', c: GREEN }, { l: 'Compound', v: '87/100', c: ORANGE }, { l: 'Elapsed', v: `${300-timer}s`, c: timer < 120 ? AMBER : S }].map(s => (
                  <div key={s.l} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: S, marginBottom: 2 }}>{s.l}</div>
                    <div style={{ fontFamily: FM, fontSize: 12, color: s.c, fontWeight: 700 }}>{s.v}</div>
                  </div>
                ))}
                <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: urgent ? `${RED}04` : `${AMBER}04`, border: `1px solid ${urgent ? RED+'15' : AMBER+'15'}` }}>
                  <div style={{ fontFamily: FM, fontSize: 9, color: urgent ? RED : AMBER, fontWeight: 700 }}>AUTO-ESCALATION IN</div>
                  <div style={{ fontFamily: FM, fontSize: 20, fontWeight: 800, color: urgent ? RED : AMBER, animation: urgent ? 'nova-flash 0.8s infinite' : undefined }}>
                    {Math.floor(timer/60)}:{String(timer%60).padStart(2,'0')}
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 14 }}>
              <button onClick={() => setDecision('denied')} style={{
                flex: 1, padding: '14px 20px', borderRadius: 12, background: `${RED}05`, border: `1px solid ${RED}25`, color: RED, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 0.15s',
              }} onMouseEnter={e => e.currentTarget.style.background = `${RED}0A`} onMouseLeave={e => e.currentTarget.style.background = `${RED}05`}>
                Dismiss <span style={{ fontFamily: FM, fontSize: 9, color: M, marginLeft: 4 }}>ESC</span>
              </button>
              <button onClick={() => setDecision('approved')} style={{
                flex: 2, padding: '14px 20px', borderRadius: 12, background: GREEN, border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif", boxShadow: `0 4px 16px ${GREEN}30`, transition: 'all 0.15s',
              }} onMouseEnter={e => e.currentTarget.style.boxShadow = `0 6px 20px ${GREEN}45`} onMouseLeave={e => e.currentTarget.style.boxShadow = `0 4px 16px ${GREEN}30`}>
                ✓ Authorize & Execute <span style={{ fontFamily: FM, fontSize: 9, opacity: 0.7, marginLeft: 4 }}>ENTER</span>
              </button>
            </div>
            <div style={{ fontFamily: FM, fontSize: 10, color: M, textAlign: 'center', marginTop: 14 }}>Decision logged to immutable audit trail.</div>
          </div>
        </div>
      </div>
    )
  }

  const isApproved = decision === 'approved'
  const accent = isApproved ? GREEN : RED
  return (
    <div style={{ padding: '20px 24px', color: P, fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)' }}>
      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
        <div style={{ ...cs(true) as any, padding: '48px 40px', borderTop: `4px solid ${accent}` }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${accent}08`, border: `2px solid ${accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28, color: accent }}>{isApproved ? '✓' : '✕'}</div>
          <h2 style={{ fontFamily: FD, fontSize: 26, fontWeight: 800, color: accent, marginBottom: 12, letterSpacing: '-0.02em' }}>{isApproved ? 'Action Authorized' : 'Action Denied'}</h2>
          <p style={{ fontSize: 14, color: S, lineHeight: 1.65, maxWidth: 400, margin: '0 auto 24px' }}>
            {isApproved ? 'Permit #HW-4402 suspended. Crew notified to muster at Delta. Bay 3 gas isolation initiated.' : 'Authorization denied. NOVA continues monitoring and will auto-escalate if score exceeds 90.'}
          </p>
          <div style={{ fontFamily: FM, fontSize: 11, color: M, marginBottom: 24 }}>Officer Sharma · <span style={{ color: AMBER }}>{new Date().toISOString().split('T')[1].split('.')[0]}</span></div>
          <Link to="/audit" style={{ display: 'inline-flex', padding: '12px 24px', borderRadius: 10, background: CARD2, border: `1px solid ${BD}`, color: P, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>View Audit Trail →</Link>
        </div>
      </div>
    </div>
  )
}
