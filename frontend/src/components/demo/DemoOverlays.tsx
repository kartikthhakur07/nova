import { useDemoStore } from '../../store/useDemoStore'
import { useSimulationStore } from '../../store/useSimulationStore'

export default function DemoOverlays() {
  const isSim = useSimulationStore(s => s.isRunning)
  const store = isSim ? useSimulationStore() : useDemoStore()

  const { activeOverlayView, setOverlayView } = store as any

  if (activeOverlayView === 'none') return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(6,10,6,0.97)',
        backdropFilter: 'blur(24px)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        animation: 'fade-up 0.3s cubic-bezier(0.25, 0.1, 0.25, 1) both',
        padding: '32px 48px',
        overflow: 'auto',
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '28px',
        borderBottom: '1px solid rgba(255,255,255,0.12)',
        paddingBottom: '18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.7rem',
            letterSpacing: '0.16em',
            color: '#84ff00',
            background: 'rgba(132,255,0,0.12)',
            border: '1px solid rgba(132,255,0,0.4)',
            padding: '6px 16px',
            borderRadius: '4px',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}>
            FULL SCREEN AGENT VIEW · {activeOverlayView.toUpperCase()}
          </div>
        </div>

        <button
          onClick={() => setOverlayView('none')}
          style={{
            fontFamily: "'Titillium Web', sans-serif",
            fontWeight: 700,
            fontSize: '0.85rem',
            letterSpacing: '0.08em',
            color: '#1a1a1a',
            background: '#84ff00',
            border: 'none',
            padding: '10px 24px',
            borderRadius: '6px',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(132,255,0,0.3)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          ✕ Close Full Screen View
        </button>
      </div>

      <div style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        {activeOverlayView === 'tracks' && <RecentTracksContent />}
        {activeOverlayView === 'audit' && <AuditTrailContent />}
        {activeOverlayView === 'signals' && <SignalsContent />}
      </div>
    </div>
  )
}

function RecentTracksContent() {
  const tracks = [
    { id: 'TRK-9981', ts: '14:42:11', score: 0.88, case: 'INC-2024-041', vector: 'H2S Gas Leak + Welding Permit Correlation', outcome: 'Permit Suspended · Zone Evacuated', details: 'Qdrant vector query matched 3 historical gas-plus-welding incidents in Bay 3.' },
    { id: 'TRK-9942', ts: '14:38:04', score: 0.81, case: 'INC-2024-019', vector: 'Compressor Overpressure + Seal Fault', outcome: 'Valve Throttled · Inspected', details: 'Thermal drift correlated with CMMS maintenance fault code C-14.' },
    { id: 'TRK-9890', ts: '14:15:30', score: 0.74, case: 'INC-2023-088', vector: 'Thermal Drift + High Flow Rate', outcome: 'Cooling Loop Engaged', details: 'Automatic flow valve adjustment prevented secondary overheating.' },
    { id: 'TRK-9811', ts: '13:52:19', score: 0.69, case: 'INC-2023-014', vector: 'Vibration Spike + Unassigned Window', outcome: 'Supervisory Handover', details: 'Shift roster gap identified during supervisor changeover.' },
  ]

  return (
    <div style={{ animation: 'fade-up 0.4s ease both' }}>
      <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.8rem', color: '#fff', marginBottom: '8px', letterSpacing: '0.04em' }}>
        Recent Retrieval Tracks (Qdrant Memory)
      </h2>
      <p style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: '1rem', color: 'rgba(255,255,255,0.6)', marginBottom: '32px', fontWeight: 300 }}>
        Full-screen vector retrieval trace logs matching active plant telemetry against 9,200+ historical incident records.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {tracks.map(t => (
          <div key={t.id} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(132,255,0,0.25)',
            borderRadius: '12px',
            padding: '24px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ width: '61.8%' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#84ff00', fontWeight: 700 }}>{t.id}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>{t.ts}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#fbbf24', background: 'rgba(251,191,36,0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                  {t.case}
                </span>
              </div>
              <div style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: '1.1rem', color: '#fff', fontWeight: 600, marginBottom: '4px' }}>{t.vector}</div>
              <div style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{t.details}</div>
            </div>
            <div style={{ width: '38.2%', textAlign: 'right' }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>SIMILARITY SCORE</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '2.2rem', fontWeight: 700, color: '#84ff00' }}>{t.score.toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AuditTrailContent() {
  const entries = [
    { ts: '14:42:28', event: 'Officer authorized permit suspension PTW-0441 via voice command', actor: 'Officer Sharma', type: 'ACTION', hash: '0x8f2a...991c' },
    { ts: '14:42:14', event: 'Nova voice alert initiated to control room speaker', actor: 'Nova AI', type: 'VOICE', hash: '0x4b1e...330d' },
    { ts: '14:42:12', event: 'Compound risk score computed: 0.72 -> HIGH tier alert', actor: 'Risk Engine', type: 'REASONING', hash: '0x12c9...77a4' },
    { ts: '14:42:11', event: 'Qdrant vector query executed — 3 matches found (top 0.88)', actor: 'Qdrant Memory', type: 'RETRIEVAL', hash: '0x99e1...12b8' },
    { ts: '14:42:09', event: 'PTW-0441 hot-work permit cross-referenced in Bay 3', actor: 'Permit DB', type: 'PERMIT', hash: '0x33f4...881a' },
    { ts: '14:42:08', event: 'H2S gas concentration spike detected (+8.2 ppm) in Bay 3', actor: 'Sensor SCADA', type: 'SENSOR', hash: '0x55d2...004f' },
  ]

  return (
    <div style={{ animation: 'fade-up 0.4s ease both' }}>
      <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.8rem', color: '#fff', marginBottom: '8px', letterSpacing: '0.04em' }}>
        Immutable Audit Trail Log
      </h2>
      <p style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: '1rem', color: 'rgba(255,255,255,0.6)', marginBottom: '32px', fontWeight: 300 }}>
        Cryptographically sealed audit log recording every sensor reading, risk score, voice prompt, and human decision.
      </p>

      <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
        {entries.map((e, i) => (
          <div key={i} style={{
            padding: '18px 24px',
            borderBottom: i < entries.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            display: 'flex',
            gap: '20px',
            alignItems: 'center',
            background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
          }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', width: '80px' }}>{e.ts}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: '#84ff00', background: 'rgba(132,255,0,0.12)', border: '1px solid rgba(132,255,0,0.3)', padding: '3px 10px', borderRadius: '4px', width: '95px', textAlign: 'center', fontWeight: 700 }}>{e.type}</span>
            <span style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: '0.95rem', color: '#fff', flex: 1, fontWeight: 400 }}>{e.event}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>{e.actor}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: '#fbbf24', opacity: 0.6 }}>{e.hash}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SignalsContent() {
  const isSim = useSimulationStore(s => s.isRunning)
  const store = isSim ? useSimulationStore() : useDemoStore()
  const sensors = (store as any).sensors || []

  return (
    <div style={{ animation: 'fade-up 0.4s ease both' }}>
      <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.8rem', color: '#fff', marginBottom: '8px', letterSpacing: '0.04em' }}>
        Converging Telemetry Signals
      </h2>
      <p style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: '1rem', color: 'rgba(255,255,255,0.6)', marginBottom: '32px', fontWeight: 300 }}>
        Full-screen multi-system correlation view evaluating gas sensors, SCADA pressure, thermal imaging, and active permits.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        {sensors.map((s: any, i: number) => {
          const isCrit = s.status === 'critical'
          const isWarn = s.status === 'warning'
          const col = isCrit ? '#ff4444' : isWarn ? '#fbbf24' : '#84ff00'

          return (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${col}40`,
              borderRadius: '12px',
              padding: '22px 26px',
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: col, fontWeight: 700 }}>{s.zone} · {s.type}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: col, background: `${col}15`, border: `1px solid ${col}30`, padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>{s.status.toUpperCase()}</span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '2rem', color: '#fff', fontWeight: 700, marginBottom: '4px' }}>{s.value} {s.unit}</div>
              <div style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Threshold limit: {s.threshold} {s.unit}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
