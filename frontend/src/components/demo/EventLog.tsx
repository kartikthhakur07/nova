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
      background: '#FFFFFF',
      borderRight: '1px solid #C8C9C6',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '2px 0 6px rgba(0,0,0,0.02)',
      zIndex: 20,
    }}>
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #E9E9E5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.65rem',
          letterSpacing: '0.12em',
          color: '#0E0D1F',
          fontWeight: 700,
        }}>
          REAL-TIME AUDIT LOG
        </div>
        <div style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#72856C',
          boxShadow: '0 0 8px rgba(114,133,108,0.6)',
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
            color: '#8E9096',
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
              background: evt.risk === 'critical' ? 'rgba(200,75,66,0.08)' : evt.risk === 'high' ? 'rgba(217,138,58,0.08)' : '#F7F6F2',
              borderLeft: `3px solid ${evt.risk === 'critical' ? '#C84B42' : evt.risk === 'high' ? '#D98A3A' : evt.risk === 'elevated' ? '#D98A3A' : '#72856C'}`,
              borderRadius: '0 6px 6px 0',
              padding: '10px 12px',
              animation: 'fade-up 0.3s ease both',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
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
                color: '#62636A',
              }}>
                {new Date(evt.timestamp).toLocaleTimeString()}
              </span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.5rem',
                color: evt.risk === 'critical' ? '#C84B42' : '#72856C',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}>
                {evt.type}
              </span>
            </div>

            <div style={{
              fontFamily: "'Titillium Web', sans-serif",
              fontSize: '0.75rem',
              color: '#0E0D1F',
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
        borderTop: '1px solid #E9E9E5',
        background: '#F7F6F2',
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.55rem',
          letterSpacing: '0.12em',
          color: '#62636A',
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
                  background: '#FFFFFF',
                  border: '1px solid #C8C9C6',
                  borderRadius: '6px',
                  color: '#62636A',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  fontFamily: "'Titillium Web', sans-serif",
                  fontSize: '0.8rem',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#F3DFC0'
                  e.currentTarget.style.color = '#D98A3A'
                  e.currentTarget.style.borderColor = '#D98A3A'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#FFFFFF'
                  e.currentTarget.style.color = '#62636A'
                  e.currentTarget.style.borderColor = '#C8C9C6'
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
