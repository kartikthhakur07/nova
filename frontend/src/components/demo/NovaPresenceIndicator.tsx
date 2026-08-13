import { useDemoStore } from '../../store/useDemoStore'
import { useSimulationStore } from '../../store/useSimulationStore'

export default function NovaPresenceIndicator() {
  const isSim = useSimulationStore(s => s.isRunning)
  const store = isSim ? useSimulationStore() : useDemoStore()

  const { novaState, novaCaption } = store as any

  const stateColors: Record<string, string> = {
    speaking: '#2563EB',
    processing: '#D98A3A',
    listening: '#0D9488',
    idle: '#62636A',
  }

  const stateLabels: Record<string, string> = {
    speaking: 'NOVA · SPEAKING',
    processing: 'NOVA · THINKING',
    listening: 'NOVA · LISTENING',
    idle: 'NOVA · IDLE',
  }

  const dotColor = stateColors[novaState] || '#0D9488'
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
          background: '#FFFFFF',
          border: `1px solid ${isInterim ? '#C8C9C6' : '#0D9488'}`,
          borderRadius: '10px',
          padding: '14px 20px',
          maxWidth: '440px',
          color: isInterim ? '#62636A' : '#0E0D1F',
          fontFamily: "'Titillium Web', sans-serif",
          fontSize: isInterim ? '0.8rem' : '0.9rem',
          lineHeight: 1.5,
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          animation: 'fade-up 0.3s ease both',
          transition: 'all 0.2s ease',
          fontStyle: isInterim ? 'italic' : 'normal',
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.55rem',
            color: isInterim ? '#62636A' : '#0D9488',
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
        background: '#FFFFFF',
        border: `1px solid ${novaState === 'speaking' ? 'rgba(37,99,235,0.4)' : novaState === 'processing' ? 'rgba(217,138,58,0.4)' : 'rgba(13,148,136,0.4)'}`,
        borderRadius: '30px',
        padding: '8px 18px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
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
              }} />
            ))}
          </div>
        ) : (
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: dotColor,
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
          color: '#8E9096',
          letterSpacing: '0.05em',
          borderLeft: '1px solid #C8C9C6',
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
