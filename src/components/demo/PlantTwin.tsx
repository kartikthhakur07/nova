import { useDemoStore } from '../../store/useDemoStore'
import { useSimulationStore } from '../../store/useSimulationStore'

export default function PlantTwin() {
  const isSim = useSimulationStore(s => s.isRunning)
  const store = isSim ? useSimulationStore() : useDemoStore()

  const { focusedZone, resetView, sensors, compoundRiskScore } = store as any

  const zones = [
    { id: 'Bay 1', label: 'BAY 1 · DISTILLATION', x: 40, y: 40, w: 260, h: 160, type: 'Distillation Unit' },
    { id: 'Bay 2', label: 'BAY 2 · HEAT EXCHANGER', x: 340, y: 40, w: 260, h: 160, type: 'Exchanger Loop' },
    { id: 'Bay 3', label: 'BAY 3 · COMPRESSOR C-14', x: 640, y: 40, w: 280, h: 160, type: 'Gas Compressor' },
    { id: 'Bay 4', label: 'BAY 4 · VAPOR STORAGE', x: 40, y: 240, w: 260, h: 160, type: 'Storage Spheres' },
    { id: 'Bay 5', label: 'BAY 5 · LOADING DOCK', x: 340, y: 240, w: 580, h: 160, type: 'Manifold Rack' },
  ]

  let viewTransform = 'scale(1) translate(0px, 0px)'
  if (focusedZone === 'Bay 3') {
    viewTransform = 'scale(1.75) translate(-320px, -10px)'
  } else if (focusedZone === 'Bay 1') {
    viewTransform = 'scale(1.75) translate(140px, -10px)'
  } else if (focusedZone === 'Bay 2') {
    viewTransform = 'scale(1.75) translate(-90px, -10px)'
  } else if (focusedZone === 'Bay 4') {
    viewTransform = 'scale(1.75) translate(140px, -130px)'
  } else if (focusedZone === 'Bay 5') {
    viewTransform = 'scale(1.5) translate(-160px, -130px)'
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      background: '#060906',
    }}>
      <div style={{
        width: '100%',
        height: '100%',
        transform: viewTransform,
        transformOrigin: 'center center',
        transition: 'transform 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <svg width="100%" height="100%" viewBox="0 0 960 440" style={{ width: '100%', height: '100%' }}>
          <defs>
            <linearGradient id="grid-pattern" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(132,255,0,0.04)" strokeWidth="1" />
            </linearGradient>

            <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <rect width="100%" height="100%" fill="url(#grid-pattern)" />

          <path d="M 170 200 L 170 240 M 470 200 L 470 240 M 780 200 L 780 240" stroke="rgba(132,255,0,0.2)" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M 300 120 L 340 120 M 600 120 L 640 120" stroke="rgba(132,255,0,0.2)" strokeWidth="2" strokeDasharray="4 4" />

          {zones.map((zone) => {
            const isFocused = focusedZone === zone.id
            const zoneSensors = sensors.filter((s: any) => s.zone === zone.id)
            const hasCritical = zoneSensors.some((s: any) => s.status === 'critical')

            return (
              <g
                key={zone.id}
                onClick={() => store.focusZone ? store.focusZone(zone.id) : null}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={zone.x}
                  y={zone.y}
                  width={zone.w}
                  height={zone.h}
                  rx="8"
                  fill={hasCritical ? 'rgba(220,38,38,0.12)' : isFocused ? 'rgba(132,255,0,0.08)' : 'rgba(255,255,255,0.02)'}
                  stroke={hasCritical ? '#ff4444' : isFocused ? '#84ff00' : 'rgba(255,255,255,0.12)'}
                  strokeWidth={isFocused || hasCritical ? 2.5 : 1}
                  filter={hasCritical || isFocused ? 'url(#neon-glow)' : undefined}
                  style={{ transition: 'all 0.4s ease' }}
                />

                <rect
                  x={zone.x}
                  y={zone.y}
                  width={zone.w}
                  height="26"
                  fill={hasCritical ? 'rgba(220,38,38,0.25)' : isFocused ? 'rgba(132,255,0,0.15)' : 'rgba(255,255,255,0.04)'}
                  rx="8"
                />
                <text
                  x={zone.x + 12}
                  y={zone.y + 17}
                  fontFamily="'JetBrains Mono', monospace"
                  fontSize="9"
                  fontWeight="700"
                  fill={hasCritical ? '#ff4444' : isFocused ? '#84ff00' : 'rgba(255,255,255,0.7)'}
                  letterSpacing="0.1em"
                >
                  {zone.label}
                </text>

                {zone.id === 'Bay 3' && (
                  <g transform={`translate(${zone.x + 30}, ${zone.y + 45})`}>
                    <rect x="0" y="0" width="70" height="70" rx="6" fill="rgba(255,255,255,0.05)" stroke={hasCritical ? '#ff4444' : 'rgba(132,255,0,0.3)'} strokeWidth="1" />
                    <circle cx="35" cy="35" r="22" fill="none" stroke={hasCritical ? '#ff4444' : '#84ff00'} strokeWidth="1.5" strokeDasharray="6 3" />
                    <text x="35" y="38" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="#fff">C-14</text>
                  </g>
                )}

                <g transform={`translate(${zone.x + (zone.id === 'Bay 3' ? 120 : 20)}, ${zone.y + 42})`}>
                  {zoneSensors.map((sen: any, idx: number) => (
                    <g key={sen.id} transform={`translate(0, ${idx * 24})`}>
                      <text fontFamily="'JetBrains Mono', monospace" fontSize="9" fill="rgba(255,255,255,0.5)">
                        {sen.type}:
                      </text>
                      <text
                        x="70"
                        fontFamily="'JetBrains Mono', monospace"
                        fontSize="10"
                        fontWeight="700"
                        fill={sen.status === 'critical' ? '#ff4444' : sen.status === 'warning' ? '#fbbf24' : '#84ff00'}
                      >
                        {sen.value} {sen.unit}
                      </text>
                    </g>
                  ))}
                </g>
              </g>
            )
          })}
        </svg>
      </div>

      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '24px',
        background: 'rgba(8,12,8,0.9)',
        border: '1px solid rgba(132,255,0,0.2)',
        borderRadius: '8px',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        backdropFilter: 'blur(12px)',
      }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
            COMPOUND RISK INDEX
          </div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '1.8rem',
            lineHeight: 1,
            color: compoundRiskScore > 0.7 ? '#ff4444' : compoundRiskScore > 0.4 ? '#fbbf24' : '#84ff00',
          }}>
            {compoundRiskScore.toFixed(2)}
          </div>
        </div>

        {focusedZone && (
          <button
            onClick={resetView}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.65rem',
              color: '#84ff00',
              background: 'rgba(132,255,0,0.1)',
              border: '1px solid rgba(132,255,0,0.3)',
              padding: '6px 14px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            RESET CAMERA VIEW
          </button>
        )}
      </div>
    </div>
  )
}
