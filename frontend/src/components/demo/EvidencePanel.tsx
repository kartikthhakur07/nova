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
      background: '#FFFFFF',
      borderLeft: '1px solid #C8C9C6',
      boxShadow: '-4px 0 16px rgba(0,0,0,0.06)',
      zIndex: 30,
      display: 'flex',
      flexDirection: 'column',
      animation: 'fade-up 0.4s ease both',
      padding: '24px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '1px solid #E9E9E5',
        paddingBottom: '12px',
      }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#0D9488', letterSpacing: '0.12em', fontWeight: 700 }}>
            COMPOUND RISK EVIDENCE DRAWER
          </div>
          <div style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: '1.2rem', color: '#0E0D1F', fontWeight: 700 }}>
            Bay 3 Safety Analysis
          </div>
        </div>

        <button
          onClick={() => setEvidenceOpen(false)}
          style={{
            background: '#F7F6F2',
            border: '1px solid #C8C9C6',
            color: '#0E0D1F',
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
          background: '#F7F6F2',
          border: '1px solid #C8C9C6',
          borderRadius: '8px',
          padding: '16px',
        }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#62636A', letterSpacing: '0.1em' }}>
            COMPOUND RISK EVALUATION
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '6px' }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.5rem', color: compoundRiskScore > 0.7 ? '#C84B42' : '#72856C', lineHeight: 1 }}>
              {compoundRiskScore.toFixed(2)}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: compoundRiskScore > 0.7 ? '#C84B42' : '#72856C', fontWeight: 700 }}>
              {riskLevel.toUpperCase()} TIER
            </span>
          </div>
        </div>

        <div style={{
          background: '#F7F6F2',
          border: '1px solid #C8C9C6',
          borderRadius: '8px',
          padding: '16px',
        }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#72856C', letterSpacing: '0.1em', marginBottom: '8px' }}>
            CONVERGING SIGNAL FACTOR 1
          </div>
          <div style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: '0.9rem', color: '#0E0D1F', fontWeight: 600 }}>
            SCADA Gas Sensor Spike (+8.2 ppm H₂S)
          </div>
          <div style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: '0.75rem', color: '#62636A', marginTop: '4px' }}>
            Telemetry feed shows 2-second upward trajectory near compressor C-14 intake.
          </div>
        </div>

        <div style={{
          background: '#F7F6F2',
          border: '1px solid #C8C9C6',
          borderRadius: '8px',
          padding: '16px',
        }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#D98A3A', letterSpacing: '0.1em', marginBottom: '8px' }}>
            CONVERGING SIGNAL FACTOR 2
          </div>
          <div style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: '0.9rem', color: '#0E0D1F', fontWeight: 600 }}>
            Active Hot-Work Permit (PTW-0441)
          </div>
          <div style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: '0.75rem', color: '#62636A', marginTop: '4px' }}>
            Welding torch operation authorized in Zone B3 until 16:00.
          </div>
        </div>

        <div style={{
          background: '#F7F6F2',
          border: '1px solid #C8C9C6',
          borderRadius: '8px',
          padding: '16px',
        }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#D98A3A', letterSpacing: '0.1em', marginBottom: '8px' }}>
            VECTOR MEMORY RETRIEVAL (QDRANT)
          </div>
          <div style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: '0.9rem', color: '#0E0D1F', fontWeight: 600 }}>
            3 Historical Incident Matches (Top: 0.88 Similarity)
          </div>
          <div style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: '0.75rem', color: '#62636A', marginTop: '4px' }}>
            INC-2024-041 shared identical spatial-temporal signature of H₂S buildup during welding.
          </div>
        </div>
      </div>
    </div>
  )
}
