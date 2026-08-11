import { useDemoStore } from '../../store/useDemoStore'
import { useSimulationStore } from '../../store/useSimulationStore'

export default function NovaPresenceIndicator() {
  const isSim = useSimulationStore(s => s.isRunning)
  const store = isSim ? useSimulationStore() : useDemoStore()

  const { novaState, novaCaption } = store as any

  const stateColors: Record<string, string> = {
    speaking: '#3b82f6',
    processing: '#fbbf24',
    listening: '#84ff00',
    idle: 'rgba(132,255,0,0.4)',
  }

  const stateLabels: Record<string, string> = {
    speaking: 'NOVA · SPEAKING',
    processing: 'NOVA · THINKING',
    listening: 'NOVA · LISTENING',
    idle: 'NOVA · IDLE',
  }

  const dotColor = stateColors[novaState] || '#84ff00'
  const isInterim = novaCaption?.startsWith('🎙')

  return (
    <div style={{
      position: 'absolute',
      bottom: '24px',
      right: '24px',
      zIndex: 40,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '12px',
      pointerEvents: 'none',
    }}>
      {/* Caption / transcript bubble */}
      {novaCaption && (
        <div style={{
          background: isInterim ? 'rgba(8,12,8,0.88)' : 'rgba(8,12,8,0.95)',
          border: `1px solid ${isInterim ? 'rgba(132,255,0,0.2)' : 'rgba(132,255,0,0.4)'}`,
          borderRadius: '10px',
          padding: '14px 20px',
          maxWidth: '440px',
          color: isInterim ? 'rgba(255,255,255,0.6)' : '#ffffff',
          fontFamily: "'Titillium Web', sans-serif",
          fontSize: isInterim ? '0.8rem' : '0.9rem',
          lineHeight: 1.5,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(16px)',
          animation: 'fade-up 0.3s ease both',
          transition: 'all 0.2s ease',
          fontStyle: isInterim ? 'italic' : 'normal',
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.55rem',
            color: isInterim ? 'rgba(132,255,0,0.5)' : '#84ff00',
            letterSpacing: '0.12em',
            marginBottom: '6px',
            fontWeight: 700,
          }}>
            {isInterim ? '🎙 DEEPGRAM STT — HEARING...' : 'NOVA VOICE INTELLIGENCE'}
          </div>
          {novaCaption}
        </div>
      )}

      {/* Status pill */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(8,12,8,0.9)',
        border: `1px solid ${novaState === 'speaking' ? 'rgba(59,130,246,0.3)' : novaState === 'processing' ? 'rgba(251,191,36,0.3)' : 'rgba(132,255,0,0.2)'}`,
        borderRadius: '30px',
        padding: '8px 18px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}>
        {/* Animated bars for listening/speaking */}
        {(novaState === 'listening' || novaState === 'speaking') ? (
          <div style={{ display: 'flex', gap: 2, alignItems: 'center', height: 14 }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{
                width: 3,
                background: dotColor,
                borderRadius: 2,
                animation: `waveform-bar ${0.6 + i * 0.15}s ease-in-out infinite alternate`,
                height: '100%',
                boxShadow: `0 0 4px ${dotColor}`,
              }} />
            ))}
          </div>
        ) : (
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: dotColor,
            boxShadow: `0 0 10px ${dotColor}`,
          }} />
        )}

        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.65rem',
          letterSpacing: '0.12em',
          color: dotColor,
          fontWeight: 700,
        }}>
          {stateLabels[novaState] || 'NOVA · IDLE'}
        </span>

        {/* Deepgram badge */}
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.45rem',
          color: 'rgba(132,255,0,0.35)',
          letterSpacing: '0.05em',
          borderLeft: '1px solid rgba(132,255,0,0.15)',
          paddingLeft: 8,
        }}>
          DEEPGRAM
        </span>
      </div>

      <style>{`
        @keyframes waveform-bar {
          from { height: 4px; }
          to   { height: 14px; }
        }
      `}</style>
    </div>
  )
}
