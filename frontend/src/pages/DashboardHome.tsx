import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

/* ═══════════════════════════════════════════════════════════════════════════
   NOVA MISSION CONTROL — Premium Light Theme
   ═══════════════════════════════════════════════════════════════════════════ */
const P = '#0E0D1F', S = '#62636A', M = '#8E9096', BG = '#F7F6F2'
const CARD = '#FFFFFF', CARD2 = '#E9E9E5', BD = '#C8C9C6'
const GREEN = '#72856C', AMBER = '#D98A3A', ORANGE = '#D98A3A', RED = '#C84B42'
const TEAL = '#0D9488', PURPLE = '#7C3AED', BLUE = '#2563EB'
const FD = "'Plus Jakarta Sans', sans-serif"
const FM = "'JetBrains Mono', monospace"

function tierColor(t: string) {
  switch (t?.toLowerCase()) { case 'critical': return RED; case 'high': return ORANGE; case 'medium': return AMBER; default: return GREEN }
}

const AGENTS = [
  { name: 'Sensor Intel',      color: AMBER,  actions: ['Watching Bay 3 LEL trend','Tracking pressure delta','Monitoring vibration','Sampling compressor temp'] },
  { name: 'Permit Intel',      color: ORANGE, actions: ['Validating PTW-0441','Checking HW-4402 expiry','Scanning active permits','Auditing permit overlap'] },
  { name: 'Ops Context',       color: BLUE,   actions: ['Assembling shift context','Correlating manning level','Building zone snapshot','Checking maintenance queue'] },
  { name: 'Incident Memory',   color: PURPLE, actions: ['Querying Qdrant incidents','Retrieving INC-8921','Similarity scan near_misses','Vector search risk_patterns'] },
  { name: 'Risk Reasoner',     color: RED,    actions: ['Computing compound score','Evaluating 4-signal compound','Cross-domain correlation','Threshold evaluation'] },
  { name: 'Voice Orchestrator', color: TEAL,   actions: ['Preparing voice brief','Streaming to Officer Sharma','Managing barge-in state','Building conversation'] },
  { name: 'Response Agent',    color: GREEN,  actions: ['Preparing permit suspension','Drafting isolation order','Staging muster notification','Compiling action payload'] },
]

const ZONES = [
  { id: 'BAY-1', name: 'Bay 1',        tier: 'low',    score: 12, case: null,             sensors: 3 },
  { id: 'BAY-2', name: 'Bay 2',        tier: 'low',    score: 8,  case: null,             sensors: 4 },
  { id: 'BAY-3', name: 'Bay 3',        tier: 'high',   score: 87, case: 'CASE-2026-0891', sensors: 5 },
  { id: 'BAY-4', name: 'Bay 4',        tier: 'medium', score: 34, case: null,             sensors: 3 },
  { id: 'BAY-5', name: 'Bay 5',        tier: 'low',    score: 6,  case: null,             sensors: 2 },
  { id: 'BAY-6', name: 'Bay 6',        tier: 'low',    score: 15, case: null,             sensors: 4 },
  { id: 'CTRL',  name: 'Control Room', tier: 'low',    score: 3,  case: null,             sensors: 6 },
  { id: 'STOR',  name: 'Storage',      tier: 'low',    score: 5,  case: null,             sensors: 2 },
]

const INCIDENTS = [
  { caseId: 'CASE-2026-0891', zone: 'Bay 3', tier: 'high',   score: 87, signals: 4, memory: 3, stage: 'Voice',   time: '4m 12s' },
  { caseId: 'CASE-2026-0887', zone: 'Bay 4', tier: 'medium', score: 34, signals: 2, memory: 1, stage: 'Signals', time: '12m 08s' },
]

const COLLECTIONS = [
  { name: 'incidents_historical', count: 1847 }, { name: 'lessons_learned', count: 423 },
  { name: 'risk_patterns', count: 312 }, { name: 'near_misses', count: 671 }, { name: 'safety_procedures', count: 89 },
]

const TICKER = [
  { zone: 'BAY-3', source: 'GAS_LEL', value: '18.2%', tier: 'high', time: '14:12:05' },
  { zone: 'BAY-3', source: 'PERMIT',  value: 'HW-4402', tier: 'high', time: '14:12:08' },
  { zone: 'BAY-3', source: 'VALVE',   value: 'V-302',  tier: 'medium', time: '14:11:52' },
  { zone: 'BAY-3', source: 'SHIFT',   value: '2/4',    tier: 'medium', time: '14:10:08' },
  { zone: 'BAY-4', source: 'PRESSURE', value: '2.4 bar', tier: 'low', time: '14:12:01' },
  { zone: 'BAY-1', source: 'TEMP',    value: '78°C',   tier: 'low',   time: '14:11:55' },
  { zone: 'BAY-6', source: 'GAS_LEL', value: '4.1%',   tier: 'low',   time: '14:12:06' },
  { zone: 'BAY-5', source: 'VIBRATION', value: '0.3g', tier: 'low',   time: '14:12:04' },
]

function genSparkline(len: number, base: number, range: number): number[] {
  const a: number[] = []; let v = base
  for (let i = 0; i < len; i++) { v += (Math.random() - 0.48) * range; a.push(Math.max(base - range*2, Math.min(base + range*3, v))) }
  return a
}

function Sparkline({ data, w = 120, h = 30, color = BLUE, threshold }: { data: number[]; w?: number; h?: number; color?: string; threshold?: number }) {
  if (!data.length) return null
  const mn = Math.min(...data)*0.95, mx = Math.max(...data)*1.05, rng = mx-mn||1
  const pts = data.map((v,i) => `${(i/(data.length-1))*w},${h-((v-mn)/rng)*h}`).join(' ')
  const last = data[data.length-1]
  return (
    <svg width={w} height={h} style={{ display:'block' }}>
      {threshold!==undefined && <line x1={0} y1={h-((threshold-mn)/rng)*h} x2={w} y2={h-((threshold-mn)/rng)*h} stroke={RED} strokeWidth={0.8} strokeDasharray="3,2" opacity={0.4} />}
      <polyline fill="none" stroke={color} strokeWidth={1.5} points={pts} opacity={0.8} />
      <circle cx={w} cy={h-((last-mn)/rng)*h} r={2.5} fill={color} />
    </svg>
  )
}

const cs = (shadow = false): React.CSSProperties => ({
  background: CARD, borderRadius: 14, border: `1px solid ${BD}`,
  ...(shadow ? { boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' } : {}),
})

export default function DashboardHome() {
  const [feedItems, setFeedItems] = useState<Array<{ agent: typeof AGENTS[0]; action: string; ts: string; id: number }>>([])
  const [eventCount, setEventCount] = useState(4218)
  const [qdrantQueries, setQdrantQueries] = useState(127)
  const feedIdRef = useRef(0)
  const [gasData, setGas] = useState(() => genSparkline(30, 14, 1.5))
  const [pressData, setPress] = useState(() => genSparkline(30, 2.2, 0.15))
  const [tempData, setTemp] = useState(() => genSparkline(30, 74, 3))
  const [uptime, setUptime] = useState(0)

  useEffect(() => {
    const init = AGENTS.slice(0,5).map((a,i) => ({ agent:a, action:a.actions[0], ts:`14:12:0${i}`, id:feedIdRef.current++ }))
    setFeedItems(init)
    const iv = setInterval(() => {
      const a = AGENTS[Math.floor(Math.random()*AGENTS.length)]
      const act = a.actions[Math.floor(Math.random()*a.actions.length)]
      const n = new Date()
      const ts = `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}`
      setFeedItems(p => [{ agent:a, action:act, ts, id:feedIdRef.current++ }, ...p].slice(0,10))
      setEventCount(p => p+Math.floor(Math.random()*3)+1)
      if (a.name==='Incident Memory') setQdrantQueries(p => p+1)
    }, 3000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const iv = setInterval(() => {
      setGas(p => [...p.slice(1), p[p.length-1]+(Math.random()-0.45)*1.2])
      setPress(p => [...p.slice(1), p[p.length-1]+(Math.random()-0.48)*0.12])
      setTemp(p => [...p.slice(1), p[p.length-1]+(Math.random()-0.47)*2])
    }, 2000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => { const i = setInterval(() => setUptime(p => p+1), 1000); return () => clearInterval(i) }, [])

  return (
    <div style={{ padding: '20px 24px', color: P, fontFamily: "'Inter', sans-serif" }}>

      {/* ── Top Stats Row ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'AI Agents Online', value: '7 / 7', sub: 'All active', color: GREEN },
          { label: 'Events Ingested', value: eventCount.toLocaleString(), sub: 'today', color: BLUE },
          { label: 'Qdrant Queries', value: String(qdrantQueries), sub: `~${Math.round(qdrantQueries/Math.max(1,uptime/60))}/min`, color: PURPLE },
          { label: 'Cases Active', value: '2', sub: '1 high · 1 medium', color: ORANGE },
        ].map(s => (
          <div key={s.label} style={{ ...cs(true), padding: '16px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: M, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: FM, fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1, letterSpacing: '-0.02em' }}>{s.value}</div>
            <div style={{ fontFamily: FM, fontSize: 11, color: M, marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Main grid ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 280px', gap: 16 }}>

        {/* LEFT: Agent Feed */}
        <div style={{ ...cs(true), padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: M, textTransform: 'uppercase', marginBottom: 12 }}>
            Live Agent Activity
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, overflow: 'hidden' }}>
            {feedItems.map((item, i) => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 10px',
                borderRadius: 8, borderLeft: `2px solid ${item.agent.color}`,
                background: i === 0 ? `${item.agent.color}06` : 'transparent',
                animation: i === 0 ? 'nova-slide-in 0.3s ease-out' : undefined,
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.agent.color, flexShrink: 0, marginTop: 4 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FM, fontSize: 10, fontWeight: 600, color: item.agent.color }}>{item.agent.name}</div>
                  <div style={{ fontSize: 11, color: S, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.action}</div>
                </div>
                <div style={{ fontFamily: FM, fontSize: 9, color: M, flexShrink: 0 }}>{item.ts}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, background: `${PURPLE}06`, border: `1px solid ${PURPLE}15` }}>
            <div style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: PURPLE, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Qdrant Queries</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: FM, fontSize: 22, fontWeight: 700, color: PURPLE }}>{qdrantQueries}</span>
              <span style={{ fontFamily: FM, fontSize: 10, color: M }}>total</span>
            </div>
          </div>
        </div>

        {/* CENTER: Plant Map + Incidents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Zone Grid */}
          <div style={{ ...cs(true), padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontFamily: FD, fontSize: 15, fontWeight: 700, color: P }}>Plant Zone Status</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: FM, fontSize: 10, color: TEAL }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: TEAL, animation: 'nova-pulse 2s infinite' }} /> Real-time
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {ZONES.map(z => {
                const c = tierColor(z.tier)
                return (
                  <Link key={z.id} to={z.case ? '/signals' : '#'} style={{
                    padding: '14px', borderRadius: 12, textDecoration: 'none', color: P,
                    background: z.case ? `${c}05` : CARD2,
                    border: `1px solid ${z.case ? c+'25' : BD}`,
                    transition: 'all 0.2s',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{z.name}</span>
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%', background: c,
                        boxShadow: z.case ? `0 0 6px ${c}50` : 'none',
                        animation: z.case ? 'nova-pulse 1.5s infinite' : undefined,
                      }} />
                    </div>
                    <div style={{ fontFamily: FM, fontSize: 24, fontWeight: 700, color: c, lineHeight: 1 }}>
                      {z.score}<span style={{ fontSize: 10, color: M }}>/100</span>
                    </div>
                    <div style={{ marginTop: 6 }}><Sparkline data={genSparkline(10, z.score, z.score*0.05)} w={80} h={14} color={c} /></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ fontFamily: FM, fontSize: 9, color: M }}>{z.sensors} sources</span>
                      {z.case && <span style={{ fontFamily: FM, fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: `${c}10`, color: c }}>ACTIVE</span>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Incidents Table */}
          <div style={{ ...cs(true), padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BD}` }}>
              <span style={{ fontFamily: FD, fontSize: 14, fontWeight: 700 }}>Active Incidents</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: M, display: 'grid', gridTemplateColumns: '130px 60px 60px 50px 50px 60px 70px 70px', padding: '8px 18px', borderBottom: `1px solid ${BD}`, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FM }}>
              <span>Case</span><span>Zone</span><span>Tier</span><span>Score</span><span>Sig</span><span>Mem</span><span>Stage</span><span>Open</span>
            </div>
            {INCIDENTS.map(inc => {
              const c = tierColor(inc.tier)
              return (
                <Link key={inc.caseId} to="/signals" style={{
                  display: 'grid', gridTemplateColumns: '130px 60px 60px 50px 50px 60px 70px 70px',
                  padding: '10px 18px', borderBottom: `1px solid ${BD}`,
                  borderLeft: `3px solid ${c}`, textDecoration: 'none', color: P, fontSize: 12, alignItems: 'center',
                  transition: 'background 0.1s',
                }} onMouseEnter={e => e.currentTarget.style.background = CARD2} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ fontFamily: FM, fontWeight: 600, color: AMBER }}>{inc.caseId}</span>
                  <span style={{ fontFamily: FM, fontSize: 11, color: S }}>{inc.zone}</span>
                  <span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: `${c}08`, color: c }}>{inc.tier.toUpperCase()}</span>
                  <span style={{ fontFamily: FM, fontWeight: 700, color: c }}>{inc.score}</span>
                  <span style={{ fontFamily: FM, color: S }}>{inc.signals}</span>
                  <span style={{ fontFamily: FM, color: PURPLE }}>{inc.memory}</span>
                  <span style={{ fontSize: 11, color: S }}>{inc.stage}</span>
                  <span style={{ fontFamily: FM, fontSize: 11, color: M }}>{inc.time}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* RIGHT: Sensors + Brain + Memory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Sensors */}
          <div style={{ ...cs(true), padding: '16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: M, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Live Sensors</div>
            {[
              { label: 'Gas LEL %', data: gasData, color: ORANGE, threshold: 20, unit: '%' },
              { label: 'Pressure',  data: pressData, color: BLUE, unit: 'bar' },
              { label: 'Temperature', data: tempData, color: RED, unit: '°C' },
            ].map(s => (
              <div key={s.label} style={{ padding: '8px 0', borderBottom: `1px solid ${BD}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: S }}>{s.label}</span>
                  <span style={{ fontFamily: FM, fontSize: 11, color: s.color, fontWeight: 700 }}>{s.data[s.data.length-1]?.toFixed(1)}{s.unit}</span>
                </div>
                <Sparkline data={s.data} w={240} h={28} color={s.color} threshold={s.threshold} />
              </div>
            ))}
          </div>

          {/* Brain metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Analyzed', value: '24', color: BLUE },
              { label: 'Blocked', value: '7', color: GREEN },
              { label: 'Avg Det.', value: '1.8s', color: TEAL },
              { label: 'Matches', value: '31', color: PURPLE },
            ].map(m => (
              <div key={m.label} style={{ ...cs(), padding: '12px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: M, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontFamily: FM, fontSize: 20, fontWeight: 700, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Collections */}
          <div style={{ ...cs(), padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: M, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Memory Collections</div>
            {COLLECTIONS.map(c => (
              <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${BD}` }}>
                <span style={{ fontFamily: FM, fontSize: 10, color: PURPLE }}>{c.name}</span>
                <span style={{ fontFamily: FM, fontSize: 10, fontWeight: 600, color: P }}>{c.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Ticker ──────────────────────────────────── */}
      <div style={{ ...cs(), marginTop: 16, overflow: 'hidden', height: 36, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
        <div style={{ display: 'flex', gap: 32, whiteSpace: 'nowrap', animation: 'nova-ticker-scroll 30s linear infinite' }}>
          {[...TICKER, ...TICKER].map((t, i) => {
            const c = tierColor(t.tier)
            return (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: FM, fontSize: 11 }}>
                <span style={{ color: M }}>{t.zone}</span>
                <span style={{ color: S }}>{t.source}</span>
                <span style={{ color: c, fontWeight: 700 }}>{t.value}</span>
                <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: `${c}08`, color: c }}>{t.tier.toUpperCase()}</span>
                <span style={{ color: M }}>{t.time}</span>
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
