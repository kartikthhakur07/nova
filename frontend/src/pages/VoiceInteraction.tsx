import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

/* ═══════════════════════════════════════════════════════════════════════════
   VOICE INTERACTION — Premium Light Theme
   ═══════════════════════════════════════════════════════════════════════════ */
const P = '#0F1729', S = '#5A6578', M = '#9CA3B4', BD = '#E4E8EF'
const CARD = '#FFFFFF', CARD2 = '#F1F3F7'
const GREEN = '#16A34A', AMBER = '#D97706', ORANGE = '#EA580C', RED = '#DC2626'
const TEAL = '#0D9488', PURPLE = '#7C3AED', BLUE = '#2563EB'
const FD = "'Plus Jakarta Sans', sans-serif"
const FM = "'JetBrains Mono', monospace"
const cs = (shadow = false): React.CSSProperties => ({ background: CARD, borderRadius: 14, border: `1px solid ${BD}`, ...(shadow ? { boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' } : {}) })

const TRANSCRIPT = [
  { speaker: 'NOVA', time: '14:12:18', text: 'Alert: Hydrocarbon gas sensor in Bay 3 shows a rising trend at 18.2% LEL while Hot Work Permit HW-4402 is active. Historical incident INC-2024-1182 shows 0.94 similarity. Compound risk score is 87/100. I recommend immediate permit suspension.', tag: null },
  { speaker: 'OPERATOR', time: '14:12:26', text: 'Wait, which permit is active right now?', tag: 'INTERRUPT' },
  { speaker: 'NOVA', time: '14:12:27', text: 'Hot-Work Permit HW-4402 — grinding and welding authorized until 16:00, Bay 3 Structure A, Crew Chief Desai. Permit holder has been notified. Do you authorize suspending Permit HW-4402?', tag: 'RESUMED' },
]
const WATERFALL = [
  { label: 'Event Detected', ms: 12, color: ORANGE }, { label: 'Context Assembly', ms: 45, color: BLUE },
  { label: 'Qdrant Retrieval', ms: 34, color: PURPLE }, { label: 'LLM Reasoning', ms: 219, color: BLUE },
  { label: 'Rime TTS', ms: 388, color: TEAL }, { label: 'WS Delivery', ms: 32, color: GREEN },
]
const STATE_STACK = [
  { frame: 'Stack Top', label: 'Active Decision', desc: 'Authorize permit suspension (#HW-4402)', color: ORANGE, active: true },
  { frame: 'Frame 1', label: 'Clarification Answered', desc: 'Which permit is active? — Answered', color: TEAL, active: false },
  { frame: 'Frame 2', label: 'Context Frame', desc: 'Bay 3 LEL Trend + Historical Match', color: BLUE, active: false },
]
const RIME_METRICS = [
  { label: 'Model', value: 'mist-v2', color: TEAL }, { label: 'TTFB', value: '388ms', color: TEAL },
  { label: 'Streaming', value: 'Active', color: GREEN }, { label: 'Barge-in', value: 'Enabled', color: GREEN },
  { label: 'Codec', value: 'Opus', color: S }, { label: 'WS Status', value: 'Open', color: GREEN },
]

function randomBars() { return Array.from({ length: 12 }, () => Math.random() * 0.7 + 0.15) }

export default function VoiceInteraction() {
  const [bars, setBars] = useState(randomBars)
  const [speakerState, setSpeakerState] = useState<'nova'|'operator'|'silent'>('nova')
  const [dur, setDur] = useState(48)

  useEffect(() => { const t = setInterval(() => setBars(randomBars()), 120); return () => clearInterval(t) }, [])
  useEffect(() => {
    const states: Array<'nova'|'operator'|'silent'> = ['nova','operator','silent','nova']; let i = 0
    const t = setInterval(() => { i = (i+1)%states.length; setSpeakerState(states[i]) }, 4000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => { const t = setInterval(() => setDur(p => p+1), 1000); return () => clearInterval(t) }, [])

  const waveColor = speakerState === 'nova' ? TEAL : speakerState === 'operator' ? AMBER : M
  const totalLatency = WATERFALL.reduce((s, w) => s + w.ms, 0)

  return (
    <div style={{ color: P, fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' }}>
      {/* Session Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: CARD, borderBottom: `1px solid ${BD}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {[0.4,0.7,1,0.6,0.3].map((h,i) => <div key={i} style={{ width: 3, height: 10*h*(bars[i]||0.5)+4, background: TEAL, borderRadius: 2, transition: 'height 100ms ease' }} />)}
          </div>
          <span style={{ fontFamily: FD, fontSize: 14, fontWeight: 700, color: TEAL }}>Rime Voice Session</span>
          <span style={{ fontFamily: FM, fontSize: 10, color: M }}>Duration: <span style={{ color: P, fontWeight: 600 }}>{Math.floor(dur/60)}:{String(dur%60).padStart(2,'0')}</span></span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, animation: 'nova-pulse 1.5s infinite' }} />
            <span style={{ fontFamily: FM, fontSize: 10, color: GREEN, fontWeight: 700 }}>LIVE</span>
          </div>
        </div>
        <button style={{ padding: '6px 16px', borderRadius: 8, background: `${RED}06`, border: `1px solid ${RED}20`, color: RED, fontFamily: FM, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>End Session</button>
      </div>

      {/* 3-column */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 300px', flex: 1, minHeight: 0 }}>
        {/* LEFT */}
        <div style={{ borderRight: `1px solid ${BD}`, padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto', background: CARD }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: M, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Barge-in State Stack</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {STATE_STACK.map((s, i) => (
                <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: s.active ? `${s.color}04` : CARD2, border: `1px solid ${s.active ? s.color+'20' : BD}`, borderLeft: `3px solid ${s.color}`, transform: `translateX(${i*4}px)` }}>
                  <div style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: s.color, marginBottom: 3 }}>[{s.frame}] {s.label}</div>
                  <div style={{ fontSize: 12, color: s.active ? P : S }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ ...cs(), padding: '14px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: M, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Voice Analytics</div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: TEAL, fontWeight: 600 }}>NOVA 68%</span>
                <span style={{ fontSize: 10, color: AMBER, fontWeight: 600 }}>Operator 32%</span>
              </div>
              <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: '68%', background: TEAL }} /><div style={{ width: '32%', background: AMBER }} />
              </div>
            </div>
            {[{ label: 'Turn Count', value: '3', color: P }, { label: 'Interruptions', value: '1', color: AMBER }, { label: 'Avg Latency', value: `${totalLatency}ms`, color: TEAL }, { label: 'Barge-ins', value: '1/1', color: GREEN }].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${BD}` }}>
                <span style={{ fontSize: 11, color: S }}>{s.label}</span>
                <span style={{ fontFamily: FM, fontSize: 12, fontWeight: 600, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
          <Link to="/confirm" style={{ ...cs(), padding: '14px', textDecoration: 'none', color: P, display: 'block', borderLeft: `3px solid ${ORANGE}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: ORANGE, animation: 'nova-pulse 1.5s infinite' }} />
              <div><div style={{ fontFamily: FD, fontSize: 13, fontWeight: 700 }}>Confirmation Gate</div><div style={{ fontFamily: FM, fontSize: 10, color: ORANGE }}>AWAITING DECISION →</div></div>
            </div>
          </Link>
        </div>

        {/* CENTER: Conversation */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', overflow: 'auto', background: '#F8F9FB' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: M, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>Live Conversation</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {TRANSCRIPT.map((line, i) => {
              const isNova = line.speaker === 'NOVA'
              return (
                <div key={i} style={{ display: 'flex', flexDirection: isNova ? 'row' : 'row-reverse', gap: 10, animation: `nova-slide-in 0.4s ease-out ${i*0.2}s both` }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: isNova ? `${TEAL}08` : `${AMBER}08`, border: `1px solid ${isNova ? TEAL : AMBER}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FM, fontSize: 10, fontWeight: 700, color: isNova ? TEAL : AMBER }}>{isNova ? 'N' : 'OP'}</div>
                  <div style={{ maxWidth: '75%', padding: '14px 18px', borderRadius: 14, background: CARD, border: `1px solid ${isNova ? TEAL+'15' : AMBER+'15'}`, borderLeft: isNova ? `3px solid ${TEAL}` : undefined, borderRight: !isNova ? `3px solid ${AMBER}` : undefined, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                    {line.tag && <div style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: line.tag === 'INTERRUPT' ? AMBER : TEAL, marginBottom: 6 }}>{line.tag === 'INTERRUPT' ? '⚡ MID-UTTERANCE INTERRUPT' : '↳ RESUMED — CONTEXT PRESERVED'}</div>}
                    <div style={{ fontFamily: FM, fontSize: 10, color: isNova ? TEAL : AMBER, fontWeight: 600, marginBottom: 4 }}>{line.speaker} · {line.time}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.7, color: P }}>{line.text}</div>
                  </div>
                </div>
              )
            })}
            {/* Listening indicator */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: `${TEAL}08`, border: `1px solid ${TEAL}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FM, fontSize: 10, fontWeight: 700, color: TEAL }}>N</div>
              <div style={{ padding: '12px 16px', borderRadius: 14, background: CARD, border: `1px solid ${TEAL}12`, borderLeft: `3px solid ${TEAL}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: TEAL, animation: `nova-pulse 1.2s ease-in-out ${i*0.15}s infinite` }} />)}
                  <span style={{ fontFamily: FM, fontSize: 10, color: TEAL, marginLeft: 4, fontWeight: 600 }}>LISTENING...</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <input placeholder="Type or speak follow-up..." style={{ flex: 1, padding: '11px 16px', borderRadius: 10, background: CARD, border: `1px solid ${BD}`, color: P, fontSize: 13, outline: 'none' }} />
            <button style={{ padding: '11px 20px', borderRadius: 10, background: TEAL, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: `0 2px 8px ${TEAL}30` }}>Send</button>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ borderLeft: `1px solid ${BD}`, padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto', background: CARD }}>
          {/* Waterfall */}
          <div style={{ ...cs(), padding: '14px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: M, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Latency Waterfall</div>
            {WATERFALL.map(w => (
              <div key={w.label} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: S }}>{w.label}</span>
                  <span style={{ fontFamily: FM, fontSize: 11, color: w.color, fontWeight: 700 }}>{w.ms}ms</span>
                </div>
                <div style={{ height: 6, background: CARD2, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(w.ms/totalLatency)*100}%`, background: w.color, borderRadius: 3 }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: `${TEAL}04`, border: `1px solid ${TEAL}15`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: S }}>Total</span>
              <span style={{ fontFamily: FM, fontSize: 15, fontWeight: 700, color: TEAL }}>{totalLatency}ms</span>
            </div>
          </div>
          {/* Rime */}
          <div style={{ ...cs(), padding: '14px', borderTop: `3px solid ${TEAL}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Rime Engine</div>
            {RIME_METRICS.map(m => (
              <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${BD}` }}>
                <span style={{ fontSize: 11, color: S }}>{m.label}</span>
                <span style={{ fontFamily: FM, fontSize: 11, color: m.color, fontWeight: 600 }}>{m.value}</span>
              </div>
            ))}
          </div>
          {/* Waveform */}
          <div style={{ ...cs(), padding: '16px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: M, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Audio Level</span>
              <span style={{ fontFamily: FM, fontSize: 9, padding: '2px 8px', borderRadius: 5, background: `${waveColor}08`, border: `1px solid ${waveColor}20`, color: waveColor, fontWeight: 600 }}>
                {speakerState === 'nova' ? 'NOVA SPEAKING' : speakerState === 'operator' ? 'OPERATOR' : 'SILENT'}
              </span>
            </div>
            <svg width={260} height={80} style={{ display: 'block', margin: '0 auto' }}>
              {bars.map((h, i) => {
                const bh = speakerState === 'silent' ? h*12 : h*36
                const x = i*(260/12), bw = 260/12-4
                return <g key={i}><rect x={x+2} y={40-bh} width={bw} height={bh} fill={waveColor} opacity={0.7} rx={3} style={{ transition: 'all 100ms' }} /><rect x={x+2} y={40} width={bw} height={bh} fill={waveColor} opacity={0.35} rx={3} style={{ transition: 'all 100ms' }} /></g>
              })}
              <line x1={0} y1={40} x2={260} y2={40} stroke={BD} strokeWidth={1} />
            </svg>
          </div>
          <Link to="/confirm" style={{ padding: '11px 18px', borderRadius: 10, background: ORANGE, color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600, textAlign: 'center', boxShadow: `0 2px 8px ${ORANGE}30` }}>Confirmation Gate →</Link>
        </div>
      </div>
    </div>
  )
}
