/**
 * frontend/src/pages/MissionControl.tsx
 *
 * The full agent-piloted mission control:
 * LEFT:   Factory heatmap + production KPIs
 * CENTER: Live event feed + compound risk gauge + VIGIL voice
 * RIGHT:  Evidence panel + active case + authorization gate
 */
import React, { useState, useEffect, useCallback } from 'react'
import { useCaseStore } from '../store/useCaseStore'
import { useVAD } from '../hooks/useVAD'
import { useRimeAudio } from '../hooks/useRimeAudio'
import { playScenario, resetScenario, getCaseAudit, postAuthorize, postResolve, triggerSpeak } from '../services/api'
import FactoryHeatmap from '../components/FactoryHeatmap'
import ProductionKPIs from '../components/ProductionKPIs'
import EquipmentStatus from '../components/EquipmentStatus'
import LatencyHUD from '../components/LatencyHUD'
import {
  Mic2, Play, RotateCcw, Shield, AlertTriangle, CheckCircle,
  Zap, Activity, Clock, Volume2, VolumeX, ChevronRight,
  Wifi, WifiOff, Brain, Database, FileText, XCircle
} from 'lucide-react'

const P = '#0F1729', S = '#5A6578', M = '#9CA3B4', BD = '#E4E8EF'
const CARD = '#FFFFFF', BG = '#F8F9FB'
const GREEN = '#16A34A', AMBER = '#D97706', ORANGE = '#EA580C', RED = '#DC2626'
const BLUE = '#2563EB', TEAL = '#0D9488', PURPLE = '#7C3AED'
const FD = "'Plus Jakarta Sans', sans-serif"
const FM = "'JetBrains Mono', monospace"

// ── Helpers ────────────────────────────────────────────────────────────── //

function tierColor(tier: string | undefined): string {
  if (tier === 'critical') return RED
  if (tier === 'high') return ORANGE
  if (tier === 'medium') return AMBER
  return GREEN
}

function RiskGauge({ score, tier }: { score: number; tier?: string }) {
  const color = tierColor(tier)
  const circumference = 2 * Math.PI * 40
  const dash = (score / 100) * circumference
  return (
    <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
      <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={50} cy={50} r={40} fill="none" stroke="#F1F3F7" strokeWidth={10} />
        <circle
          cx={50} cy={50} r={40} fill="none"
          stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease, stroke 0.5s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontFamily: FD, fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>
          {score}
        </div>
        <div style={{ fontSize: 9, color: M, marginTop: 2, fontWeight: 600, textTransform: 'uppercase' as const }}>
          {tier ?? '—'}
        </div>
      </div>
    </div>
  )
}

// ── Splash screen ─────────────────────────────────────────────────────── //

function SplashScreen({ onStart }: { onStart: () => void }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: BG, zIndex: 100,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Radial glow */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 45%, #EFF6FF 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ zIndex: 1, textAlign: 'center', maxWidth: 520, padding: 32 }}>
        {/* Icon */}
        <div style={{
          width: 80, height: 80, borderRadius: 22,
          background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 28px', boxShadow: '0 12px 40px rgba(37,99,235,0.3)',
          animation: 'nova-breathe 3s ease-in-out infinite',
        }}>
          <Shield size={38} color="#fff" />
        </div>
        <div style={{ fontFamily: FD, fontSize: 38, fontWeight: 800, color: P,
          letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 10 }}>
          VIGIL
        </div>
        <div style={{ fontFamily: FD, fontSize: 16, color: S, marginBottom: 6, fontWeight: 500 }}>
          Compound-Risk Voice Intelligence
        </div>
        <div style={{ fontSize: 13, color: M, marginBottom: 40, lineHeight: 1.7 }}>
          AI agent monitors your factory floor for compound risks that no single sensor can detect.
          Voice-first. Always listening. Learns from every incident.
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginBottom: 40 }}>
          {[
            ['6,500+', 'Industrial deaths/yr (India)'],
            ['47%', 'Incidents — compound cause'],
            ['< 400ms', 'Voice alert latency'],
          ].map(([val, label]) => (
            <div key={val as string} style={{ textAlign: 'center' as const }}>
              <div style={{ fontFamily: FD, fontSize: 22, fontWeight: 800, color: BLUE, lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: 10, color: M, marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          id="vigil-begin-btn"
          onClick={onStart}
          style={{
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            color: '#fff', border: 'none',
            padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', gap: 10,
            cursor: 'pointer', boxShadow: '0 6px 20px rgba(37,99,235,0.3)',
            fontFamily: FD, transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(37,99,235,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.3)' }}
        >
          <Mic2 size={18} />
          Tap to Begin Monitoring
        </button>
        <div style={{ fontSize: 11, color: M, marginTop: 12 }}>
          Requires microphone permission for voice interaction
        </div>
      </div>
    </div>
  )
}

// ── Live Event Feed ───────────────────────────────────────────────────── //

interface LiveEvent {
  ts: string
  type: string
  text: string
  severity?: string
  color: string
}

function LiveEventFeed({ events }: { events: LiveEvent[] }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', maxHeight: 280 }}>
      {events.length === 0 ? (
        <div style={{ padding: '24px 16px', textAlign: 'center' as const, color: M, fontSize: 13 }}>
          Waiting for events...
        </div>
      ) : events.map((ev, i) => (
        <div key={i} style={{
          padding: '8px 14px', borderBottom: `1px solid ${BD}`,
          borderLeft: `3px solid ${ev.color}`,
          background: i === 0 ? `${ev.color}05` : 'transparent',
          animation: i === 0 ? 'nova-slide-in 0.3s ease' : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: FM, fontSize: 9, color: M }}>{new Date(ev.ts).toLocaleTimeString()}</span>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
              background: `${ev.color}10`, color: ev.color, textTransform: 'uppercase' as const }}>
              {ev.type}
            </span>
          </div>
          <div style={{ fontSize: 12, color: P, marginTop: 2, fontWeight: 500 }}>{ev.text}</div>
        </div>
      ))}
    </div>
  )
}

// ── Authorization Gate ────────────────────────────────────────────────── //

function AuthGate({
  caseId, onAuthorize,
}: {
  caseId: string
  onAuthorize: (decision: 'yes' | 'no') => void
}) {
  const [loading, setLoading] = useState(false)
  const [debrief, setDebrief] = useState('')

  const handleAuth = async (decision: 'yes' | 'no') => {
    setLoading(true)
    try {
      await postAuthorize(caseId, decision)
      onAuthorize(decision)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: '#FFF7ED', border: `1.5px solid ${ORANGE}`,
      borderRadius: 12, padding: 16, marginTop: 12,
      animation: 'nova-slide-in 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <AlertTriangle size={16} color={ORANGE} />
        <span style={{ fontFamily: FD, fontSize: 14, fontWeight: 700, color: ORANGE }}>
          Authorization Required
        </span>
      </div>
      <div style={{ fontSize: 13, color: S, marginBottom: 14, lineHeight: 1.6 }}>
        Suspend Permit-to-Work <strong>PTW-2026-0421</strong> for Compressor C-14 in Bay 3?
        This will halt hot-work operations and initiate evacuation.
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          id="authorize-yes-btn"
          onClick={() => handleAuth('yes')}
          disabled={loading}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 8,
            background: 'linear-gradient(135deg, #16A34A, #15803D)',
            border: 'none', color: '#fff', fontWeight: 700, fontSize: 13,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            fontFamily: FD, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <CheckCircle size={14} /> Authorize
        </button>
        <button
          id="authorize-no-btn"
          onClick={() => handleAuth('no')}
          disabled={loading}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 8,
            background: '#F8F9FB', border: `1px solid ${BD}`,
            color: S, fontWeight: 600, fontSize: 13, cursor: 'pointer',
            fontFamily: FD, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <XCircle size={14} /> Reject
        </button>
      </div>
    </div>
  )
}

// ── Debrief Panel ─────────────────────────────────────────────────────── //

function DebriefPanel({ caseId, onComplete }: { caseId: string; onComplete: () => void }) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!text.trim()) return
    setSubmitting(true)
    try {
      await postResolve(caseId, {
        debrief_text: text,
        equipment_id: 'C-14',
        zone_id: 'Bay3',
        contributing_factors: ['hot_work_permit', 'seal_degradation', 'shift_changeover'],
      })
      setDone(true)
      setTimeout(onComplete, 2000)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div style={{ background: '#F0FDF4', border: `1px solid ${GREEN}`, borderRadius: 12, padding: 16,
        animation: 'nova-slide-in 0.3s ease', textAlign: 'center' as const }}>
        <CheckCircle size={28} color={GREEN} style={{ margin: '0 auto 8px' }} />
        <div style={{ fontFamily: FD, fontSize: 14, fontWeight: 700, color: GREEN }}>
          Lesson Saved to Organizational Memory
        </div>
        <div style={{ fontSize: 12, color: S, marginTop: 4 }}>
          Written to Qdrant lessons_learned collection
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#F0FDF4', border: `1px solid ${GREEN}`, borderRadius: 12, padding: 16,
      animation: 'nova-slide-in 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Brain size={16} color={GREEN} />
        <span style={{ fontFamily: FD, fontSize: 14, fontWeight: 700, color: GREEN }}>Case Debrief</span>
      </div>
      <div style={{ fontSize: 12, color: S, marginBottom: 10 }}>
        What was learned from this incident? This will be saved to organizational memory.
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="e.g. Gas concentration elevated near C-14 during hot-work due to degraded shaft seal. Future response: verify seal integrity before issuing hot-work permits for C-14..."
        style={{
          width: '100%', minHeight: 80, padding: 10, borderRadius: 8,
          border: `1px solid ${GREEN}40`, background: '#fff', fontSize: 12,
          fontFamily: "'Inter', sans-serif", color: P, resize: 'vertical' as const,
          outline: 'none',
        }}
      />
      <button
        onClick={handleSubmit}
        disabled={submitting || !text.trim()}
        style={{
          marginTop: 8, width: '100%', padding: '10px 0', borderRadius: 8,
          background: GREEN, border: 'none', color: '#fff',
          fontWeight: 700, fontSize: 13, fontFamily: FD,
          cursor: submitting || !text.trim() ? 'not-allowed' : 'pointer',
          opacity: submitting || !text.trim() ? 0.6 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        <Database size={14} /> Save to Organizational Memory
      </button>
    </div>
  )
}

// ── Main MissionControl ───────────────────────────────────────────────── //

export default function MissionControl() {
  const [started, setStarted] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [showDebrief, setShowDebrief] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [focusedZone, setFocusedZone] = useState<string | null>(null)
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'equipment' | 'permits'>('overview')

  const activeCase = useCaseStore(s => s.activeCase)
  const { announcement, activePanel, proposedEdit, navTarget, focusedPermitId } = useCaseStore(s => s.uiState)
  const setUiAnnouncement = useCaseStore(s => s.setUiAnnouncement)
  const connectionStatus = useCaseStore(s => s.connectionStatus)
  const evidenceList = useCaseStore(s => s.evidenceList)

  useEffect(() => {
    if (navTarget === 'permits' || focusedPermitId) {
      setActiveTab('permits')
    }
  }, [navTarget, focusedPermitId])

  const caseId = activeCase?.case_id ?? 'demo'
  const score = activeCase ? Math.round(activeCase.compound_score * 100) : 0
  const tier = activeCase?.risk_tier ?? 'low'

  // VAD — always listening
  const { listening, muted, toggleMute } = useVAD({ enabled: started })

  // Rime audio stream
  const { isSpeaking, caption, bargeIn } = useRimeAudio({
    caseId,
    onCaption: (text) => {
      setUiAnnouncement(text)
      addEvent('NOVA', text, TEAL, 'elevated')
    },
    onAudioEnd: () => {
      // Auto-show auth gate when voice announces permit suspension
      if (score >= 70 && !authorized) setShowAuth(true)
    },
  })

  function addEvent(type: string, text: string, color: string, severity?: string) {
    setLiveEvents(prev => [{
      ts: new Date().toISOString(),
      type, text, color, severity,
    }, ...prev].slice(0, 50))
  }

  // Listen for WebSocket events to populate live feed
  const wsStore = useCaseStore.getState()
  useEffect(() => {
    const sub = useCaseStore.subscribe((state) => {
      const { uiState } = state
      if (uiState.announcement && uiState.announcement !== liveEvents[0]?.text) {
        // Already handled via onCaption
      }
    })
    return sub
  }, [])

  const handleStart = async () => {
    setStarted(true)
    setPlaying(true)
    addEvent('SYSTEM', 'VIGIL monitoring started — Bay 3 compound risk analysis active', BLUE)
    try {
      await playScenario('hero_scenario')
      addEvent('DEMO', 'Hero scenario initiated — 20 events queued', PURPLE)
    } catch (err) {
      addEvent('ERROR', 'Scenario engine offline — demo mode active', '#DC2626')
    }
  }

  const handleReset = async () => {
    setPlaying(false)
    setShowAuth(false)
    setShowDebrief(false)
    setAuthorized(false)
    setLiveEvents([])
    try {
      await resetScenario('hero_scenario')
    } catch {}
  }

  const handleAuthorize = async (decision: 'yes' | 'no') => {
    setShowAuth(false)
    if (decision === 'yes') {
      setAuthorized(true)
      addEvent('AUTHORIZED', 'Permit PTW-2026-0421 suspended — evacuation active', GREEN)
      setTimeout(() => setShowDebrief(true), 2000)
    } else {
      addEvent('REJECTED', 'Authorization rejected by operator', RED)
    }
  }

  const handleManualSpeak = async () => {
    await triggerSpeak(caseId,
      'Compound risk assessment complete. Gas concentration in Bay 3 has exceeded the 10 percent LEL threshold ' +
      'with an active hot-work permit and compressor maintenance in progress. ' +
      'Compound risk score is ' + score + ' out of 100. ' +
      'Recommend immediate suspension of Permit-to-Work 2026-0421. ' +
      'Do you authorize suspension?'
    ).catch(console.warn)
  }

  // ── Layout ──────────────────────────────────────────────────────────── //

  if (!started) return <SplashScreen onStart={handleStart} />

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden', background: BG, gap: 0 }}>

      {/* ── LEFT COLUMN: Factory View ──────────────────────────────────── */}
      <div style={{
        width: 480, flexShrink: 0, display: 'flex', flexDirection: 'column',
        borderRight: `1px solid ${BD}`, background: CARD, overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BD}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity size={14} color={BLUE} />
          <span style={{ fontFamily: FD, fontSize: 13, fontWeight: 700, color: P }}>Factory Floor</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            {['overview', 'equipment', 'permits'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} style={{
                padding: '3px 9px', borderRadius: 6, border: `1px solid ${activeTab === tab ? BLUE : BD}`,
                background: activeTab === tab ? '#EFF6FF' : 'transparent',
                color: activeTab === tab ? BLUE : S, fontSize: 10, fontWeight: 600,
                cursor: 'pointer', textTransform: 'capitalize' as const,
              }}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activeTab === 'overview' && (
            <>
              <FactoryHeatmap onZoneClick={setFocusedZone} />
              <ProductionKPIs />
            </>
          )}
          {activeTab === 'equipment' && <EquipmentStatus zone={focusedZone ?? undefined} />}
          {activeTab === 'permits' && (
            <PermitsPanel />
          )}
        </div>
      </div>

      {/* ── CENTER COLUMN: Live Feed + Risk ──────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top controls */}
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${BD}`, background: CARD,
          display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            id="play-scenario-btn"
            onClick={playing ? handleReset : handleStart}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8,
              background: playing ? '#FEF2F2' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              border: playing ? `1px solid ${RED}` : 'none',
              color: playing ? RED : '#fff', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: FD,
            }}
          >
            {playing ? <><RotateCcw size={12} /> Reset</> : <><Play size={12} /> Play Scenario</>}
          </button>

          <button
            id="manual-speak-btn"
            onClick={handleManualSpeak}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8, border: `1px solid ${TEAL}`,
              background: isSpeaking ? `${TEAL}10` : '#F8F9FB',
              color: TEAL, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Volume2 size={12} /> {isSpeaking ? 'Speaking...' : 'Test Voice'}
          </button>

          {isSpeaking && (
            <button
              id="barge-in-btn"
              onClick={bargeIn}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8, border: `1px solid ${AMBER}`,
                background: `${AMBER}10`, color: AMBER, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Mic2 size={12} /> Barge In
            </button>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={toggleMute} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 6, border: `1px solid ${BD}`,
              background: 'transparent', color: muted ? RED : GREEN, fontSize: 11, cursor: 'pointer',
            }}>
              {muted ? <VolumeX size={11} /> : <Volume2 size={11} />}
              {muted ? 'Muted' : 'Listening'}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
              {connectionStatus === 'connected'
                ? <><Wifi size={11} color={GREEN} /><span style={{ color: GREEN }}>Live</span></>
                : <><WifiOff size={11} color={RED} /><span style={{ color: RED }}>Offline</span></>}
            </div>
          </div>
        </div>

        {/* Risk score + voice caption */}
        <div style={{ padding: '14px 16px', background: CARD, borderBottom: `1px solid ${BD}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <RiskGauge score={score} tier={tier} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: M,
                textTransform: 'uppercase' as const, marginBottom: 4 }}>
                Compound Risk Score
              </div>
              <div style={{ fontFamily: FD, fontSize: 20, fontWeight: 800, color: tierColor(tier),
                lineHeight: 1, marginBottom: 4 }}>
                {tier.toUpperCase()} TIER
              </div>
              <div style={{ fontSize: 12, color: S }}>
                {activeCase?.zone_id ?? 'Bay 3'} • {evidenceList.length} evidence items
              </div>
              {caption && (
                <div style={{
                  marginTop: 8, padding: '8px 12px', background: `${TEAL}08`,
                  border: `1px solid ${TEAL}30`, borderRadius: 8, fontSize: 12, color: TEAL,
                  display: 'flex', alignItems: 'flex-start', gap: 6, animation: 'nova-slide-in 0.2s ease',
                }}>
                  <Volume2 size={12} style={{ marginTop: 1, flexShrink: 0 }} />
                  <span style={{ lineHeight: 1.5 }}>{caption}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live event feed */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 14px', borderBottom: `1px solid ${BD}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: playing ? GREEN : M,
              boxShadow: playing ? `0 0 6px ${GREEN}` : 'none',
              animation: playing ? 'nova-pulse 1.5s ease-in-out infinite' : 'none' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: P }}>Live Event Feed</span>
            <span style={{ marginLeft: 'auto', fontFamily: FM, fontSize: 10, color: M }}>
              {liveEvents.length} events
            </span>
          </div>
          <LiveEventFeed events={liveEvents} />
        </div>

        {/* Latency HUD at bottom */}
        <div style={{ padding: 12, borderTop: `1px solid ${BD}` }}>
          <LatencyHUD caseId={caseId} />
        </div>
      </div>

      {/* ── RIGHT COLUMN: Evidence + Auth ────────────────────────────────── */}
      <div style={{
        width: 340, flexShrink: 0, borderLeft: `1px solid ${BD}`,
        background: CARD, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BD}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={14} color={BLUE} />
          <span style={{ fontFamily: FD, fontSize: 13, fontWeight: 700, color: P }}>Case Detail</span>
          {activeCase && (
            <span style={{ marginLeft: 'auto', fontFamily: FM, fontSize: 10, color: AMBER, fontWeight: 700 }}>
              {activeCase.case_id}
            </span>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Active case info */}
          {activeCase && (
            <div style={{ background: BG, borderRadius: 10, border: `1px solid ${BD}`, padding: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: M, textTransform: 'uppercase' as const, marginBottom: 8 }}>
                Active Case
              </div>
              {[
                ['Zone', activeCase.zone_id],
                ['State', activeCase.state],
                ['Risk', `${score}/100 — ${tier.toUpperCase()}`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: M }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: P }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Evidence list */}
          {evidenceList.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: M, textTransform: 'uppercase' as const,
                marginBottom: 8, letterSpacing: '0.08em' }}>
                Evidence Chain ({evidenceList.length})
              </div>
              {evidenceList.slice(0, 5).map((ev, i) => (
                <div key={i} style={{
                  padding: '8px 10px', borderRadius: 8, background: BG,
                  border: `1px solid ${BD}`, marginBottom: 6,
                  borderLeft: `3px solid ${PURPLE}`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: P }}>{ev.fact}</div>
                  <div style={{ fontSize: 10, color: M, marginTop: 2 }}>
                    {ev.source} • w={ev.weight?.toFixed(2) ?? '—'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Authorization gate */}
          {showAuth && !authorized && !showDebrief && (
            <AuthGate caseId={caseId} onAuthorize={handleAuthorize} />
          )}

          {/* Success state */}
          {authorized && !showDebrief && (
            <div style={{ background: '#F0FDF4', border: `1px solid ${GREEN}`, borderRadius: 12, padding: 14,
              animation: 'nova-slide-in 0.3s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={18} color={GREEN} />
                <span style={{ fontFamily: FD, fontSize: 13, fontWeight: 700, color: GREEN }}>
                  Permit Suspended
                </span>
              </div>
              <div style={{ fontSize: 12, color: S, marginTop: 6 }}>
                Evacuation protocol active. Standing by for debrief...
              </div>
            </div>
          )}

          {/* Debrief panel */}
          {showDebrief && (
            <DebriefPanel caseId={caseId} onComplete={() => setShowDebrief(false)} />
          )}

          {/* Manual trigger auth (if score is high but no auto trigger) */}
          {playing && score >= 60 && !showAuth && !authorized && !showDebrief && (
            <button
              id="request-auth-btn"
              onClick={() => setShowAuth(true)}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 8,
                background: `${ORANGE}10`, border: `1px solid ${ORANGE}`,
                color: ORANGE, fontWeight: 700, fontSize: 12,
                cursor: 'pointer', fontFamily: FD,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <AlertTriangle size={13} /> Request Authorization
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Permits Panel ─────────────────────────────────────────────────────── //

function PermitsPanel() {
  const [permits, setPermits] = useState<any[]>([])
  const focusedPermitId = useCaseStore(s => s.uiState?.focusedPermitId)

  const fetchPermits = () => {
    import('../services/api').then(({ getActivePermits }) =>
      getActivePermits().then(setPermits).catch(() => {})
    )
  }

  useEffect(() => {
    fetchPermits()
    const handleUpdate = () => fetchPermits()
    window.addEventListener('permit:updated', handleUpdate)
    const interval = setInterval(fetchPermits, 3000)
    return () => {
      window.removeEventListener('permit:updated', handleUpdate)
      clearInterval(interval)
    }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {permits.map(p => {
        const isFocused = focusedPermitId && p.permit_id === focusedPermitId
        const isSuspended = p.status === 'suspended'
        return (
          <div key={p.permit_id} id={`permit-${p.permit_id}`} style={{
            background: isFocused ? '#FFF7ED' : CARD,
            borderRadius: 12,
            border: isFocused ? `2px solid ${ORANGE}` : `1px solid ${BD}`,
            boxShadow: isFocused ? '0 0 12px rgba(234, 88, 12, 0.3)' : 'none',
            padding: 14,
            borderLeft: `4px solid ${isSuspended ? RED : (p.status === 'active' ? ORANGE : GREEN)}`,
            transition: 'all 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: FM, fontSize: 12, fontWeight: 700, color: P }}>{p.permit_id}</span>
                <span style={{
                  fontSize: 9, padding: '2px 6px', borderRadius: 4,
                  background: isSuspended ? '#FEF2F2' : (p.status === 'active' ? '#FFF7ED' : '#F0FDF4'),
                  color: isSuspended ? RED : (p.status === 'active' ? ORANGE : GREEN),
                  fontWeight: 700,
                  border: `1px solid ${isSuspended ? RED : (p.status === 'active' ? ORANGE : GREEN)}44`
                }}>
                  {p.status.toUpperCase()}
                </span>
              </div>
              {isFocused && p.status === 'active' && (
                <span style={{
                  fontSize: 9, padding: '2px 6px', borderRadius: 4,
                  background: '#FEF2F2', color: RED, fontWeight: 800,
                  border: `1px solid ${RED}66`, animation: 'pulse 1.5s infinite'
                }}>
                  RECOMMENDED SUSPENSION
                </span>
              )}
            </div>
            {[
              ['Type', p.permit_type?.replace(/_/g, ' ')],
              ['Zone', p.zone_id],
              ['Issued to', p.issued_to],
              ['Window Start', p.issued_at],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: M }}>{k}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: P }}>{v ?? '—'}</span>
              </div>
            ))}
          </div>
        )
      })}
      {permits.length === 0 && (
        <div style={{ textAlign: 'center' as const, color: M, padding: 24, fontSize: 13 }}>
          No permits found
        </div>
      )}
    </div>
  )
}
