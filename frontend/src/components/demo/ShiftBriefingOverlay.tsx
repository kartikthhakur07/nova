import React from 'react'
import { useSimulationStore } from '../../store/useSimulationStore'

interface ShiftBriefingOverlayProps {
  onAcknowledge: () => void
  onReplayVoice: () => void
}

export default function ShiftBriefingOverlay({ onAcknowledge, onReplayVoice }: ShiftBriefingOverlayProps) {
  const { briefingData, isFetchingBriefing, novaState } = useSimulationStore()

  if (isFetchingBriefing) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(247,246,242,0.92)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
      }}>
        <div style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          border: '3px solid rgba(13,148,136,0.15)',
          borderTopColor: '#0D9488',
          animation: 'spin 1s linear infinite',
          boxShadow: '0 0 30px rgba(13,148,136,0.2)',
        }} />
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.85rem',
          color: '#0D9488',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontWeight: 700,
        }}>
          Generating Groq LLM Shift Handover Briefing...
        </div>
        <div style={{
          fontFamily: "'Titillium Web', sans-serif",
          fontSize: '0.75rem',
          color: '#62636A',
        }}>
          Analyzing 142 continuous telemetry sensors & active permits across 5 bays
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (!briefingData) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(14,13,31,0.4)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      animation: 'fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
    }}>
      {/* Grid background accent */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(200,201,198,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(200,201,198,0.2) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Main HUD Briefing Box */}
      <div style={{
        width: '100%',
        maxWidth: '720px',
        background: '#FFFFFF',
        border: '1px solid #C8C9C6',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        padding: '36px',
        position: 'relative',
        zIndex: 2,
        overflow: 'hidden',
      }}>
        {/* Corner accents */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 24, height: 24, borderTop: '2px solid #0D9488', borderLeft: '2px solid #0D9488' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: 24, height: 24, borderTop: '2px solid #0D9488', borderRight: '2px solid #0D9488' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 24, height: 24, borderBottom: '2px solid #0D9488', borderLeft: '2px solid #0D9488' }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderBottom: '2px solid #0D9488', borderRight: '2px solid #0D9488' }} />

        {/* Top Header Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#0D9488',
              boxShadow: '0 0 12px #0D9488',
              animation: 'pulse-glow 2s infinite',
            }} />
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.65rem',
              color: '#0D9488',
              letterSpacing: '0.2em',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}>
              NOVA AGENT SYSTEM · SHIFT HANDOVER
            </div>
          </div>

          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.55rem',
            color: '#D98A3A',
            background: '#F3DFC0',
            border: '1px solid #D98A3A',
            padding: '4px 10px',
            borderRadius: '4px',
            letterSpacing: '0.1em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 600,
          }}>
            <span style={{ fontSize: '0.7rem' }}>⚡</span> ORCHESTRATED VIA GROQ LLM
          </div>
        </div>

        {/* Salutation Title */}
        <h2 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '2.4rem',
          color: '#0E0D1F',
          letterSpacing: '0.08em',
          margin: '0 0 12px 0',
          lineHeight: 1.0,
        }}>
          {briefingData.salutation}
        </h2>

        {/* Summary Card */}
        <div style={{
          background: '#F7F6F2',
          border: '1px solid #C8C9C6',
          borderRadius: '10px',
          padding: '16px 20px',
          marginBottom: '24px',
          fontFamily: "'Titillium Web', sans-serif",
          fontSize: '0.95rem',
          color: '#0E0D1F',
          lineHeight: 1.6,
        }}>
          {briefingData.summary}
        </div>

        {/* Highlights List */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.6rem',
            color: '#62636A',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: '12px',
            fontWeight: 600,
          }}>
            Key Plant Highlights While Away:
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}>
            {briefingData.highlights.map((h, i) => (
              <div key={i} style={{
                background: '#F7F6F2',
                border: '1px solid #E9E9E5',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}>
                <span style={{ color: '#0D9488', fontSize: '0.85rem', fontWeight: 'bold' }}>✓</span>
                <span style={{
                  fontFamily: "'Titillium Web', sans-serif",
                  fontSize: '0.8rem',
                  color: '#0E0D1F',
                  lineHeight: 1.4,
                }}>
                  {h}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Voice Status & Action Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '20px',
          borderTop: '1px solid #C8C9C6',
        }}>
          {/* Speaking Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex',
              gap: 3,
              alignItems: 'center',
              height: 16,
            }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{
                  width: 3,
                  background: novaState === 'speaking' ? '#2563EB' : '#0D9488',
                  borderRadius: 2,
                  animation: novaState === 'speaking'
                    ? `wave-bar ${0.5 + i * 0.1}s ease-in-out infinite alternate`
                    : 'none',
                  height: novaState === 'speaking' ? '100%' : '6px',
                }} />
              ))}
            </div>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.65rem',
              color: novaState === 'speaking' ? '#2563EB' : '#0D9488',
              letterSpacing: '0.1em',
              fontWeight: 600,
            }}>
              {novaState === 'speaking' ? 'NOVA SPEAKING BRIEFING...' : 'VOICE BRIEFING COMPLETED'}
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onReplayVoice}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.65rem',
                letterSpacing: '0.08em',
                color: '#0E0D1F',
                background: '#F7F6F2',
                border: '1px solid #C8C9C6',
                padding: '10px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#E9E9E5'}
              onMouseLeave={e => e.currentTarget.style.background = '#F7F6F2'}
            >
              🔊 Replay Voice
            </button>

            <button
              onClick={onAcknowledge}
              style={{
                fontFamily: "'Titillium Web', sans-serif",
                fontWeight: 700,
                fontSize: '0.85rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                background: '#0D9488',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 14px rgba(13,148,136,0.3)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(13,148,136,0.4)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(13,148,136,0.3)'
              }}
            >
              ACKNOWLEDGE & START LIVE PIPELINE →
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes wave-bar {
          from { height: 4px; }
          to   { height: 16px; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
