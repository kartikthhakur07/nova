import { useDemoStore } from '../../store/useDemoStore'
import { useSimulationStore } from '../../store/useSimulationStore'

export default function NovaPresenceIndicator() {
  const isSim = useSimulationStore(s => s.isRunning)
  const store = isSim ? useSimulationStore() : useDemoStore()

  const { novaState, novaCaption } = store as any

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
      {novaCaption && (
        <div style={{
          background: 'rgba(8,12,8,0.95)',
          border: '1px solid rgba(132,255,0,0.3)',
          borderRadius: '8px',
          padding: '14px 20px',
          maxWidth: '420px',
          color: '#ffffff',
          fontFamily: "'Titillium Web', sans-serif",
          fontSize: '0.9rem',
          lineHeight: 1.4,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(16px)',
          animation: 'fade-up 0.3s ease both',
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.6rem',
            color: '#84ff00',
            letterSpacing: '0.12em',
            marginBottom: '4px',
            fontWeight: 700,
          }}>
            NOVA VOICE INTELLIGENCE
          </div>
          {novaCaption}
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(8,12,8,0.9)',
        border: '1px solid rgba(132,255,0,0.2)',
        borderRadius: '30px',
        padding: '8px 18px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}>
        <div style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: novaState === 'speaking' ? '#3b82f6' : novaState === 'processing' ? '#fbbf24' : '#84ff00',
          boxShadow: `0 0 10px ${novaState === 'speaking' ? '#3b82f6' : '#84ff00'}`,
          animation: novaState === 'speaking' ? 'pulse-ring 1s ease-in-out infinite' : 'pulse-ring 2.5s ease-in-out infinite',
        }} />

        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.65rem',
          letterSpacing: '0.12em',
          color: '#84ff00',
          fontWeight: 700,
          textTransform: 'uppercase',
        }}>
          NOVA · {novaState}
        </span>
      </div>
    </div>
  )
}
