import React, { useState } from 'react'
import { Link } from 'react-router-dom'

/* ═══════════════════════════════════════════════════════════════════════════
   RETRIEVAL TRACE — Premium Light Theme
   ═══════════════════════════════════════════════════════════════════════════ */
const P = '#0F1729', S = '#5A6578', M = '#9CA3B4', BD = '#E4E8EF'
const CARD = '#FFFFFF', CARD2 = '#F1F3F7'
const GREEN = '#16A34A', AMBER = '#D97706', ORANGE = '#EA580C', RED = '#DC2626'
const TEAL = '#0D9488', PURPLE = '#7C3AED', BLUE = '#2563EB'
const FD = "'Plus Jakarta Sans', sans-serif"
const FM = "'JetBrains Mono', monospace"
const cs = (shadow = false): React.CSSProperties => ({ background: CARD, borderRadius: 14, border: `1px solid ${BD}`, ...(shadow ? { boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' } : {}) })

const QUERY_FACTORS = [
  { label: 'LEL Gas 18.2%', color: ORANGE }, { label: 'Hot-Work Active', color: ORANGE },
  { label: 'Valve V-302 Overdue', color: AMBER }, { label: 'Shift Understaffing', color: AMBER }, { label: 'Bay 3 Sector B', color: BLUE },
]
const EMBED_PREVIEW = '[0.0821, -0.1432, 0.3021, 0.0071, -0.2193, 0.4412, 0.0033, -0.1872, 0.2941, 0.0611, ...]'
const PIPELINE = [
  { name: 'Normalize', status: 'done', count: 4, color: GREEN }, { name: 'BGE Embed', status: 'done', count: 1, color: PURPLE },
  { name: 'Hybrid Search', status: 'done', count: null, color: TEAL }, { name: 'Qdrant', status: 'done', count: 1847, color: PURPLE },
  { name: 'Rerank', status: 'done', count: 12, color: BLUE }, { name: 'Filter', status: 'done', count: 3, color: AMBER },
  { name: 'Result', status: 'active', count: 3, color: GREEN },
]
const MATCHES = [
  { id: 'INC-2024-1182', score: 0.94, title: 'Bay 3 H₂S + PTW overlap — Nov 2024', tier: 'HIGH', date: '2024-11-03', coll: 'incidents_historical', outcome: 'Permit suspended within 3 minutes. No injury. Area secured for 45 minutes.', matched: ['Gas proximity overlap','Active permit conflict','Same zone geometry'], contribution: 'Strongest precedent — nearly identical compound scenario.', meta: { zone:'BAY-3', gas_type:'H2S', peak:'22% LEL', response:'180s', severity:'HIGH' } },
  { id: 'INC-2023-0774', score: 0.88, title: 'Compressor fault + understaffing — Jul 2023', tier: 'CRITICAL', date: '2023-07-18', coll: 'incidents_historical', outcome: 'Evacuation zone B activated. 12 workers relocated.', matched: ['Understaffing pattern','Equipment fault overlap','Shift handover'], contribution: 'Demonstrates escalation with reduced manning.', meta: { zone:'BAY-4', equipment:'Compressor C-401', evacuated:12, response:'240s', severity:'CRITICAL' } },
  { id: 'INC-2022-0301', score: 0.81, title: 'Gas sensor + CCTV occlusion — Mar 2022', tier: 'HIGH', date: '2022-03-05', coll: 'near_misses', outcome: 'Manual inspection found small valve leak missed by sensors.', matched: ['Sensor blind spot','Maintenance overdue'], contribution: 'Shows compound indicators catch what sensors miss.', meta: { zone:'BAY-3', method:'Manual inspection', leak:'Minor', response:'420s' } },
]
const COLL_STATS = [
  { name: 'incidents_historical', records: 1847, queried: true, latency: '14ms' },
  { name: 'near_misses', records: 671, queried: true, latency: '11ms' },
  { name: 'risk_patterns', records: 312, queried: true, latency: '9ms' },
  { name: 'lessons_learned', records: 423, queried: false, latency: '—' },
  { name: 'safety_procedures', records: 89, queried: false, latency: '—' },
  { name: 'equipment_history', records: 2104, queried: false, latency: '—' },
]
function tierColor(t: string) { switch(t) { case 'CRITICAL': return RED; case 'HIGH': return ORANGE; default: return AMBER } }

export default function RetrievalTrace() {
  const [expanded, setExpanded] = useState<string|null>(null)
  return (
    <div style={{ padding: '20px 24px', color: P, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: FM, fontSize: 11, color: PURPLE, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>STAGE 2 — MEMORY RETRIEVAL</div>
          <h1 style={{ fontFamily: FD, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>Qdrant Organizational Memory</h1>
          <p style={{ fontSize: 13, color: S }}>3 matches across 2 collections · Total latency: <span style={{ fontFamily: FM, fontWeight: 700, color: GREEN }}>34ms</span></p>
        </div>

        {/* Query + Pipeline */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{ ...cs(true), padding: '18px 20px', borderTop: `3px solid ${PURPLE}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: PURPLE, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Query Construction</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {QUERY_FACTORS.map(f => (
                <div key={f.label} style={{ padding: '5px 12px', borderRadius: 100, background: `${f.color}08`, border: `1px solid ${f.color}20`, fontFamily: FM, fontSize: 10, color: f.color, fontWeight: 600 }}>{f.label}</div>
              ))}
            </div>
            <div style={{ background: CARD2, borderRadius: 8, padding: '10px 12px', fontFamily: FM, fontSize: 10, color: M, lineHeight: 1.7, border: `1px solid ${BD}` }}>{EMBED_PREVIEW}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span style={{ fontFamily: FM, fontSize: 10, padding: '2px 8px', borderRadius: 5, background: `${PURPLE}08`, border: `1px solid ${PURPLE}20`, color: PURPLE, fontWeight: 600 }}>bge-large-en-v1.5</span>
              <span style={{ fontFamily: FM, fontSize: 10, color: M }}>1536-dim · float32</span>
            </div>
          </div>

          <div style={{ ...cs(true), padding: '18px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: M, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>Retrieval Pipeline</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 4 }}>
              {PIPELINE.map((s, i) => (
                <React.Fragment key={s.name}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: s.status === 'active' ? `${s.color}08` : `${s.color}05`,
                      border: `2px solid ${s.status === 'active' ? s.color : s.color+'50'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: s.status === 'active' ? `0 0 8px ${s.color}20` : 'none',
                    }}>
                      <span style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, color: s.color }}>{s.count ?? '✓'}</span>
                    </div>
                    <span style={{ fontFamily: FM, fontSize: 9, color: s.status === 'active' ? s.color : M, marginTop: 4, fontWeight: 600 }}>{s.name}</span>
                  </div>
                  {i < PIPELINE.length-1 && <div style={{ width: 20, height: 2, background: BD, flexShrink: 0, marginTop: -14 }} />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Matches */}
        <div style={{ fontSize: 12, fontWeight: 700, color: M, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Top Matches — Similarity Ranked</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          {MATCHES.map((m, idx) => {
            const c = tierColor(m.tier)
            const isExpanded = expanded === m.id
            return (
              <div key={m.id}>
                <div onClick={() => setExpanded(isExpanded ? null : m.id)} style={{ ...cs(true), padding: '20px 24px', borderLeft: `4px solid ${c}`, cursor: 'pointer', animation: `nova-slide-in 0.4s ease-out ${idx*0.1}s both` }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: 20, alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: FM, fontSize: 30, fontWeight: 800, color: m.score > 0.9 ? RED : m.score > 0.85 ? ORANGE : AMBER, letterSpacing: '-0.02em' }}>{m.score}</div>
                      <div style={{ fontFamily: FM, fontSize: 9, color: M, textTransform: 'uppercase', marginTop: 2 }}>similarity</div>
                      <div style={{ height: 4, background: CARD2, borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${m.score*100}%`, background: c, borderRadius: 2 }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontFamily: FM, fontSize: 11, color: M, marginBottom: 4 }}>{m.id} · {m.date} · <span style={{ color: PURPLE }}>{m.coll}</span></div>
                      <div style={{ fontFamily: FD, fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{m.title}</div>
                      <div style={{ fontSize: 12, color: S, marginBottom: 8 }}><strong>Outcome:</strong> {m.outcome}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                        {m.matched.map(t => (<span key={t} style={{ fontFamily: FM, fontSize: 9, padding: '2px 8px', borderRadius: 100, background: `${PURPLE}06`, border: `1px solid ${PURPLE}18`, color: PURPLE }}>{t}</span>))}
                      </div>
                      <div style={{ fontFamily: FM, fontSize: 11, color: TEAL, fontWeight: 500 }}>{m.contribution}</div>
                    </div>
                    <span style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, padding: '5px 14px', borderRadius: 100, background: `${c}08`, border: `1px solid ${c}20`, color: c }}>{m.tier}</span>
                  </div>
                  {isExpanded && (
                    <div style={{ marginTop: 14, padding: '14px 16px', borderRadius: 10, background: CARD2, border: `1px solid ${BD}` }}>
                      <div style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, color: PURPLE, textTransform: 'uppercase', marginBottom: 8 }}>Full Payload</div>
                      <pre style={{ fontFamily: FM, fontSize: 11, color: S, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(m.meta, null, 2)}</pre>
                    </div>
                  )}
                </div>
                {idx < MATCHES.length-1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 0' }}>
                    <div style={{ fontFamily: FM, fontSize: 9, color: M, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 30, height: 1, background: BD }} /> Δ {((MATCHES[idx].score-MATCHES[idx+1].score)*100).toFixed(0)}% gap <div style={{ width: 30, height: 1, background: BD }} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Collections */}
        <div style={{ ...cs(true), padding: '14px 20px', marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: M, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Qdrant Collections</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLL_STATS.map(c => (
              <div key={c.name} style={{ padding: '8px 12px', borderRadius: 8, background: c.queried ? `${PURPLE}04` : 'transparent', border: `1px solid ${c.queried ? PURPLE+'18' : BD}`, flex: '1 1 auto', minWidth: 140 }}>
                <div style={{ fontFamily: FM, fontSize: 10, color: c.queried ? PURPLE : M, fontWeight: 600, marginBottom: 2 }}>{c.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: FM, fontSize: 13, fontWeight: 700, color: P }}>{c.records.toLocaleString()}</span>
                  {c.queried && <span style={{ fontFamily: FM, fontSize: 9, color: GREEN, fontWeight: 600 }}>{c.latency}</span>}
                  {c.queried && <span style={{ fontFamily: FM, fontSize: 8, padding: '1px 5px', borderRadius: 4, background: `${PURPLE}08`, color: PURPLE, fontWeight: 700 }}>QUERIED</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Link to="/signals" style={{ padding: '10px 18px', borderRadius: 10, border: `1px solid ${BD}`, background: CARD, textDecoration: 'none', color: S, fontSize: 13 }}>← Signals</Link>
          <Link to="/voice" style={{ padding: '10px 18px', borderRadius: 10, background: TEAL, color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600, boxShadow: `0 2px 8px ${TEAL}30` }}>Voice Session →</Link>
        </div>
      </div>
    </div>
  )
}
