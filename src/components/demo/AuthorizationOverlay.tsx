import { useDemoStore } from '../../store/useDemoStore'
import { useSimulationStore } from '../../store/useSimulationStore'

export default function AuthorizationOverlay() {
  const isSim = useSimulationStore(s => s.isRunning)
  const store = isSim ? useSimulationStore() : useDemoStore()

  const { authorizationPending, proposedAction, authorizeAction, rejectAction } = store as any

  if (!authorizationPending) return null

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 100,
      width: '90%',
      maxWidth: '540px',
      background: 'rgba(10,14,10,0.98)',
      border: '2px solid #ff4444',
      borderRadius: '12px',
      padding: '28px 32px',
      boxShadow: '0 0 60px rgba(220,38,38,0.4)',
      backdropFilter: 'blur(20px)',
      animation: 'fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
      }}>
        <div style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: '#ff4444',
          boxShadow: '0 0 12px #ff4444',
          animation: 'pulse-ring 1.5s ease-in-out infinite',
        }} />
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.7rem',
          letterSpacing: '0.16em',
          color: '#ff4444',
          fontWeight: 700,
        }}>
          HUMAN-IN-THE-LOOP AUTHORIZATION REQUIRED
        </span>
      </div>

      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '2.2rem',
        color: '#ffffff',
        lineHeight: 1,
        marginBottom: '12px',
        letterSpacing: '0.04em',
      }}>
        SAFETY ACTION PROPOSAL
      </div>

      <div style={{
        background: 'rgba(220,38,38,0.1)',
        border: '1px solid rgba(220,38,38,0.3)',
        borderRadius: '8px',
        padding: '16px 20px',
        marginBottom: '24px',
        fontFamily: "'Titillium Web', sans-serif",
        fontSize: '1rem',
        color: '#ffffff',
        fontWeight: 600,
        lineHeight: 1.4,
      }}>
        {proposedAction || 'Suspend hot-work permit PTW-0441 and evacuate Bay 3 personnel'}
      </div>

      <div style={{
        fontFamily: "'Titillium Web', sans-serif",
        fontSize: '0.8rem',
        color: 'rgba(255,255,255,0.6)',
        marginBottom: '28px',
        fontWeight: 300,
      }}>
        Say <strong style={{ color: '#84ff00' }}>"Authorize"</strong> or <strong style={{ color: '#ff4444' }}>"Reject"</strong> into your microphone, or tap below to execute.
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <button
          onClick={authorizeAction}
          style={{
            flex: 1,
            fontFamily: "'Titillium Web', sans-serif",
            fontWeight: 700,
            fontSize: '0.85rem',
            letterSpacing: '0.08em',
            color: '#0a0f0a',
            background: '#84ff00',
            border: 'none',
            padding: '14px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(132,255,0,0.3)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          [ AUTHORIZE ACTION ]
        </button>

        <button
          onClick={rejectAction}
          style={{
            flex: 1,
            fontFamily: "'Titillium Web', sans-serif",
            fontWeight: 700,
            fontSize: '0.85rem',
            letterSpacing: '0.08em',
            color: '#ff4444',
            background: 'rgba(220,38,38,0.15)',
            border: '1px solid rgba(220,38,38,0.4)',
            padding: '14px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          [ REJECT ACTION ]
        </button>
      </div>
    </div>
  )
}
