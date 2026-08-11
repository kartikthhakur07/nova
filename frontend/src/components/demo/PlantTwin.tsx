import { useSimulationStore } from '../../store/useSimulationStore'
import { useDemoStore } from '../../store/useDemoStore'

// ─── Colour helpers ───────────────────────────────────────────────────────── //
const sensorColor = (status: string) =>
  status === 'critical' ? '#ff4444' : status === 'warning' ? '#fbbf24' : '#84ff00'

// ─── Animated pipeline stroke-dashoffset ─────────────────────────────────── //
const pipelineStyle: React.CSSProperties = {
  animation: 'flow-pipe 2s linear infinite',
}

// ─── Bay Machinery SVGs ───────────────────────────────────────────────────── //

function Bay1Machinery({ sensors }: { sensors: any[] }) {
  const h2s = sensors.find(s => s.type === 'H₂S')
  const ch4 = sensors.find(s => s.type === 'CH₄')
  return (
    <g>
      {/* Distillation Column */}
      <rect x="60" y="80" width="40" height="120" rx="4" fill="rgba(132,255,0,0.08)" stroke="#84ff00" strokeWidth="1.5" />
      <rect x="62" y="82" width="36" height="20" rx="2" fill="rgba(132,255,0,0.15)" />
      <text x="80" y="96" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6" fill="#84ff00">T-01</text>
      {/* Column trays */}
      {[115, 135, 155, 175].map(y => (
        <line key={y} x1="62" y1={y} x2="98" y2={y} stroke="rgba(132,255,0,0.3)" strokeWidth="1" />
      ))}

      {/* Condenser */}
      <rect x="130" y="80" width="55" height="35" rx="4" fill="rgba(132,255,0,0.06)" stroke="rgba(132,255,0,0.5)" strokeWidth="1" />
      <text x="157" y="102" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6" fill="rgba(132,255,0,0.8)">COND E-01</text>

      {/* Reboiler */}
      <ellipse cx="157" cy="220" rx="30" ry="16" fill="rgba(132,255,0,0.06)" stroke="rgba(132,255,0,0.5)" strokeWidth="1" />
      <text x="157" y="224" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6" fill="rgba(132,255,0,0.8)">REBOILER E-02</text>

      {/* Pipelines */}
      <path d="M100 98 L130 98" stroke={sensorColor(h2s?.status || 'normal')} strokeWidth="2.5" strokeDasharray="8 4" style={pipelineStyle} fill="none" />
      <path d="M80 200 L80 220 L127 220" stroke={sensorColor(ch4?.status || 'normal')} strokeWidth="2.5" strokeDasharray="8 4" style={{ ...pipelineStyle, animationDelay: '0.5s' }} fill="none" />
      <path d="M157 115 L157 204" stroke="rgba(132,255,0,0.4)" strokeWidth="1.5" strokeDasharray="5 3" fill="none" />

      {/* Sensor readouts */}
      <g transform="translate(230, 85)">
        <rect x="0" y="0" width="100" height="50" rx="4" fill="rgba(8,12,8,0.9)" stroke="rgba(132,255,0,0.2)" />
        <text x="8" y="14" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(255,255,255,0.5)">H₂S MONITOR</text>
        <text x="8" y="28" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="700" fill={sensorColor(h2s?.status || 'normal')}>{h2s?.value ?? '--'} ppm</text>
        <text x="8" y="42" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(255,255,255,0.3)">THRESH: {h2s?.threshold} ppm</text>
      </g>
      <g transform="translate(230, 145)">
        <rect x="0" y="0" width="100" height="50" rx="4" fill="rgba(8,12,8,0.9)" stroke="rgba(132,255,0,0.2)" />
        <text x="8" y="14" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(255,255,255,0.5)">CH₄ SENSOR</text>
        <text x="8" y="28" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="700" fill={sensorColor(ch4?.status || 'normal')}>{ch4?.value ?? '--'} %LEL</text>
        <text x="8" y="42" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(255,255,255,0.3)">THRESH: {ch4?.threshold} %LEL</text>
      </g>

      {/* Equipment labels */}
      <text x="80" y="215" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(255,255,255,0.4)">DISTILLATION COL.</text>
    </g>
  )
}

function Bay2Machinery({ sensors }: { sensors: any[] }) {
  const pres = sensors.find(s => s.type === 'Pressure')
  const temp = sensors.find(s => s.type === 'Temp')
  return (
    <g>
      {/* Shell and Tube HX */}
      <rect x="50" y="100" width="130" height="55" rx="6" fill="rgba(132,255,0,0.06)" stroke={sensorColor(pres?.status || 'normal')} strokeWidth="1.5" />
      <text x="115" y="118" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(132,255,0,0.8)">HEAT EXCHANGER  HX E-11</text>
      {/* Tubes */}
      {[130, 140, 150].map(y => (
        <line key={y} x1="55" y1={y} x2="175" y2={y} stroke="rgba(132,255,0,0.25)" strokeWidth="1" />
      ))}
      <line x1="55" y1="120" x2="55" y2="155" stroke="rgba(132,255,0,0.4)" strokeWidth="1.5" />
      <line x1="175" y1="120" x2="175" y2="155" stroke="rgba(132,255,0,0.4)" strokeWidth="1.5" />

      {/* Pump P-11 */}
      <circle cx="230" cy="165" r="25" fill="rgba(132,255,0,0.06)" stroke="rgba(132,255,0,0.5)" strokeWidth="1.5" />
      <circle cx="230" cy="165" r="14" fill="none" stroke="rgba(132,255,0,0.3)" strokeWidth="1" strokeDasharray="5 3" style={pipelineStyle} />
      <text x="230" y="169" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(132,255,0,0.8)">P-11</text>

      {/* Pressure gauge */}
      <circle cx="115" cy="85" r="14" fill="rgba(8,12,8,0.9)" stroke={sensorColor(pres?.status || 'normal')} strokeWidth="1.5" />
      <text x="115" y="89" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6" fill={sensorColor(pres?.status || 'normal')}>{pres?.value ?? '--'}</text>
      <text x="115" y="72" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6" fill="rgba(255,255,255,0.4)">bar</text>

      {/* Pipelines */}
      <path d="M175 128 L205 128 L205 165" stroke={sensorColor(pres?.status || 'normal')} strokeWidth="2.5" strokeDasharray="8 4" style={pipelineStyle} fill="none" />
      <path d="M50 128 L30 128 L30 190 L70 190" stroke="rgba(132,255,0,0.4)" strokeWidth="2" strokeDasharray="6 3" style={{ ...pipelineStyle, animationDelay: '1s' }} fill="none" />

      {/* Sensor cards */}
      <g transform="translate(270, 90)">
        <rect x="0" y="0" width="100" height="50" rx="4" fill="rgba(8,12,8,0.9)" stroke="rgba(132,255,0,0.2)" />
        <text x="8" y="14" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(255,255,255,0.5)">PRESSURE</text>
        <text x="8" y="28" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="700" fill={sensorColor(pres?.status || 'normal')}>{pres?.value ?? '--'} bar</text>
        <text x="8" y="42" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(255,255,255,0.3)">THRESH: {pres?.threshold} bar</text>
      </g>
      <g transform="translate(270, 150)">
        <rect x="0" y="0" width="100" height="50" rx="4" fill="rgba(8,12,8,0.9)" stroke="rgba(132,255,0,0.2)" />
        <text x="8" y="14" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(255,255,255,0.5)">TEMPERATURE</text>
        <text x="8" y="28" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="700" fill={sensorColor(temp?.status || 'normal')}>{temp?.value ?? '--'} °C</text>
        <text x="8" y="42" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(255,255,255,0.3)">THRESH: {temp?.threshold} °C</text>
      </g>
    </g>
  )
}

function Bay3Machinery({ sensors }: { sensors: any[] }) {
  const h2s = sensors.find(s => s.type === 'H₂S')
  const o2 = sensors.find(s => s.type === 'O₂')
  const isCritical = sensors.some(s => s.status === 'critical')
  const compColor = isCritical ? '#ff4444' : '#84ff00'

  return (
    <g>
      {/* Compressor C-14 */}
      <rect x="55" y="85" width="90" height="90" rx="8" fill={isCritical ? 'rgba(220,38,38,0.1)' : 'rgba(132,255,0,0.06)'} stroke={compColor} strokeWidth={isCritical ? 2.5 : 1.5} />
      <circle cx="100" cy="130" r="32" fill="none" stroke={compColor} strokeWidth="2" strokeDasharray="12 4" style={pipelineStyle} />
      <circle cx="100" cy="130" r="18" fill="rgba(132,255,0,0.08)" stroke={compColor} strokeWidth="1.5" />
      <text x="100" y="126" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="700" fill={compColor}>C-14</text>
      <text x="100" y="137" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6" fill="rgba(255,255,255,0.5)">COMPRESSOR</text>

      {/* Gas Detector GD-B3 */}
      <rect x="190" y="88" width="70" height="55" rx="4" fill="rgba(8,12,8,0.8)" stroke={sensorColor(h2s?.status || 'normal')} strokeWidth="1.5" />
      <circle cx="225" cy="103" r="8" fill={isCritical ? 'rgba(220,38,38,0.3)' : 'rgba(132,255,0,0.15)'} stroke={sensorColor(h2s?.status || 'normal')} strokeWidth="1" />
      <text x="225" y="107" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6" fill={sensorColor(h2s?.status || 'normal')}>◉</text>
      <text x="225" y="125" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6" fill="rgba(255,255,255,0.6)">GD-B3</text>
      <text x="225" y="136" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6" fill="rgba(255,255,255,0.4)">GAS DETECT</text>

      {/* Relief valve */}
      <line x1="100" y1="85" x2="100" y2="65" stroke="rgba(132,255,0,0.5)" strokeWidth="2" />
      <polygon points="90,65 110,65 105,55 95,55" fill="none" stroke="rgba(132,255,0,0.5)" strokeWidth="1.5" />
      <text x="115" y="60" fontFamily="'JetBrains Mono', monospace" fontSize="6" fill="rgba(255,255,255,0.4)">PRV</text>

      {/* Inlet/outlet pipelines */}
      <path d="M30 130 L55 130" stroke={compColor} strokeWidth="3" strokeDasharray="8 4" style={pipelineStyle} fill="none" />
      <path d="M145 130 L190 112" stroke={sensorColor(h2s?.status || 'normal')} strokeWidth="2.5" strokeDasharray="8 4" style={{ ...pipelineStyle, animationDelay: '0.7s' }} fill="none" />
      <path d="M260 112 L300 112" stroke="rgba(132,255,0,0.4)" strokeWidth="2" strokeDasharray="6 3" fill="none" />

      {/* Hot-work permit badge */}
      <g transform="translate(55, 195)">
        <rect x="0" y="0" width="110" height="22" rx="3" fill="rgba(251,191,36,0.12)" stroke="rgba(251,191,36,0.5)" strokeWidth="1" />
        <text x="8" y="14" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="#fbbf24">⚠ PTW-0441 HOT-WORK ACTIVE</text>
      </g>

      {/* Sensor cards */}
      <g transform="translate(280, 85)">
        <rect x="0" y="0" width="100" height="50" rx="4" fill="rgba(8,12,8,0.9)" stroke={sensorColor(h2s?.status || 'normal')} strokeWidth="1" />
        <text x="8" y="14" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(255,255,255,0.5)">H₂S LEVEL</text>
        <text x="8" y="28" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="700" fill={sensorColor(h2s?.status || 'normal')}>{h2s?.value ?? '--'} ppm</text>
        <text x="8" y="42" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(255,255,255,0.3)">THRESH: {h2s?.threshold} ppm</text>
      </g>
      <g transform="translate(280, 145)">
        <rect x="0" y="0" width="100" height="50" rx="4" fill="rgba(8,12,8,0.9)" stroke={sensorColor(o2?.status || 'normal')} strokeWidth="1" />
        <text x="8" y="14" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(255,255,255,0.5)">O₂ LEVEL</text>
        <text x="8" y="28" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="700" fill={sensorColor(o2?.status || 'normal')}>{o2?.value ?? '--'} %</text>
        <text x="8" y="42" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(255,255,255,0.3)">MIN: {o2?.threshold} %</text>
      </g>
    </g>
  )
}

function Bay4Machinery({ sensors }: { sensors: any[] }) {
  const ch4 = sensors.find(s => s.type === 'CH₄')
  const vib = sensors.find(s => s.type === 'Vibration')

  return (
    <g>
      {/* Storage sphere V-04 */}
      <circle cx="90" cy="145" r="50" fill="rgba(132,255,0,0.05)" stroke={sensorColor(ch4?.status || 'normal')} strokeWidth="1.5" />
      <text x="90" y="141" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(132,255,0,0.8)">V-04</text>
      <text x="90" y="152" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6" fill="rgba(255,255,255,0.4)">LPG SPHERE</text>

      {/* Storage sphere V-05 */}
      <circle cx="200" cy="145" r="38" fill="rgba(132,255,0,0.05)" stroke={sensorColor(vib?.status || 'normal')} strokeWidth="1.5" />
      <text x="200" y="141" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(132,255,0,0.8)">V-05</text>
      <text x="200" y="152" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6" fill="rgba(255,255,255,0.4)">RESERVE</text>

      {/* Interconnect manifold */}
      <path d="M90 195 L90 220 L200 220 L200 183" stroke="rgba(132,255,0,0.5)" strokeWidth="3" strokeDasharray="10 4" style={pipelineStyle} fill="none" />
      <text x="145" y="215" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6" fill="rgba(255,255,255,0.4)">MANIFOLD M-04</text>

      {/* Pressure relief stack */}
      <line x1="90" y1="95" x2="90" y2="60" stroke="rgba(132,255,0,0.5)" strokeWidth="2" />
      <line x1="200" y1="107" x2="200" y2="70" stroke="rgba(132,255,0,0.5)" strokeWidth="2" />
      <path d="M75 60 L105 60" stroke="rgba(132,255,0,0.5)" strokeWidth="2" />
      <path d="M185 70 L215 70" stroke="rgba(132,255,0,0.5)" strokeWidth="2" />
      <text x="90" y="55" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6" fill="rgba(255,255,255,0.3)">PRV-04</text>

      {/* Sensor cards */}
      <g transform="translate(265, 90)">
        <rect x="0" y="0" width="105" height="50" rx="4" fill="rgba(8,12,8,0.9)" stroke={sensorColor(ch4?.status || 'normal')} strokeWidth="1" />
        <text x="8" y="14" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(255,255,255,0.5)">CH₄ MONITOR</text>
        <text x="8" y="28" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="700" fill={sensorColor(ch4?.status || 'normal')}>{ch4?.value ?? '--'} %LEL</text>
        <text x="8" y="42" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(255,255,255,0.3)">THRESH: {ch4?.threshold} %LEL</text>
      </g>
      <g transform="translate(265, 150)">
        <rect x="0" y="0" width="105" height="50" rx="4" fill="rgba(8,12,8,0.9)" stroke={sensorColor(vib?.status || 'normal')} strokeWidth="1" />
        <text x="8" y="14" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(255,255,255,0.5)">VIBRATION</text>
        <text x="8" y="28" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="700" fill={sensorColor(vib?.status || 'normal')}>{vib?.value ?? '--'} mm/s</text>
        <text x="8" y="42" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(255,255,255,0.3)">THRESH: {vib?.threshold} mm/s</text>
      </g>
    </g>
  )
}

function Bay5Machinery({ sensors }: { sensors: any[] }) {
  const temp = sensors.find(s => s.type === 'Temp')
  const flow = sensors.find(s => s.type === 'Flow')

  return (
    <g>
      {/* Manifold rack M-01 */}
      <rect x="45" y="95" width="20" height="100" rx="3" fill="rgba(132,255,0,0.08)" stroke="rgba(132,255,0,0.5)" strokeWidth="1.5" />
      <text x="55" y="90" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6" fill="rgba(132,255,0,0.7)">M-01</text>
      {[110, 130, 150, 170].map(y => (
        <line key={y} x1="65" y1={y} x2="100" y2={y} stroke="rgba(132,255,0,0.4)" strokeWidth="1.5" />
      ))}

      {/* Flow meters FT-501 / FT-502 */}
      <rect x="100" y="105" width="55" height="35" rx="4" fill="rgba(132,255,0,0.06)" stroke={sensorColor(flow?.status || 'normal')} strokeWidth="1.5" />
      <text x="127" y="121" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(132,255,0,0.8)">FT-501</text>
      <text x="127" y="133" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fontWeight="700" fill={sensorColor(flow?.status || 'normal')}>{flow?.value ?? '--'} L/m</text>

      <rect x="100" y="155" width="55" height="35" rx="4" fill="rgba(132,255,0,0.06)" stroke="rgba(132,255,0,0.4)" strokeWidth="1" />
      <text x="127" y="171" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(132,255,0,0.7)">FT-502</text>
      <text x="127" y="183" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(255,255,255,0.4)">STANDBY</text>

      {/* Loading arm LA-01 */}
      <path d="M200 122 L260 122 L280 140 L280 180" stroke={sensorColor(flow?.status || 'normal')} strokeWidth="3" strokeDasharray="10 4" style={pipelineStyle} fill="none" />
      <circle cx="280" cy="190" r="12" fill="rgba(132,255,0,0.08)" stroke="rgba(132,255,0,0.6)" strokeWidth="1.5" />
      <text x="280" y="194" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6" fill="rgba(132,255,0,0.8)">LA-01</text>

      {/* Loading arm LA-02 */}
      <path d="M200 172 L240 172 L260 185 L260 210" stroke="rgba(132,255,0,0.4)" strokeWidth="2" strokeDasharray="8 4" style={{ ...pipelineStyle, animationDelay: '1.2s' }} fill="none" />
      <circle cx="260" cy="218" r="10" fill="rgba(132,255,0,0.06)" stroke="rgba(132,255,0,0.4)" strokeWidth="1" />
      <text x="260" y="222" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6" fill="rgba(132,255,0,0.6)">LA-02</text>

      {/* Temp sensor inline */}
      <rect x="155" y="105" width="45" height="35" rx="4" fill="rgba(8,12,8,0.8)" stroke={sensorColor(temp?.status || 'normal')} strokeWidth="1" />
      <text x="177" y="118" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6" fill="rgba(255,255,255,0.5)">TE-501</text>
      <text x="177" y="132" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="700" fill={sensorColor(temp?.status || 'normal')}>{temp?.value ?? '--'}°C</text>

      {/* Sensor cards */}
      <g transform="translate(310, 90)">
        <rect x="0" y="0" width="100" height="50" rx="4" fill="rgba(8,12,8,0.9)" stroke={sensorColor(flow?.status || 'normal')} strokeWidth="1" />
        <text x="8" y="14" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(255,255,255,0.5)">FLOW RATE</text>
        <text x="8" y="28" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="700" fill={sensorColor(flow?.status || 'normal')}>{flow?.value ?? '--'} L/m</text>
        <text x="8" y="42" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(255,255,255,0.3)">MAX: {flow?.threshold} L/m</text>
      </g>
      <g transform="translate(310, 150)">
        <rect x="0" y="0" width="100" height="50" rx="4" fill="rgba(8,12,8,0.9)" stroke={sensorColor(temp?.status || 'normal')} strokeWidth="1" />
        <text x="8" y="14" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(255,255,255,0.5)">TEMPERATURE</text>
        <text x="8" y="28" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="700" fill={sensorColor(temp?.status || 'normal')}>{temp?.value ?? '--'} °C</text>
        <text x="8" y="42" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="rgba(255,255,255,0.3)">MAX: {temp?.threshold} °C</text>
      </g>
    </g>
  )
}

// ─── Zoomed Bay Overlay ───────────────────────────────────────────────────── //

function ZoomedBayView({ zone, sensors, onBack }: { zone: string; sensors: any[]; onBack: () => void }) {
  const hasCritical = sensors.some(s => s.status === 'critical')

  const machineryMap: Record<string, JSX.Element> = {
    'Bay 1': <Bay1Machinery sensors={sensors} />,
    'Bay 2': <Bay2Machinery sensors={sensors} />,
    'Bay 3': <Bay3Machinery sensors={sensors} />,
    'Bay 4': <Bay4Machinery sensors={sensors} />,
    'Bay 5': <Bay5Machinery sensors={sensors} />,
  }

  const bayLabels: Record<string, string> = {
    'Bay 1': 'BAY 1 · DISTILLATION UNIT',
    'Bay 2': 'BAY 2 · HEAT EXCHANGER LOOP',
    'Bay 3': 'BAY 3 · COMPRESSOR C-14 ZONE',
    'Bay 4': 'BAY 4 · VAPOR STORAGE SPHERES',
    'Bay 5': 'BAY 5 · LOADING DOCK MANIFOLD',
  }

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: '#060906',
      display: 'flex',
      flexDirection: 'column',
      animation: 'fade-up 0.5s ease both',
    }}>
      {/* Bay header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: `1px solid ${hasCritical ? 'rgba(255,68,68,0.3)' : 'rgba(132,255,0,0.12)'}`,
        background: hasCritical ? 'rgba(220,38,38,0.06)' : 'rgba(132,255,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: hasCritical ? '#ff4444' : '#84ff00',
            boxShadow: `0 0 8px ${hasCritical ? '#ff4444' : '#84ff00'}`,
            animation: 'pulse-ring 1.5s ease-in-out infinite',
          }} />
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.65rem',
            fontWeight: 700,
            color: hasCritical ? '#ff4444' : '#84ff00',
            letterSpacing: '0.12em',
          }}>
            {bayLabels[zone] || zone}
          </span>
          {hasCritical && (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.5rem',
              color: '#ff4444',
              background: 'rgba(220,38,38,0.15)',
              border: '1px solid rgba(220,38,38,0.4)',
              padding: '2px 8px',
              borderRadius: 3,
              letterSpacing: '0.1em',
            }}>
              ⚠ CRITICAL ALERT
            </span>
          )}
        </div>
        <button
          onClick={onBack}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.55rem',
            letterSpacing: '0.1em',
            color: 'rgba(132,255,0,0.7)',
            background: 'rgba(132,255,0,0.08)',
            border: '1px solid rgba(132,255,0,0.25)',
            padding: '5px 14px',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          ← PLANT OVERVIEW
        </button>
      </div>

      {/* SVG Machinery canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 440 280"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <style>{`
              @keyframes flow-pipe {
                from { stroke-dashoffset: 0; }
                to   { stroke-dashoffset: -24; }
              }
            `}</style>
            <filter id="glow-z">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background grid */}
          <rect width="100%" height="100%" fill="#060906" />
          {Array.from({ length: 22 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="280"
              stroke="rgba(132,255,0,0.03)" strokeWidth="1" />
          ))}
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 20} x2="440" y2={i * 20}
              stroke="rgba(132,255,0,0.03)" strokeWidth="1" />
          ))}

          {machineryMap[zone] || null}
        </svg>
      </div>
    </div>
  )
}

// ─── Main PlantTwin ───────────────────────────────────────────────────────── //

export default function PlantTwin() {
  const isSim = useSimulationStore(s => s.isRunning)
  const simStore = useSimulationStore()
  const demoStore = useDemoStore()
  const store = isSim ? simStore : demoStore as any

  const { focusedZone, resetView, sensors, compoundRiskScore } = store

  const zones = [
    { id: 'Bay 1', label: 'BAY 1 · DISTILLATION', x: 40, y: 40, w: 260, h: 160 },
    { id: 'Bay 2', label: 'BAY 2 · HEAT EXCHANGER', x: 340, y: 40, w: 260, h: 160 },
    { id: 'Bay 3', label: 'BAY 3 · COMPRESSOR C-14', x: 640, y: 40, w: 280, h: 160 },
    { id: 'Bay 4', label: 'BAY 4 · VAPOR STORAGE', x: 40, y: 240, w: 260, h: 160 },
    { id: 'Bay 5', label: 'BAY 5 · LOADING DOCK', x: 340, y: 240, w: 580, h: 160 },
  ]

  // If a bay is focused, show the detailed zoomed view
  if (focusedZone) {
    const zoneSensors = sensors.filter((s: any) => s.zone === focusedZone)
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
        <ZoomedBayView
          zone={focusedZone}
          sensors={zoneSensors}
          onBack={resetView}
        />
        {/* Risk score still visible in corner */}
        <div style={{
          position: 'absolute', bottom: 16, right: 16,
          background: 'rgba(8,12,8,0.9)',
          border: '1px solid rgba(132,255,0,0.2)',
          borderRadius: 6, padding: '8px 14px',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.5rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>COMPOUND RISK</div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '1.6rem', lineHeight: 1,
            color: compoundRiskScore > 0.7 ? '#ff4444' : compoundRiskScore > 0.4 ? '#fbbf24' : '#84ff00',
          }}>
            {compoundRiskScore.toFixed(2)}
          </div>
        </div>
      </div>
    )
  }

  // Overview: all 5 bays on one SVG canvas
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#060906' }}>
      <svg width="100%" height="100%" viewBox="0 0 960 440" style={{ width: '100%', height: '100%' }}>
        <defs>
          <style>{`
            @keyframes flow-pipe {
              from { stroke-dashoffset: 0; }
              to   { stroke-dashoffset: -24; }
            }
          `}</style>
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background grid */}
        <rect width="100%" height="100%" fill="#060906" />
        {Array.from({ length: 48 }).map((_, i) => (
          <line key={`gv${i}`} x1={i * 20} y1="0" x2={i * 20} y2="440" stroke="rgba(132,255,0,0.025)" strokeWidth="1" />
        ))}
        {Array.from({ length: 22 }).map((_, i) => (
          <line key={`gh${i}`} x1="0" y1={i * 20} x2="960" y2={i * 20} stroke="rgba(132,255,0,0.025)" strokeWidth="1" />
        ))}

        {/* Inter-bay pipelines (overview) */}
        <path d="M300 120 L340 120" stroke="rgba(132,255,0,0.25)" strokeWidth="2" strokeDasharray="6 3" style={pipelineStyle} fill="none" />
        <path d="M600 120 L640 120" stroke="rgba(132,255,0,0.25)" strokeWidth="2" strokeDasharray="6 3" style={{ ...pipelineStyle, animationDelay: '0.4s' }} fill="none" />
        <path d="M170 200 L170 240" stroke="rgba(132,255,0,0.2)" strokeWidth="2" strokeDasharray="4 4" fill="none" />
        <path d="M470 200 L470 240" stroke="rgba(132,255,0,0.2)" strokeWidth="2" strokeDasharray="4 4" fill="none" />
        <path d="M780 200 L780 240" stroke="rgba(132,255,0,0.2)" strokeWidth="2" strokeDasharray="4 4" fill="none" />

        {zones.map((zone) => {
          const isFocused = focusedZone === zone.id
          const zoneSensors = sensors.filter((s: any) => s.zone === zone.id)
          const hasCritical = zoneSensors.some((s: any) => s.status === 'critical')
          const hasWarning = zoneSensors.some((s: any) => s.status === 'warning')

          return (
            <g key={zone.id} style={{ cursor: 'pointer' }} onClick={() => store.focusZone(zone.id)}>
              <rect
                x={zone.x} y={zone.y} width={zone.w} height={zone.h} rx="8"
                fill={hasCritical ? 'rgba(220,38,38,0.1)' : hasWarning ? 'rgba(251,191,36,0.06)' : isFocused ? 'rgba(132,255,0,0.06)' : 'rgba(255,255,255,0.02)'}
                stroke={hasCritical ? '#ff4444' : hasWarning ? '#fbbf24' : isFocused ? '#84ff00' : 'rgba(255,255,255,0.1)'}
                strokeWidth={hasCritical || isFocused ? 2.5 : 1}
                filter={hasCritical || isFocused ? 'url(#neon-glow)' : undefined}
                style={{ transition: 'all 0.4s ease' }}
              />

              {/* Header bar */}
              <rect x={zone.x} y={zone.y} width={zone.w} height="26" rx="8"
                fill={hasCritical ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.04)'} />
              <text x={zone.x + 12} y={zone.y + 17}
                fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="700"
                fill={hasCritical ? '#ff4444' : hasWarning ? '#fbbf24' : 'rgba(255,255,255,0.7)'}
                letterSpacing="0.1em">
                {zone.label}
              </text>

              {/* Click to zoom hint */}
              <text x={zone.x + zone.w - 10} y={zone.y + 17}
                textAnchor="end"
                fontFamily="'JetBrains Mono', monospace" fontSize="7"
                fill="rgba(132,255,0,0.3)">
                CLICK / SAY ZOOM
              </text>

              {/* Bay 3 compressor icon on overview */}
              {zone.id === 'Bay 3' && (
                <g transform={`translate(${zone.x + 30}, ${zone.y + 45})`}>
                  <rect x="0" y="0" width="70" height="70" rx="6"
                    fill="rgba(255,255,255,0.04)" stroke={hasCritical ? '#ff4444' : 'rgba(132,255,0,0.3)'} strokeWidth="1" />
                  <circle cx="35" cy="35" r="22" fill="none"
                    stroke={hasCritical ? '#ff4444' : '#84ff00'} strokeWidth="1.5"
                    strokeDasharray="6 3" style={pipelineStyle} />
                  <text x="35" y="38" textAnchor="middle"
                    fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="700"
                    fill={hasCritical ? '#ff4444' : '#84ff00'}>C-14</text>
                </g>
              )}

              {/* Bay 4 sphere icon on overview */}
              {zone.id === 'Bay 4' && (
                <g transform={`translate(${zone.x + 20}, ${zone.y + 45})`}>
                  <circle cx="30" cy="40" r="28" fill="rgba(132,255,0,0.04)"
                    stroke="rgba(132,255,0,0.35)" strokeWidth="1" />
                  <text x="30" y="44" textAnchor="middle"
                    fontFamily="'JetBrains Mono', monospace" fontSize="7"
                    fill="rgba(132,255,0,0.6)">V-04</text>
                </g>
              )}

              {/* Sensor readings in overview */}
              <g transform={`translate(${zone.id === 'Bay 3' ? zone.x + 120 : zone.x + 20}, ${zone.y + 42})`}>
                {zoneSensors.map((sen: any, idx: number) => (
                  <g key={sen.id} transform={`translate(0, ${idx * 26})`}>
                    <text fontFamily="'JetBrains Mono', monospace" fontSize="9" fill="rgba(255,255,255,0.45)">
                      {sen.type}:
                    </text>
                    <text x="70" fontFamily="'JetBrains Mono', monospace" fontSize="10" fontWeight="700"
                      fill={sensorColor(sen.status)}>
                      {sen.value} {sen.unit}
                    </text>
                  </g>
                ))}
              </g>
            </g>
          )
        })}
      </svg>

      {/* Risk index footer */}
      <div style={{
        position: 'absolute', bottom: 20, left: 20,
        background: 'rgba(8,12,8,0.92)',
        border: '1px solid rgba(132,255,0,0.2)',
        borderRadius: 8, padding: '10px 20px',
        display: 'flex', alignItems: 'center', gap: 16,
        backdropFilter: 'blur(12px)',
      }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.5rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
            COMPOUND RISK INDEX
          </div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem', lineHeight: 1,
            color: compoundRiskScore > 0.7 ? '#ff4444' : compoundRiskScore > 0.4 ? '#fbbf24' : '#84ff00',
          }}>
            {compoundRiskScore.toFixed(2)}
          </div>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.8 }}>
          <div>🎙 SAY "ZOOM INTO BAY 3"</div>
          <div>🎙 SAY "SHOW PLANT OVERVIEW"</div>
          <div>🎙 SAY "WHAT IS THE RISK STATUS"</div>
        </div>
      </div>
    </div>
  )
}
