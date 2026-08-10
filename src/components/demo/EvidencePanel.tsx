import { useDemoStore } from '../../store/useDemoStore'
import { useSimulationStore } from '../../store/useSimulationStore'

export default function EvidencePanel() {
  const isSim = useSimulationStore(s => s.isRunning)
  const store = isSim ? useSimulationStore() : useDemoStore()

  const { evidenceOpen, setEvidenceOpen, compoundRiskScore, riskLevel } = store as any

  if (!evidenceOpen) return null

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: '380px',
      height: '100%',
      background: 'rgba(6,10,6,0.96)',
      borderLeft: '1px solid rgba(132,255,0,0.2)',
      backdropFilter: 'blur(16px)',
      zIndex: 30,
      display: 'flex',
      flexDirection: 'column',
      animation: 'fade-up 0.4s ease both',
      padding: '24px',
    }}>
      <div style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '12px',
      }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#84ff00', letterSpacing: '0.12em', fontWeight: 700 }}>
            COMPOUND RISK EVIDENCE DRAWER
          </div>
          <div style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}>
            Bay 3 Safety Analysis
          </div>
        </div>

        <button
          onClick={() => setEvidenceOpen(false)}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            color: '#fff',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.7rem',
          }}
        >
          ✕ CLOSE
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          padding: '16px',
        }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
            COMPOUND RISK EVALUATION
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '6px' }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.5rem', color: compoundRiskScore > 0.7 ? '#ff4444' : '#84ff00', lineHeight: 1 }}>
              {compoundRiskScore.toFixed(2)}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: compoundRiskScore > 0.7 ? '#ff4444' : '#84ff00', fontWeight: 700 }}>
              {riskLevel.toUpperCase()} TIER
            </span>
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(132,255,0,0.15)',
          borderRadius: '8px',
          padding: '16px',
        }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#84ff00', letterSpacing: '0.1em', marginBottom: '8px' }}>
            CONVERGING SIGNAL FACTOR 1
          </div>
          <div style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
            SCADA Gas Sensor Spike (+8.2 ppm H₂S)
          </div>
          <div style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
            Telemetry feed shows 2-second upward trajectory near compressor C-14 intake.
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(249,115,22,0.2)',
          borderRadius: '8px',
          padding: '16px',
        }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#ff8c00', letterSpacing: '0.1em', marginBottom: '8px' }}>
            CONVERGING SIGNAL FACTOR 2
          </div>
          <div style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
            Active Hot-Work Permit (PTW-0441)
          </div>
          <div style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
            Welding torch operation authorized in Zone B3 until 16:00.
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(251,191,36,0.2)',
          borderRadius: '8px',
          padding: '16px',
        }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#fbbf24', letterSpacing: '0.1em', marginBottom: '8px' }}>
            VECTOR MEMORY RETRIEVAL (QDRANT)
          </div>
          <div style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
            3 Historical Incident Matches (Top: 0.88 Similarity)
          </div>
          <div style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
            INC-2024-041 shared identical spatial-temporal signature of H₂S buildup during welding.
          </div>
        </div>
      </div>
    </div>
  )
}
