import { useEffect, useCallback } from 'react'
import { useDemoStore } from '../store/useDemoStore'
import { requestMicPermission, startListening, stopListening, novaSilence } from '../engine/novaSpeech'
import { runDemoSequence, stopDemoSequence } from '../engine/demoOrchestrator'
import PlantTwin from '../components/demo/PlantTwin'
import NovaPresenceIndicator from '../components/demo/NovaPresenceIndicator'
import EvidencePanel from '../components/demo/EvidencePanel'
import AuthorizationOverlay from '../components/demo/AuthorizationOverlay'
import EventLog from '../components/demo/EventLog'
import DemoOverlays from '../components/demo/DemoOverlays'

export default function DemoMode() {
  const { demoActive, startDemo, stopDemo, demoPhase, activeOverlayView, setOverlayView, evidenceOpen, setEvidenceOpen } = useDemoStore()

  const handleStart = useCallback(async () => {
    const granted = await requestMicPermission()
    startDemo()

    if (granted) {
      startListening()
    }

    setTimeout(() => runDemoSequence(), 500)
  }, [startDemo])

  const handleStop = useCallback(() => {
    stopDemoSequence()
    stopListening()
    novaSilence()
    stopDemo()
  }, [stopDemo])

  useEffect(() => {
    return () => {
      stopDemoSequence()
      stopListening()
      novaSilence()
    }
  }, [])

  if (!demoActive) {
    return <DemoLanding onStart={handleStart} />
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#080c08',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(132,255,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(132,255,0,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '48px',
        background: 'rgba(8,12,8,0.95)',
        borderBottom: '1px solid rgba(132,255,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 50,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <NovaLogoSmall />
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.55rem',
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.1em',
          }}>
            AGENT-PILOTED CONTROL ROOM
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
                color: activeOverlayView === view.id ? '#84ff00' : 'rgba(255,255,255,0.5)',
                background: activeOverlayView === view.id ? 'rgba(132,255,0,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${activeOverlayView === view.id ? 'rgba(132,255,0,0.4)' : 'rgba(255,255,255,0.1)'}`,
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
              color: evidenceOpen ? '#fbbf24' : 'rgba(255,255,255,0.5)',
              background: evidenceOpen ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${evidenceOpen ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.1)'}`,
              padding: '4px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Evidence Drawer
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.5rem',
            color: 'rgba(255,255,255,0.3)',
          }}>
            {new Date().toLocaleTimeString('en-GB')}
          </div>
          <button
            onClick={handleStop}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.55rem',
              letterSpacing: '0.1em',
              color: '#ff4444',
              background: 'rgba(220,38,38,0.1)',
              border: '1px solid rgba(220,38,38,0.3)',
              padding: '4px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            EXIT DEMO
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
          <PlantTwin />
          <EvidencePanel />
          <AuthorizationOverlay />
          <DemoOverlays />
        </div>
      </div>

      <NovaPresenceIndicator />

      <PhaseIndicator phase={demoPhase} />
    </div>
  )
}

function PhaseIndicator({ phase }: { phase: string }) {
  const labels: Record<string, string> = {
    monitoring: 'Autonomous Monitoring',
    detecting: 'Anomaly Detected',
    analyzing: 'Analyzing Compound Risk',
    alerting: 'Action Recommended',
    authorizing: 'Awaiting Authorization',
    resolving: 'Executing Resolution',
    resolved: 'Incident Resolved',
  }
  const colors: Record<string, string> = {
    monitoring: '#84ff00',
    detecting: '#fbbf24',
    analyzing: '#ff8c00',
    alerting: '#ff4444',
    authorizing: '#ff4444',
    resolving: '#fbbf24',
    resolved: '#84ff00',
  }

  if (!labels[phase]) return null

  return (
    <div style={{
      position: 'fixed',
      top: 56,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 40,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '0.55rem',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: colors[phase] || '#84ff00',
      background: `${colors[phase] || '#84ff00'}12`,
      border: `1px solid ${colors[phase] || '#84ff00'}30`,
      padding: '4px 16px',
      borderRadius: '20px',
      backdropFilter: 'blur(8px)',
    }}>
      ◉ {labels[phase]}
    </div>
  )
}

function DemoLanding({ onStart }: { onStart: () => void }) {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#060a06',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(132,255,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(132,255,0,0.02) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(132,255,0,0.06) 0%, transparent 70%)',
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
          background: 'radial-gradient(circle, rgba(132,255,0,0.3) 0%, rgba(132,255,0,0.05) 70%)',
          border: '2px solid rgba(132,255,0,0.3)',
          margin: '0 auto 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse-ring 3s ease-in-out infinite',
          boxShadow: '0 0 40px rgba(132,255,0,0.15)',
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#84ff00',
            boxShadow: '0 0 20px rgba(132,255,0,0.5)',
          }} />
        </div>

        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '4rem',
          color: '#fff',
          letterSpacing: '0.12em',
          lineHeight: 0.9,
          marginBottom: '8px',
        }}>
          NOVA
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.6rem',
          color: 'rgba(132,255,0,0.6)',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginBottom: '32px',
        }}>
          THE VOICE THAT NOTICES WHAT NO SINGLE SENSOR CAN
        </div>

        <div style={{
          fontFamily: "'Titillium Web', sans-serif",
          fontSize: '1rem',
          color: 'rgba(255,255,255,0.5)',
          maxWidth: '400px',
          margin: '0 auto 40px',
          lineHeight: 1.6,
          fontWeight: 300,
        }}>
          Nova is ready to watch your plant. The agent will autonomously monitor, detect, and guide you through compound risk scenarios.
        </div>

        <button
          onClick={onStart}
          style={{
            fontFamily: "'Titillium Web', sans-serif",
            fontWeight: 700,
            fontSize: '0.85rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            background: '#84ff00',
            color: '#0a0f0a',
            border: 'none',
            padding: '16px 48px',
            borderRadius: '50px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 0 30px rgba(132,255,0,0.2)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-3px)'
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(132,255,0,0.35)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 0 30px rgba(132,255,0,0.2)'
          }}
        >
          Tap to Begin
        </button>

        <div style={{
          fontFamily: "'Titillium Web', sans-serif",
          fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.25)',
          marginTop: '16px',
          fontStyle: 'italic',
        }}>
          This will request microphone access for voice interaction
        </div>
      </div>

      <div style={{
        position: 'absolute', top: 24, left: 24,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.5rem',
        color: 'rgba(255,255,255,0.15)',
        letterSpacing: '0.12em',
      }}>
        v1.0 · DEMO
      </div>
      <div style={{
        position: 'absolute', bottom: 24, left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.45rem',
        color: 'rgba(255,255,255,0.12)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        Agent-Piloted Interface · Compound-Risk Voice Intelligence
      </div>
    </div>
  )
}

function NovaLogoSmall() {
  return (
    <svg width="80" height="24" viewBox="0 0 120 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M 6 26 V 6 L 22 26 V 6" stroke="#84ff00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="42" cy="16" rx="10" ry="10" stroke="#84ff00" strokeWidth="2" fill="none" />
      <circle cx="42" cy="16" r="3" fill="#84ff00" opacity="0.5" />
      <path d="M 62 6 L 72 26 L 82 6" stroke="#84ff00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 92 26 L 102 6 L 112 26" stroke="#84ff00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 96 18 L 108 18" stroke="#84ff00" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
