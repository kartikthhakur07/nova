/**
 * frontend/src/pages/DemoControl.tsx — Full rebuild
 *
 * Features:
 * - Scenario selector: hero | false_alarm | escalation | second_incident
 * - Play / Pause / Reset controls
 * - Timeline scrubber showing events with tick marks
 * - Live benchmark metrics updating as scenario runs
 * - WebSocket event log (last 20)
 * - API + WS health indicators
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSessionSocket } from '../ws/useSessionSocket'
import { playScenario, resetScenario, getDemoStatus } from '../services/api'
import type { DemoStatus } from '../types/api'
import {
  Play, Square, RefreshCw, ChevronRight, Activity,
  Zap, Clock, CheckCircle, AlertTriangle, Wifi, WifiOff
} from 'lucide-react'

// ── design tokens ──────────────────────────────────────────────────────────
const BG   = '#0B1120'
const CARD = '#0F1729'
const BD   = 'rgba(148,163,184,0.12)'
const P    = '#F1F5F9'
const S    = '#94A3B8'
const M    = '#475569'
const GREEN  = '#16A34A'
const AMBER  = '#D97706'
const BLUE   = '#2563EB'
const RED    = '#DC2626'
const TEAL   = '#0D9488'
const PURPLE = '#7C3AED'
const FD = "'Plus Jakarta Sans', sans-serif"
const FM = "'JetBrains Mono', monospace"

// ── scenario metadata ──────────────────────────────────────────────────────
const SCENARIOS = [
  {
    id: 'hero_scenario',
    label: 'Hero Scenario',
    description: 'Bay 3 compound-risk arc: gas drift + hot-work permit + compressor fault + shift changeover → VIGIL proactive call → authorization → resolution → lesson learned.',
    events: 12,
    duration: '~2 min',
    color: BLUE,
    badge: 'PRIMARY',
  },
  {
    id: 'false_alarm_scenario',
    label: 'False Alarm',
    description: 'Single elevated gas reading without corroborating signals. VIGIL correctly assigns low compound score and does not escalate.',
    events: 4,
    duration: '~30s',
    color: GREEN,
    badge: 'QA',
  },
  {
    id: 'escalation_scenario',
    label: 'Escalation',
    description: 'Officer does not respond within timeout window. VIGIL auto-escalates to plant manager — tests the escalation ladder.',
    events: 8,
    duration: '~90s',
    color: AMBER,
    badge: 'EDGE',
  },
  {
    id: 'second_incident',
    label: 'Second Incident (Memory Proof)',
    description: 'Similar Bay 3 signature after the hero scenario lesson has been written. VIGIL detects it faster and cites the lesson — proof the system learned.',
    events: 6,
    duration: '~60s',
    color: PURPLE,
    badge: 'DEMO',
  },
]

// ── hero scenario timeline events (for scrubber display) ──────────────────
const HERO_TIMELINE = [
  { offset: 0,   label: 'Shift changeover warning',       source: 'shift',       tier: 'elevated' },
  { offset: 5,   label: 'Gas sensor baseline established', source: 'gas_sensor',  tier: 'normal' },
  { offset: 10,  label: 'Compressor C-14 drift flagged',   source: 'maintenance', tier: 'elevated' },
  { offset: 15,  label: 'Hot-work permit P-2291 activated', source: 'permit',     tier: 'elevated' },
  { offset: 20,  label: 'Gas +5% above baseline',          source: 'gas_sensor',  tier: 'elevated' },
  { offset: 25,  label: 'SCADA pressure trending',          source: 'scada',       tier: 'normal' },
  { offset: 30,  label: '⚡ Gas +8% — compound threshold',  source: 'gas_sensor',  tier: 'critical' },
  { offset: 35,  label: 'Shift window tightens (15 min)',   source: 'shift',       tier: 'elevated' },
  { offset: 40,  label: 'Worker enters hot-work zone',      source: 'cctv',        tier: 'elevated' },
  { offset: 45,  label: '🔊 VIGIL proactive call initiated', source: 'vigil',      tier: 'critical' },
  { offset: 120, label: '✓ Permit P-2291 suspended',        source: 'permit',      tier: 'normal' },
  { offset: 125, label: 'Gas normalizing — case resolved',  source: 'gas_sensor',  tier: 'normal' },
]

const TIER_COLOR: Record<string, string> = {
  critical: RED, elevated: AMBER, normal: GREEN
}

function typeColor(source: string): string {
  switch (source) {
    case 'gas_sensor': return TEAL
    case 'permit':     return AMBER
    case 'maintenance': return PURPLE
    case 'shift':      return BLUE
    case 'cctv':       return GREEN
    case 'vigil':      return BLUE
    default:           return S
  }
}

export default function DemoControl() {
  const [selectedScenario, setSelectedScenario] = useState('hero_scenario')
  const [status, setStatus] = useState<DemoStatus | null>(null)
  const [apiHealth, setApiHealth] = useState<'checking' | 'ok' | 'error'>('checking')
  const [wsEvents, setWsEvents] = useState<Array<Record<string, unknown>>>([])
  const [metrics, setMetrics] = useState({ signals: 0, riskScore: 0, qdrantHits: 0, voiceCalls: 0, auditEntries: 0 })
  const [playedOffset, setPlayedOffset] = useState<number | null>(null)
  const eventLogRef = useRef<HTMLDivElement>(null)

  const { status: wsStatus } = useSessionSocket('demo-session', useCallback((msg: Record<string, unknown>) => {
    setWsEvents(prev => [msg, ...prev].slice(0, 20))

    // Update live metrics from WS events
    const type = msg.type as string
    if (type === 'risk.updated') {
      const payload = msg.payload as any
      setMetrics(m => ({
        ...m,
        signals: m.signals + (payload?.evidence?.length ?? 1),
        riskScore: Math.round((payload?.compound_score ?? m.riskScore / 100) * 100),
      }))
    }
    if (type === 'audit.entry') setMetrics(m => ({ ...m, auditEntries: m.auditEntries + 1 }))
    if (type === 'voice.speak') setMetrics(m => ({ ...m, voiceCalls: m.voiceCalls + 1 }))
    if (type === 'memory.write_back') setMetrics(m => ({ ...m, qdrantHits: m.qdrantHits + 1 }))
  }, []))

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getDemoStatus()
      setStatus(data)
      setApiHealth('ok')
    } catch {
      setApiHealth('error')
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const id = setInterval(fetchStatus, 2000)
    return () => clearInterval(id)
  }, [fetchStatus])

  const handlePlay = async () => {
    setMetrics({ signals: 0, riskScore: 0, qdrantHits: 0, voiceCalls: 0, auditEntries: 0 })
    setPlayedOffset(0)
    try {
      await playScenario(selectedScenario)
      fetchStatus()
    } catch (err) { console.error(err) }
  }

  const handleReset = async () => {
    setPlayedOffset(null)
    setMetrics({ signals: 0, riskScore: 0, qdrantHits: 0, voiceCalls: 0, auditEntries: 0 })
    setWsEvents([])
    try {
      await resetScenario(selectedScenario)
      fetchStatus()
    } catch (err) { console.error(err) }
  }

  const isPlaying = status?.playing ?? false
  const activeSc = SCENARIOS.find(s => s.id === selectedScenario)!

  return (
    <div style={{ minHeight: '100vh', background: BG, padding: '24px', fontFamily: FD }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: P, letterSpacing: '-0.02em', marginBottom: 4 }}>
              VIGIL Demo Control
            </h1>
            <p style={{ fontSize: 12, color: S }}>Scenario runner · Live pipeline monitor · Benchmark viewer</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Health indicators */}
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                background: apiHealth === 'ok' ? `${GREEN}15` : `${RED}15`,
                border: `1px solid ${apiHealth === 'ok' ? GREEN : RED}40`,
                borderRadius: 6, fontSize: 10, fontFamily: FM, fontWeight: 700,
                color: apiHealth === 'ok' ? GREEN : RED,
              }}>
                {apiHealth === 'ok' ? <CheckCircle size={10} /> : <AlertTriangle size={10} />}
                API {apiHealth.toUpperCase()}
              </span>
              <span style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                background: wsStatus === 'connected' ? `${GREEN}15` : `${AMBER}15`,
                border: `1px solid ${wsStatus === 'connected' ? GREEN : AMBER}40`,
                borderRadius: 6, fontSize: 10, fontFamily: FM, fontWeight: 700,
                color: wsStatus === 'connected' ? GREEN : AMBER,
              }}>
                {wsStatus === 'connected' ? <Wifi size={10} /> : <WifiOff size={10} />}
                WS {wsStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Live metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {[
            { label: 'Signals Correlated', value: metrics.signals, color: TEAL, icon: Activity },
            { label: 'Risk Score', value: `${metrics.riskScore}%`, color: metrics.riskScore > 60 ? RED : metrics.riskScore > 35 ? AMBER : GREEN, icon: Zap },
            { label: 'Qdrant Hits', value: metrics.qdrantHits, color: PURPLE, icon: ChevronRight },
            { label: 'Voice Calls', value: metrics.voiceCalls, color: BLUE, icon: Clock },
            { label: 'Audit Entries', value: metrics.auditEntries, color: GREEN, icon: CheckCircle },
          ].map(m => (
            <div key={m.label} style={{ background: CARD, border: `1px solid ${BD}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 9, fontFamily: FM, color: S, fontWeight: 700, letterSpacing: '0.06em' }}>{m.label}</span>
                <m.icon size={13} color={m.color} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: m.color, fontFamily: FM }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Main grid: scenario selector + timeline */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>

          {/* Scenario selector */}
          <div style={{ background: CARD, border: `1px solid ${BD}`, borderRadius: 14, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: S, letterSpacing: '0.06em', marginBottom: 4 }}>SELECT SCENARIO</div>
            {SCENARIOS.map(sc => (
              <button
                key={sc.id}
                onClick={() => setSelectedScenario(sc.id)}
                style={{
                  background: selectedScenario === sc.id ? `${sc.color}15` : 'transparent',
                  border: `1.5px solid ${selectedScenario === sc.id ? sc.color : BD}`,
                  borderRadius: 10, padding: '10px 12px',
                  textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: P }}>{sc.label}</span>
                  <span style={{ fontSize: 8, fontFamily: FM, fontWeight: 700, color: sc.color, background: `${sc.color}20`, padding: '2px 6px', borderRadius: 4 }}>{sc.badge}</span>
                </div>
                <div style={{ fontSize: 10, color: S, lineHeight: 1.4 }}>{sc.description}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                  <span style={{ fontSize: 9, fontFamily: FM, color: M }}>{sc.events} events</span>
                  <span style={{ fontSize: 9, fontFamily: FM, color: M }}>{sc.duration}</span>
                </div>
              </button>
            ))}

            {/* Controls */}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                onClick={handlePlay}
                disabled={isPlaying}
                style={{
                  flex: 1, background: isPlaying ? M : BLUE, color: '#fff',
                  border: 'none', borderRadius: 8, padding: '10px',
                  fontSize: 13, fontWeight: 700, fontFamily: FD,
                  cursor: isPlaying ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.2s',
                }}
              >
                <Play size={14} fill="#fff" />
                {isPlaying ? 'Running…' : 'Play'}
              </button>
              <button
                onClick={handleReset}
                style={{
                  background: 'transparent', color: S, border: `1px solid ${BD}`,
                  borderRadius: 8, padding: '10px 14px',
                  fontSize: 13, fontWeight: 600, fontFamily: FD, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <RefreshCw size={13} />
                Reset
              </button>
            </div>

            {isPlaying && (
              <div style={{ fontSize: 11, color: TEAL, fontFamily: FM, textAlign: 'center', padding: '4px 0' }}>
                ● Scenario running · {status?.active_scenario}
              </div>
            )}
          </div>

          {/* Timeline scrubber */}
          <div style={{ background: CARD, border: `1px solid ${BD}`, borderRadius: 14, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: S, letterSpacing: '0.06em' }}>
              HERO SCENARIO TIMELINE
            </div>

            {/* Timeline track */}
            <div style={{ position: 'relative', padding: '8px 0' }}>
              {/* Base line */}
              <div style={{ position: 'absolute', top: 24, left: 0, right: 0, height: 2, background: BD, borderRadius: 1 }} />

              {/* Event ticks */}
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                {HERO_TIMELINE.map((ev, i) => {
                  const isPast = playedOffset !== null && ev.offset <= playedOffset
                  const isCurrent = playedOffset !== null && i === HERO_TIMELINE.findIndex(e => e.offset > (playedOffset ?? -1)) - 1
                  const sc = TIER_COLOR[ev.tier]
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                      <div style={{
                        fontFamily: FM, fontSize: 8, color: isPast ? sc : M,
                        transition: 'color 0.3s', textAlign: 'center',
                      }}>
                        T+{ev.offset}s
                      </div>
                      <div style={{
                        width: isCurrent ? 14 : 10, height: isCurrent ? 14 : 10, borderRadius: '50%',
                        background: isPast ? sc : 'transparent',
                        border: `2px solid ${isPast ? sc : BD}`,
                        boxShadow: isCurrent ? `0 0 10px ${sc}` : 'none',
                        transition: 'all 0.3s', zIndex: 1,
                      }} />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Event list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 300, overflowY: 'auto' }}>
              {HERO_TIMELINE.map((ev, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px',
                  borderRadius: 6,
                  background: 'transparent',
                }}>
                  <span style={{ fontFamily: FM, fontSize: 9, color: M, minWidth: 38 }}>T+{ev.offset}s</span>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: TIER_COLOR[ev.tier], flexShrink: 0,
                  }} />
                  <span style={{ fontFamily: FM, fontSize: 8.5, color: typeColor(ev.source), fontWeight: 700, minWidth: 72 }}>
                    {ev.source.toUpperCase()}
                  </span>
                  <span style={{ fontFamily: FD, fontSize: 11, color: P, flex: 1 }}>{ev.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* WS Event Log */}
        <div style={{ background: CARD, border: `1px solid ${BD}`, borderRadius: 14, padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: S, letterSpacing: '0.06em' }}>WEBSOCKET EVENT LOG</span>
            <span style={{ fontFamily: FM, fontSize: 9, color: M }}>session: demo-session · last {wsEvents.length}</span>
          </div>
          <div
            ref={eventLogRef}
            style={{ height: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}
          >
            {wsEvents.length === 0 ? (
              <div style={{ fontFamily: FM, fontSize: 11, color: M, fontStyle: 'italic', padding: '8px 0' }}>
                No events received. Play a scenario to see the live pipeline.
              </div>
            ) : (
              wsEvents.map((ev, i) => {
                const type = String(ev.type ?? 'event')
                const col = type.startsWith('risk') ? RED : type.startsWith('case') ? AMBER : type.startsWith('ui') ? BLUE : type.startsWith('audit') ? GREEN : S
                return (
                  <div key={i} style={{
                    display: 'flex', gap: 8, padding: '5px 8px',
                    background: i === 0 ? `${col}08` : 'transparent',
                    borderRadius: 6, border: `1px solid ${i === 0 ? `${col}20` : 'transparent'}`,
                  }}>
                    <span style={{ fontFamily: FM, fontSize: 9, color: col, fontWeight: 700, minWidth: 140 }}>[{type}]</span>
                    <span style={{ fontFamily: FM, fontSize: 9, color: M, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {JSON.stringify(ev.payload).slice(0, 120)}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
