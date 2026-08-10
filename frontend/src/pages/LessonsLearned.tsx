import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCaseStore } from '../store/useCaseStore'

/* ═══════════════════════════════════════════════════════════════════════════
   LESSONS LEARNED — Premium Light Theme
   ═══════════════════════════════════════════════════════════════════════════ */
const P = '#0F1729', S = '#5A6578', M = '#9CA3B4', BD = '#E4E8EF'
const CARD = '#FFFFFF', CARD2 = '#F1F3F7'
const GREEN = '#16A34A', AMBER = '#D97706', ORANGE = '#EA580C', RED = '#DC2626'
const TEAL = '#0D9488', PURPLE = '#7C3AED', BLUE = '#2563EB'
const FD = "'Plus Jakarta Sans', sans-serif"
const FM = "'JetBrains Mono', monospace"
const cs = (shadow = false): React.CSSProperties => ({ background: CARD, borderRadius: 14, border: `1px solid ${BD}`, ...(shadow ? { boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' } : {}) })

const LESSON = {
  id: 'LSN-2026-0891', caseId: 'CASE-2026-0891',
  summary: 'Compound risk from convergence of rising combustible gas (18.2% LEL), active hot-work permit, incomplete valve purge, and reduced shift supervision. Historical pattern INC-2024-1182 (0.94 match). Timely permit suspension prevented potential ignition.',
  factors: ['Gas LEL approaching threshold','Hot-work ignition source','Valve purge incomplete','Shift understaffing','Multi-signal convergence'],
  collections: ['incidents_historical','lessons_learned','risk_patterns'],
  vectorId: 'vec_8f21a3c4', model: 'bge-large-en-v1.5',
}
const RULES = [
  { cond: 'Gas LEL > 15% AND active hot-work in same zone', thresh: 'Compound ≥ 60', action: 'Voice alert + permit review' },
  { cond: 'Valve maintenance overdue > 48h AND gas rising', thresh: 'Rate > 0.5%/min', action: 'Automated inspection order' },
  { cond: 'Shift handover + < 50% supervisor coverage', thresh: 'During active incidents', action: 'Escalation timer → 2 minutes' },
]
const RELATED = [
  { id: 'INC-2024-1182', sim: 0.94, title: 'Bay 3 H₂S + PTW overlap — Nov 2024', coll: 'incidents_historical', color: ORANGE },
  { id: 'INC-2023-0774', sim: 0.88, title: 'Compressor fault + understaffing — Jul 2023', coll: 'incidents_historical', color: RED },
  { id: 'LSN-2024-0412', sim: 0.76, title: 'Cross-zone gas propagation lesson', coll: 'lessons_learned', color: PURPLE },
]
const COLLECTIONS = [
  { name: 'incidents_historical', count: 1848, latest: 'CASE-2026-0891', ts: '2m ago' },
  { name: 'lessons_learned', count: 424, latest: 'LSN-2026-0891', ts: 'Just now' },
  { name: 'risk_patterns', count: 313, latest: 'RP-compound-gas-permit', ts: '2m ago' },
  { name: 'near_misses', count: 671, latest: 'NM-2026-0044', ts: '3d ago' },
  { name: 'safety_procedures', count: 89, latest: 'SP-bay-isolation-v3', ts: '2w ago' },
]

export default function LessonsLearned() {
  const lessonWritten = useCaseStore(s => s.lessonWritten)
  const [activeColl, setActiveColl] = useState('lessons_learned')

  return (
    <div style={{ padding: '20px 24px', color: P, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: FM, fontSize: 11, color: GREEN, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>STAGE 6 — MEMORY & LESSONS</div>
          <h1 style={{ fontFamily: FD, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>Memory Intelligence Dashboard</h1>
          <p style={{ fontSize: 13, color: S }}>The learning loop: incident → lesson → organizational memory → future prevention</p>
        </div>

        {/* Write status */}
        <div style={{ ...cs(true), padding: '20px 24px', borderLeft: `4px solid ${GREEN}`, marginBottom: 20, background: `${GREEN}02` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${GREEN}08`, border: `2px solid ${GREEN}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: GREEN }}>✓</div>
            <div>
              <div style={{ fontFamily: FD, fontSize: 15, fontWeight: 700, color: GREEN }}>Lesson Written to Organizational Memory</div>
              <div style={{ fontFamily: FM, fontSize: 10, color: M, marginTop: 2 }}>{LESSON.id} · {LESSON.vectorId} · {LESSON.model}</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              {LESSON.collections.map(c => <span key={c} style={{ fontFamily: FM, fontSize: 9, padding: '2px 8px', borderRadius: 100, background: `${PURPLE}06`, border: `1px solid ${PURPLE}15`, color: PURPLE }}>{c}</span>)}
            </div>
          </div>
          <div style={{ padding: '14px 18px', borderRadius: 10, background: CARD, border: `1px solid ${BD}`, fontSize: 13, color: S, lineHeight: 1.7 }}>{LESSON.summary}</div>
        </div>

        {/* 3 columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{ ...cs(true), padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: M, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>This Lesson Covers</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {LESSON.factors.map(f => <div key={f} style={{ padding: '6px 12px', borderRadius: 8, background: `${BLUE}06`, border: `1px solid ${BLUE}15`, fontSize: 12, color: BLUE, fontWeight: 500 }}>{f}</div>)}
            </div>
          </div>

          <div style={{ ...cs(true), padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: M, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Matching Rules for Future</div>
            {RULES.map((r, i) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: CARD2, border: `1px solid ${BD}`, borderLeft: `3px solid ${GREEN}`, marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: P, fontWeight: 500, marginBottom: 4 }}>{r.cond}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: FM, fontSize: 9, color: AMBER }}>{r.thresh}</span>
                  <span style={{ fontFamily: FM, fontSize: 9, color: GREEN }}>→ {r.action}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ ...cs(true), padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: M, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Related Memories</div>
            {RELATED.map(m => (
              <div key={m.id} style={{ padding: '10px 12px', borderRadius: 10, background: CARD2, border: `1px solid ${BD}`, borderLeft: `3px solid ${m.color}`, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: FM, fontSize: 10, color: M }}>{m.id}</span>
                  <span style={{ fontFamily: FM, fontSize: 10, color: m.color, fontWeight: 700 }}>{m.sim}</span>
                </div>
                <div style={{ fontSize: 12, color: P, fontWeight: 500, marginBottom: 3 }}>{m.title}</div>
                <span style={{ fontFamily: FM, fontSize: 9, padding: '1px 6px', borderRadius: 100, background: `${PURPLE}06`, color: PURPLE }}>{m.coll}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Collection browser */}
        <div style={{ ...cs(true), overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${BD}`, padding: '0 16px' }}>
            {COLLECTIONS.map(col => (
              <button key={col.name} onClick={() => setActiveColl(col.name)} style={{ padding: '10px 16px', border: 'none', borderBottom: activeColl===col.name ? `2px solid ${PURPLE}` : '2px solid transparent', background: 'transparent', color: activeColl===col.name ? PURPLE : M, fontFamily: FM, fontSize: 11, cursor: 'pointer', fontWeight: activeColl===col.name ? 700 : 400 }}>
                {col.name} <span style={{ marginLeft: 4, fontFamily: FM, fontSize: 9, padding: '1px 5px', borderRadius: 100, background: activeColl===col.name ? `${PURPLE}08` : CARD2, color: activeColl===col.name ? PURPLE : M }}>{col.count}</span>
              </button>
            ))}
          </div>
          <div style={{ padding: '16px 20px' }}>
            {COLLECTIONS.filter(c => c.name===activeColl).map(col => (
              <div key={col.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: FD, fontSize: 15, fontWeight: 700 }}>{col.name}</div>
                    <div style={{ fontFamily: FM, fontSize: 11, color: M, marginTop: 2 }}><span style={{ color: P, fontWeight: 700 }}>{col.count.toLocaleString()}</span> records · Latest: <span style={{ color: PURPLE }}>{col.latest}</span> · {col.ts}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {[
                    { id: col.latest, desc: 'Latest entry for this collection', ts: col.ts, hl: true },
                    { id: `${col.name.slice(0,3).toUpperCase()}-${Math.floor(Math.random()*900+100)}`, desc: 'Compound risk — gas + maintenance', ts: '1d ago', hl: false },
                    { id: `${col.name.slice(0,3).toUpperCase()}-${Math.floor(Math.random()*900+100)}`, desc: 'Cross-zone propagation scenario', ts: '3d ago', hl: false },
                  ].map((rec, i) => (
                    <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: rec.hl ? `${GREEN}03` : CARD2, border: `1px solid ${rec.hl ? GREEN+'18' : BD}`, borderLeft: `3px solid ${rec.hl ? GREEN : BD}` }}>
                      <div style={{ fontFamily: FM, fontSize: 10, color: rec.hl ? GREEN : PURPLE, fontWeight: 600, marginBottom: 4 }}>{rec.id}</div>
                      <div style={{ fontSize: 11, color: S, marginBottom: 4 }}>{rec.desc}</div>
                      <div style={{ fontFamily: FM, fontSize: 9, color: M }}>{rec.ts}</div>
                      {rec.hl && <span style={{ display: 'inline-block', marginTop: 4, fontFamily: FM, fontSize: 8, padding: '1px 5px', borderRadius: 4, background: `${GREEN}08`, color: GREEN, fontWeight: 700 }}>NEW</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 20, alignItems: 'center' }}>
          <Link to="/audit" style={{ padding: '10px 18px', borderRadius: 10, border: `1px solid ${BD}`, background: CARD, textDecoration: 'none', color: S, fontSize: 13 }}>← Audit Trail</Link>
          <div style={{ fontFamily: FM, fontSize: 10, color: M }}>Memory loop complete · <span style={{ color: GREEN, fontWeight: 600 }}>Case lifecycle closed</span></div>
          <Link to="/" style={{ padding: '10px 18px', borderRadius: 10, background: BLUE, color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600, boxShadow: `0 2px 8px ${BLUE}30` }}>Mission Control →</Link>
        </div>
      </div>
    </div>
  )
}
