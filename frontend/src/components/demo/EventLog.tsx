import { useDemoStore } from '../../store/useDemoStore'
import { useSimulationStore } from '../../store/useSimulationStore'
import { Link } from 'react-router-dom'
import { Activity, ShieldCheck, Cpu, Database } from 'lucide-react'

const PHASE_5_NAV_ITEMS = [
  { label: 'Live Plant',         icon: Activity,        to: '/dashboard/live-plant' },
  { label: 'Active Case',        icon: ShieldCheck,     to: '/dashboard/active-case' },
  { label: 'Counterfactual',     icon: Cpu,             to: '/dashboard/counterfactual' },
  { label: 'Memory & Reports',   icon: Database,        to: '/dashboard/reports' },
]

export default function EventLog() {
  const isSim = useSimulationStore(s => s.isRunning)
  const store = isSim ? useSimulationStore() : useDemoStore()
  const events = store.events

  return (
    <div style={{
      width: '280px',
      height: '100%',
      background: 'rgba(6,9,6,0.95)',
      borderRight: '1px solid rgba(132,255,0,0.12)',
      display: 'flex',
      flexDirection: 'column',
      backdropFilter: 'blur(12px)',
      zIndex: 20,
    }}>
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.65rem',
          letterSpacing: '0.12em',
          color: '#84ff00',
          fontWeight: 700,
        }}>
          REAL-TIME AUDIT LOG
        </div>
        <div style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#84ff00',
          boxShadow: '0 0 8px rgba(132,255,0,0.8)',
          animation: 'pulse-ring 2s ease-in-out infinite',
        }} />
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {events.length === 0 && (
          <div style={{
            fontFamily: "'Titillium Web', sans-serif",
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.3)',
            textAlign: 'center',
            marginTop: '40px',
          }}>
            Awaiting telemetry events...
          </div>
        )}

        {events.map((evt: any) => (
          <div
            key={evt.id}
            style={{
              background: evt.risk === 'critical' ? 'rgba(220,38,38,0.12)' : evt.risk === 'high' ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.03)',
              borderLeft: `3px solid ${evt.risk === 'critical' ? '#ff4444' : evt.risk === 'high' ? '#ff8c00' : evt.risk === 'elevated' ? '#fbbf24' : '#84ff00'}`,
              borderRadius: '0 6px 6px 0',
              padding: '10px 12px',
              animation: 'fade-up 0.3s ease both',
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px',
            }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.55rem',
                color: 'rgba(255,255,255,0.4)',
              }}>
                {new Date(evt.timestamp).toLocaleTimeString()}
              </span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.5rem',
                color: evt.risk === 'critical' ? '#ff4444' : '#84ff00',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}>
                {evt.type}
              </span>
            </div>

            <div style={{
              fontFamily: "'Titillium Web', sans-serif",
              fontSize: '0.75rem',
              color: '#ffffff',
              lineHeight: 1.35,
              fontWeight: 400,
            }}>
              {evt.message}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.2)',
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.55rem',
          letterSpacing: '0.12em',
          color: 'rgba(255,255,255,0.4)',
          marginBottom: '10px',
        }}>
          PHASE 5 VIEWS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {PHASE_5_NAV_ITEMS.map(item => {
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '6px',
                  color: 'rgba(255,255,255,0.7)',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  fontFamily: "'Titillium Web', sans-serif",
                  fontSize: '0.8rem',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(132,255,0,0.1)'
                  e.currentTarget.style.color = '#84ff00'
                  e.currentTarget.style.borderColor = 'rgba(132,255,0,0.3)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
                }}
              >
                <Icon size={14} style={{ flexShrink: 0 }} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
