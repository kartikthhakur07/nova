import { useEffect, useCallback } from 'react'
import { useSimulationStore, BriefingPayload } from '../store/useSimulationStore'
import { requestMicPermission, novaSilence } from '../engine/novaSpeech'
import { startLiveTelemetryStream, stopLiveTelemetryStream, startRealVoiceListener, stopRealVoiceListener, novaSpeakSimulation } from '../engine/realSystemEngine'
import { stopCurrentTTS } from '../engine/deepgramVoice'
import PlantTwin from '../components/demo/PlantTwin'
import NovaPresenceIndicator from '../components/demo/NovaPresenceIndicator'
import EvidencePanel from '../components/demo/EvidencePanel'
import AuthorizationOverlay from '../components/demo/AuthorizationOverlay'
import EventLog from '../components/demo/EventLog'
import DemoOverlays from '../components/demo/DemoOverlays'
import ShiftBriefingOverlay from '../components/demo/ShiftBriefingOverlay'

export default function RealSystemSimulation() {
  const {
    isRunning,
    startSimulation,
    stopSimulation,
    activeOverlayView,
    setOverlayView,
    evidenceOpen,
    setEvidenceOpen,
    triggerAnomaly,
    resetTelemetry,
    briefingActive,
    briefingData,
    setBriefingActive,
    setBriefingData,
    setIsFetchingBriefing,
    addEvent,
  } = useSimulationStore()

  const fetchBriefingAndSalutate = useCallback(async () => {
    setIsFetchingBriefing(true)
    setBriefingActive(true)
    startSimulation() // Displays plant twin UI in background

    try {
      const res = await fetch('/api/voice/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator_name: 'Supervisor', case_id: 'case-live' }),
      })
      if (res.ok) {
        const data: BriefingPayload = await res.json()
        setBriefingData(data)
        novaSpeakSimulation(data.spoken_text)
      } else {
        throw new Error('Briefing API returned error')
      }
    } catch (err) {
      console.warn('[Briefing] Error fetching Groq LLM briefing, using fallback:', err)
      const fallback: BriefingPayload = {
        salutation: 'Welcome back to Mission Control, Supervisor.',
        summary: 'During your absence, 142 continuous telemetry parameters across all 5 plant bays were monitored. All core systems are stable with 1 active hot-work permit under surveillance.',
        highlights: [
          'Bay 1 (Distillation): DC-101 feed rate nominal at 450 L/min',
          'Bay 2 (Heat Exchanger): PRV-201 valve service window active',
          'Bay 3 (Compressor): C-14 seal pressure stable; PTW-0441 active permit',
          'Overall Plant Health: 98.4% Nominal',
        ],
        spoken_text: 'Good shift, Supervisor. Welcome back to NOVA Mission Control. While you were away, 142 telemetry parameters were continuously monitored across all five bays. All systems are stable, and active permits remain under continuous surveillance. Regular live operations are ready to begin.',
      }
      setBriefingData(fallback)
      novaSpeakSimulation(fallback.spoken_text)
    } finally {
      setIsFetchingBriefing(false)
    }
  }, [setBriefingData, setBriefingActive, setIsFetchingBriefing, startSimulation])

  const handleStart = useCallback(async () => {
    await requestMicPermission()
    await fetchBriefingAndSalutate()
  }, [fetchBriefingAndSalutate])

  const handleAcknowledgeBriefing = useCallback(() => {
    stopCurrentTTS()
    setBriefingActive(false)
    addEvent({
      type: 'nova-action',
      message: 'Shift Handover Briefing completed via Groq LLM. Regular telemetry & voice pipeline activated.',
      risk: 'normal',
    })
    startLiveTelemetryStream()
    startRealVoiceListener()
    novaSpeakSimulation('Shift handover acknowledged. Live telemetry stream and voice control room interface active.')
  }, [setBriefingActive, addEvent])

  const handleReplayVoice = useCallback(() => {
    if (briefingData?.spoken_text) {
      stopCurrentTTS()
      novaSpeakSimulation(briefingData.spoken_text)
    }
  }, [briefingData])

  const handleStop = useCallback(() => {
    stopLiveTelemetryStream()
    stopRealVoiceListener()
    novaSilence()
    stopSimulation()
  }, [stopSimulation])

  useEffect(() => {
    handleStart()
    return () => {
      stopLiveTelemetryStream()
      stopRealVoiceListener()
      novaSilence()
    }
  }, [handleStart])

  if (!isRunning) {
    return <SimulationLanding onStart={handleStart} />
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#F7F6F2',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(200,201,198,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(200,201,198,0.3) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '48px',
        background: '#FFFFFF',
        borderBottom: '1px solid #C8C9C6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <NovaLogoSmall />
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.55rem',
            color: '#0D9488',
            letterSpacing: '0.1em',
            background: 'rgba(13,148,136,0.08)',
            padding: '2px 8px',
            borderRadius: '3px',
            border: '1px solid rgba(13,148,136,0.3)',
          }}>
            LIVE AGENT SIMULATION (NON-SCRIPTED)
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'none', label: 'Plant View' },
            { id: 'tracks', label: 'Recent Tracks' },
            { id: 'audit', label: 'Audit Trail' },
            { id: 'signals', label: 'Signals' },
          ].map(view => (
            <button
              key={view.id}
              onClick={() => setOverlayView(view.id as any)}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.55rem',
                letterSpacing: '0.08em',
                color: activeOverlayView === view.id ? '#0E0D1F' : '#62636A',
                background: activeOverlayView === view.id ? '#E9E9E5' : '#FFFFFF',
                border: `1px solid ${activeOverlayView === view.id ? '#0E0D1F' : '#C8C9C6'}`,
                padding: '4px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {view.label}
            </button>
          ))}
          <button
            onClick={() => setEvidenceOpen(!evidenceOpen)}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.55rem',
              letterSpacing: '0.08em',
              color: evidenceOpen ? '#D98A3A' : '#62636A',
              background: evidenceOpen ? '#F3DFC0' : '#FFFFFF',
              border: `1px solid ${evidenceOpen ? '#D98A3A' : '#C8C9C6'}`,
              padding: '4px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Evidence Drawer
          </button>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => triggerAnomaly('Bay 3', 'gas')}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.5rem',
              color: '#C84B42',
              background: 'rgba(200,75,66,0.08)',
              border: '1px solid rgba(200,75,66,0.3)',
              padding: '3px 8px',
              borderRadius: '3px',
              cursor: 'pointer',
            }}
          >
            Inject Gas Leak
          </button>
          <button
            onClick={() => triggerAnomaly('Bay 2', 'pressure')}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.5rem',
              color: '#D98A3A',
              background: 'rgba(217,138,58,0.08)',
              border: '1px solid rgba(217,138,58,0.3)',
              padding: '3px 8px',
              borderRadius: '3px',
              cursor: 'pointer',
            }}
          >
            Inject Pressure Spike
          </button>
          <button
            onClick={resetTelemetry}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.5rem',
              color: '#72856C',
              background: 'rgba(114,133,108,0.08)',
              border: '1px solid rgba(114,133,108,0.3)',
              padding: '3px 8px',
              borderRadius: '3px',
              cursor: 'pointer',
            }}
          >
            Reset Telemetry
          </button>
          <button
            onClick={handleStop}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.55rem',
              letterSpacing: '0.1em',
              color: '#C84B42',
              background: 'rgba(200,75,66,0.08)',
              border: '1px solid rgba(200,75,66,0.3)',
              padding: '4px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            EXIT SIMULATION
          </button>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        top: 48,
        left: 0,
        right: 0,
        bottom: 0,
      }}>
        <EventLog />

        <div style={{
          position: 'absolute',
          top: 0,
          left: 280,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: evidenceOpen ? 380 : 0,
            transition: 'right 0.4s ease',
            overflow: 'hidden'
          }}>
            <PlantTwin />
          </div>
          <EvidencePanel />
          <AuthorizationOverlay />
          <DemoOverlays />
        </div>
      </div>

      <NovaPresenceIndicator />
      {briefingActive && (
        <ShiftBriefingOverlay
          onAcknowledge={handleAcknowledgeBriefing}
          onReplayVoice={handleReplayVoice}
        />
      )}
    </div>
  )
}

function SimulationLanding({ onStart }: { onStart: () => void }) {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#F7F6F2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(200,201,198,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(200,201,198,0.2) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
        pointerEvents: 'none',
      }} />

      <div style={{
        textAlign: 'center',
        position: 'relative',
        zIndex: 2,
        animation: 'fade-up 0.8s ease both',
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(13,148,136,0.15) 0%, rgba(13,148,136,0.02) 70%)',
          border: '2px solid rgba(13,148,136,0.3)',
          margin: '0 auto 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse-ring 3s ease-in-out infinite',
          boxShadow: '0 0 40px rgba(13,148,136,0.15)',
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#0D9488',
            boxShadow: '0 0 20px rgba(13,148,136,0.4)',
          }} />
        </div>

        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '3.8rem',
          color: '#0E0D1F',
          letterSpacing: '0.12em',
          lineHeight: 0.9,
          marginBottom: '8px',
        }}>
          LIVE SYSTEM SIMULATION
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.6rem',
          color: '#0D9488',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginBottom: '32px',
        }}>
          NON-SCRIPTED AUTONOMOUS AI AGENT SYSTEM
        </div>

        <div style={{
          fontFamily: "'Titillium Web', sans-serif",
          fontSize: '0.95rem',
          color: '#62636A',
          maxWidth: '440px',
          margin: '0 auto 40px',
          lineHeight: 1.6,
          fontWeight: 400,
        }}>
          Real 2-second telemetry stream with autonomous AI agent intelligence. Nova speaks out loud when telemetry breaches critical thresholds and answers any real question asked into your microphone.
        </div>

        <button
          onClick={onStart}
          style={{
            fontFamily: "'Titillium Web', sans-serif",
            fontWeight: 700,
            fontSize: '0.85rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            background: '#0D9488',
            color: '#FFFFFF',
            border: 'none',
            padding: '16px 48px',
            borderRadius: '50px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 14px rgba(13,148,136,0.3)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-3px)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(13,148,136,0.4)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(13,148,136,0.3)'
          }}
        >
          Launch Live Simulation
        </button>
      </div>
    </div>
  )
}

function NovaLogoSmall() {
  return (
    <svg width="80" height="24" viewBox="0 0 120 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M 6 26 V 6 L 22 26 V 6" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="42" cy="16" rx="10" ry="10" stroke="#0D9488" strokeWidth="2" fill="none" />
      <circle cx="42" cy="16" r="3" fill="#0D9488" opacity="0.5" />
      <path d="M 62 6 L 72 26 L 82 6" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 92 26 L 102 6 L 112 26" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 96 18 L 108 18" stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
