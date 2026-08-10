import React, { useState } from 'react'
import { Link } from 'react-router-dom'

/* ═══════════════════════════════════════════════════════════════════════════
   AUDIT TRAIL — Premium Light Theme
   ═══════════════════════════════════════════════════════════════════════════ */
const P = '#0F1729', S = '#5A6578', M = '#9CA3B4', BD = '#E4E8EF'
const CARD = '#FFFFFF', CARD2 = '#F1F3F7'
const GREEN = '#16A34A', AMBER = '#D97706', ORANGE = '#EA580C', RED = '#DC2626'
const TEAL = '#0D9488', PURPLE = '#7C3AED', BLUE = '#2563EB'
const FD = "'Plus Jakarta Sans', sans-serif"
const FM = "'JetBrains Mono', monospace"
const cs = (shadow = false): React.CSSProperties => ({ background: CARD, borderRadius: 14, border: `1px solid ${BD}`, ...(shadow ? { boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' } : {}) })

const STAGES = [
  { id: 'signals', name: 'Converging Signals', entries: 4, dur: '2m 08s', status: 'done', color: ORANGE },
  { id: 'retrieval', name: 'Qdrant Retrieval', entries: 3, dur: '34ms', status: 'done', color: PURPLE },
  { id: 'voice', name: 'Voice Interaction', entries: 5, dur: '48s', status: 'done', color: TEAL },
  { id: 'confirm', name: 'Confirmation Gate', entries: 2, dur: '12s', status: 'done', color: GREEN },
  { id: 'audit', name: 'Audit Logging', entries: 0, dur: 'Active', status: 'active', color: BLUE },
  { id: 'memory', name: 'Memory Write-back', entries: 0, dur: '—', status: 'pending', color: M },
]

const LOGS = [
  { ts: '2026-08-10T14:12:42Z', step: 'authorization', actor: 'Officer Sharma', desc: 'Permit #HW-4402 suspension authorized', payload: { case_id:'CASE-2026-0891', action:'permit_suspend', permit_id:'HW-4402', decision:'AUTHORIZED', compound_score:87 }, border: GREEN },
  { ts: '2026-08-10T14:12:38Z', step: 'tool.executed', actor: 'Response Agent', desc: 'Permit suspension order dispatched to PASS-v2', payload: { tool:'permit_suspend', target:'HW-4402', system:'PASS-v2', isolation:true, muster:'Delta' }, border: ORANGE },
  { ts: '2026-08-10T14:12:30Z', step: 'voice.turn', actor: 'NOVA', desc: 'Voice response — permit details confirmed', payload: { session_id:'VS-abc123', turn:3, speaker:'NOVA', latency_ms:730 }, border: TEAL },
  { ts: '2026-08-10T14:12:26Z', step: 'voice.interrupt', actor: 'Operator', desc: 'Mid-utterance interruption detected', payload: { turn:2, speaker:'operator', text:'Wait, which permit is active?', barge_in:true }, border: AMBER },
  { ts: '2026-08-10T14:12:18Z', step: 'voice.turn', actor: 'NOVA', desc: 'Initial voice alert via Rime TTS', payload: { turn:1, speaker:'NOVA', rime_model:'mist-v2', ttfb_ms:388 }, border: TEAL },
  { ts: '2026-08-10T14:12:15Z', step: 'retrieval', actor: 'Incident Memory', desc: 'Qdrant: 3 matches (top: 0.94)', payload: { collection:'incidents_historical', matches:3, top_score:0.94, top_id:'INC-2024-1182', latency_ms:14 }, border: PURPLE },
  { ts: '2026-08-10T14:12:12Z', step: 'risk.compound', actor: 'Risk Reasoner', desc: 'Compound score: 87/100 (HIGH)', payload: { score:87, tier:'HIGH', signals:4, window:47, zone:'BAY-3' }, border: ORANGE },
  { ts: '2026-08-10T14:12:08Z', step: 'signal.ingested', actor: 'Permit Intel', desc: 'Hot-Work Permit #HW-4402 active', payload: { event_id:'EV-182', source:'PERMIT_SYS', zone:'BAY-3' }, border: BLUE },
  { ts: '2026-08-10T14:12:05Z', step: 'signal.ingested', actor: 'Sensor Intel', desc: 'Gas LEL: 18.2% (Bay 3)', payload: { event_id:'EV-181', source:'GAS_SENSOR', value:18.2, unit:'%LEL', threshold:20 }, border: BLUE },
  { ts: '2026-08-10T14:11:52Z', step: 'signal.ingested', actor: 'Ops Context', desc: 'Valve V-302 maintenance overdue', payload: { event_id:'EV-183', source:'MAINT_SYS', valve:'V-302', overdue_hours:72 }, border: BLUE },
  { ts: '2026-08-10T14:10:08Z', step: 'signal.ingested', actor: 'Ops Context', desc: 'Shift handover — reduced supervision', payload: { event_id:'EV-184', source:'SHIFT_SYS', supervisors:2, expected:4 }, border: BLUE },
]

const FILTERS = ['ALL', 'SIGNALS', 'RETRIEVAL', 'VOICE', 'ACTIONS']

function stepColor(s: string) { if (s.startsWith('auth')) return GREEN; if (s.startsWith('tool')) return ORANGE; if (s.startsWith('voice')) return TEAL; if (s.startsWith('retrieval')) return PURPLE; if (s.startsWith('risk')) return RED; return BLUE }
function matchFilter(step: string, f: string) { if (f==='ALL') return true; if (f==='SIGNALS') return step.startsWith('signal')||step.startsWith('risk'); if (f==='RETRIEVAL') return step.startsWith('retrieval'); if (f==='VOICE') return step.startsWith('voice'); if (f==='ACTIONS') return step.startsWith('auth')||step.startsWith('tool'); return true }

export default function AuditTrail() {
  const [filter, setFilter] = useState('ALL')
  const [expandedRow, setExpandedRow] = useState<number|null>(null)
  const [activeStage, setActiveStage] = useState<string|null>(null)

  const filtered = activeStage ? LOGS.filter(l => l.step.includes(activeStage)) : LOGS.filter(l => matchFilter(l.step, filter))

  function exportJSON() {
    const blob = new Blob([JSON.stringify(LOGS, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = `NOVA_Audit_CASE-2026-0891.json`; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div style={{ color: P, fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' }}>
      {/* Header */}
      <div style={{ padding: '14px 24px', background: CARD, borderBottom: `1px solid ${BD}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div>
            <div style={{ fontFamily: FM, fontSize: 11, color: BLUE, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>STAGE 5 — AUDIT TRAIL</div>
            <h1 style={{ fontFamily: FD, fontSize: 18, fontWeight: 800 }}>Immutable Audit Log</h1>
          </div>
          <span style={{ fontFamily: FM, fontSize: 12, color: S }}><span style={{ color: P, fontWeight: 700 }}>{LOGS.length}</span> entries</span>
          <span style={{ fontFamily: FM, fontSize: 9, padding: '3px 8px', borderRadius: 5, background: `${GREEN}06`, border: `1px solid ${GREEN}18`, color: GREEN, fontWeight: 700 }}>TAMPER-EVIDENT · APPEND-ONLY</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', gap: 2, background: CARD2, borderRadius: 8, padding: 2 }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => { setFilter(f); setActiveStage(null) }} style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: filter===f && !activeStage ? `${BLUE}08` : 'transparent', color: filter===f && !activeStage ? BLUE : M, fontSize: 10, fontFamily: FM, fontWeight: 600, cursor: 'pointer' }}>{f}</button>
            ))}
          </div>
          <button onClick={exportJSON} style={{ padding: '6px 14px', borderRadius: 8, background: CARD, border: `1px solid ${BD}`, color: S, fontFamily: FM, fontSize: 11, cursor: 'pointer' }}>Export JSON</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', flex: 1, minHeight: 0 }}>
        {/* LEFT: Timeline */}
        <div style={{ borderRight: `1px solid ${BD}`, padding: '16px 14px', overflow: 'auto', background: CARD }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: M, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>Pipeline Timeline</div>
          <div style={{ position: 'relative', paddingLeft: 16 }}>
            <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 2, background: BD, borderRadius: 1 }} />
            {STAGES.map(stage => (
              <div key={stage.id} style={{ position: 'relative', marginBottom: 8, paddingLeft: 20, cursor: 'pointer' }}
                onClick={() => { setActiveStage(activeStage===stage.id ? null : stage.id); setFilter('ALL') }}>
                <div style={{ position: 'absolute', left: 0, top: 12, width: 14, height: 14, borderRadius: '50%', background: stage.status==='active' ? `${stage.color}10` : stage.status==='done' ? `${stage.color}08` : CARD, border: `2px solid ${stage.status==='pending' ? M+'40' : stage.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: stage.status==='active' ? 'nova-pulse 1.5s infinite' : undefined }}>
                  {stage.status==='done' && <div style={{ width: 4, height: 4, borderRadius: '50%', background: stage.color }} />}
                </div>
                <div style={{ background: activeStage===stage.id ? `${stage.color}04` : CARD2, borderRadius: 10, padding: '10px 12px', border: `1px solid ${activeStage===stage.id ? stage.color+'20' : BD}`, transition: 'all 0.15s' }}>
                  <div style={{ fontFamily: FD, fontSize: 12, fontWeight: 600, color: stage.status==='pending' ? M : P, marginBottom: 4 }}>{stage.name}</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ fontFamily: FM, fontSize: 10, color: stage.color, fontWeight: 600 }}>{stage.entries} entries</span>
                    <span style={{ fontFamily: FM, fontSize: 10, color: M }}>{stage.dur}</span>
                    {stage.status==='active' && <span style={{ fontFamily: FM, fontSize: 8, padding: '1px 5px', borderRadius: 4, background: `${stage.color}08`, color: stage.color, fontWeight: 700 }}>LIVE</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Log table */}
        <div style={{ padding: '16px 20px', overflow: 'auto' }}>
          <div style={{ fontFamily: FM, fontSize: 11, fontWeight: 700, color: M, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>{filtered.length} records</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filtered.map((log, idx) => {
              const expanded = expandedRow === idx
              const c = stepColor(log.step)
              return (
                <div key={idx}>
                  <div onClick={() => setExpandedRow(expanded ? null : idx)} style={{
                    display: 'grid', gridTemplateColumns: '160px 120px 1fr 120px', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 10, background: CARD, border: `1px solid ${BD}`, borderLeft: `3px solid ${log.border}`, cursor: 'pointer', transition: 'all 0.15s',
                  }} onMouseEnter={e => e.currentTarget.style.background = CARD2} onMouseLeave={e => e.currentTarget.style.background = CARD}>
                    <span style={{ fontFamily: FM, fontSize: 11, color: M }}>{log.ts.replace('T',' ').replace('Z','')}</span>
                    <span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: `${c}06`, color: c, width: 'fit-content' }}>{log.step}</span>
                    <span style={{ fontSize: 12, color: P }}>{log.desc}</span>
                    <span style={{ fontFamily: FM, fontSize: 10, color: M, textAlign: 'right' }}>{log.actor}</span>
                  </div>
                  {expanded && (
                    <div style={{ margin: '2px 0 4px 16px', padding: '12px 16px', borderRadius: 10, background: CARD2, border: `1px solid ${BD}`, borderLeft: `3px solid ${log.border}` }}>
                      <div style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, color: log.border, textTransform: 'uppercase', marginBottom: 8 }}>Full Payload</div>
                      <pre style={{ fontFamily: FM, fontSize: 11, color: S, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(log.payload, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {/* Integrity footer */}
          <div style={{ marginTop: 20, padding: '10px 14px', borderRadius: 10, background: `${GREEN}04`, border: `1px solid ${GREEN}15`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN }} />
            <span style={{ fontFamily: FM, fontSize: 10, color: GREEN, fontWeight: 700 }}>CHAIN INTEGRITY: VALID</span>
            <span style={{ fontFamily: FM, fontSize: 10, color: M }}>SHA-256 · {LOGS.length} entries · No tampering</span>
          </div>
        </div>
      </div>
    </div>
  )
}
