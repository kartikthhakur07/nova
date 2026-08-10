/**
 * frontend/src/pages/SensorTelemetry.tsx
 * Live sensor telemetry dashboard — 6-panel sparkline grid with
 * threshold alerts, sensor health matrix, and rolling waveforms.
 */
import React, { useState, useEffect, useRef } from 'react'
import { getFactoryState } from '../services/api'
import { Activity, AlertTriangle, CheckCircle, WifiOff, Download, Filter } from 'lucide-react'

const BG = '#F8F9FB', CARD = '#FFFFFF', BD = '#E4E8EF', TXT = '#0F1729', SUB = '#5A6578'
const GREEN = '#16A34A', AMBER = '#D97706', RED = '#DC2626', BLUE = '#2563EB', PURPLE = '#7C3AED', TEAL = '#0D9488'
const FD = "'Plus Jakarta Sans',sans-serif", FM = "'JetBrains Mono',monospace"

interface Sensor {
  sensor_id: string; value: number | null; unit: string; status: 'active'|'dead'|'degraded'; type: string
  threshold_warn?: number; threshold_crit?: number; zone?: string
}

const DEMO_SENSORS: Sensor[] = [
  { sensor_id:'GD-B3-01', value:147,  unit:'ppm', status:'active',   type:'gas',         threshold_warn:100, threshold_crit:200, zone:'Bay3' },
  { sensor_id:'GD-B3-02', value:89,   unit:'ppm', status:'active',   type:'gas',         threshold_warn:100, threshold_crit:200, zone:'Bay3' },
  { sensor_id:'T-07',     value:342,  unit:'°C',  status:'active',   type:'temperature', threshold_warn:350, threshold_crit:400, zone:'Bay1' },
  { sensor_id:'C-14',     value:94,   unit:'%',   status:'degraded', type:'compressor',  threshold_warn:90,  threshold_crit:98,  zone:'Bay3' },
  { sensor_id:'R-22',     value:null, unit:'bar', status:'dead',     type:'pressure',    threshold_warn:8,   threshold_crit:12,  zone:'Bay4' },
  { sensor_id:'P-08',     value:2.1,  unit:'bar', status:'active',   type:'pressure',    threshold_warn:3,   threshold_crit:5,   zone:'Bay3' },
]

const COLORS = [BLUE, GREEN, AMBER, PURPLE, RED, TEAL]

function Sparkline({ history, color, threshold, critThreshold, width=200, height=60 }: {
  history: number[]; color: string; threshold?: number; critThreshold?: number; width?: number; height?: number
}) {
  if (history.length < 2) return <div style={{width,height,background:'rgba(0,0,0,0.02)',borderRadius:6}}/>
  const min = Math.min(...history) * 0.9
  const max = Math.max(...history) * 1.1 || 1
  const pts = history.map((v,i) => {
    const x = (i / (history.length-1)) * width
    const y = height - ((v - min) / (max - min)) * height
    return x + ',' + y
  }).join(' ')
  const thY = threshold != null ? height - ((threshold - min) / (max - min)) * height : null
  const ctY = critThreshold != null ? height - ((critThreshold - min) / (max - min)) * height : null
  return (
    <svg width={width} height={height} style={{display:'block'}}>
      <defs>
        <linearGradient id={'grad-' + color.replace('#','')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3}/>
          <stop offset="100%" stopColor={color} stopOpacity={0}/>
        </linearGradient>
      </defs>
      {thY != null && <line x1={0} y1={thY} x2={width} y2={thY} stroke={AMBER} strokeWidth={1} strokeDasharray="3,3" opacity={0.6}/>}
      {ctY != null && <line x1={0} y1={ctY} x2={width} y2={ctY} stroke={RED} strokeWidth={1} strokeDasharray="3,3" opacity={0.6}/>}
      <polyline points={pts + ' ' + width + ',' + height + ' 0,' + height} fill={'url(#grad-' + color.replace('#','') + ')'} stroke="none"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"/>
      {history.length > 0 && (() => {
        const last = history[history.length-1]
        const lx = width, ly = height - ((last - min)/(max-min))*height
        return <circle cx={lx} cy={Math.max(4,Math.min(height-4,ly))} r={3} fill={color} stroke="#fff" strokeWidth={1.5}/>
      })()}
    </svg>
  )
}

function SensorCard({ sensor, history, color }: { sensor: Sensor; history: number[]; color: string }) {
  const isDead = sensor.status === 'dead'
  const isDeg = sensor.status === 'degraded'
  const isWarn = sensor.value != null && sensor.threshold_warn != null && sensor.value > sensor.threshold_warn
  const isCrit = sensor.value != null && sensor.threshold_crit != null && sensor.value > sensor.threshold_crit
  const borderColor = isCrit ? RED : isWarn ? AMBER : isDead ? '#9CA3B4' : BD
  const badgeColor = isCrit ? RED : isWarn ? AMBER : isDead ? '#9CA3B4' : isDeg ? AMBER : GREEN
  const badge = isCrit ? 'CRITICAL' : isWarn ? 'WARNING' : isDead ? 'DEAD' : isDeg ? 'DEGRADED' : 'NORMAL'
  return (
    <div style={{ background: CARD, border: '1px solid ' + borderColor, borderRadius: 12, padding: 16, boxShadow: isCrit ? '0 0 0 3px rgba(220,38,38,0.15)' : '0 1px 3px rgba(0,0,0,0.04)', transition: 'box-shadow 0.3s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: TXT, fontFamily: FM }}>{sensor.sensor_id}</div>
          <div style={{ fontSize: 11, color: SUB, marginTop: 2, textTransform: 'capitalize' }}>{sensor.type} · {sensor.zone ?? '—'}</div>
        </div>
        <div style={{ padding: '3px 8px', borderRadius: 20, background: badgeColor + '15', border: '1px solid ' + badgeColor + '40' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: badgeColor, fontFamily: FM, letterSpacing: '0.06em' }}>{badge}</span>
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: isCrit ? RED : isWarn ? AMBER : isDead ? '#9CA3B4' : TXT, fontFamily: FD, lineHeight: 1 }}>
          {sensor.value !== null ? sensor.value : '—'}
        </span>
        <span style={{ fontSize: 13, color: SUB, marginLeft: 4 }}>{sensor.unit}</span>
      </div>
      <Sparkline history={history} color={isDead ? '#9CA3B4' : color} threshold={sensor.threshold_warn} critThreshold={sensor.threshold_crit} width={220} height={52}/>
      {(sensor.threshold_warn || sensor.threshold_crit) && (
        <div style={{ marginTop: 8, display: 'flex', gap: 10 }}>
          {sensor.threshold_warn && <span style={{ fontSize: 10, color: AMBER }}>⚠ {sensor.threshold_warn}{sensor.unit}</span>}
          {sensor.threshold_crit && <span style={{ fontSize: 10, color: RED }}>🚨 {sensor.threshold_crit}{sensor.unit}</span>}
        </div>
      )}
    </div>
  )
}

export default function SensorTelemetry() {
  const [sensors, setSensors] = useState<Sensor[]>(DEMO_SENSORS)
  const [histories, setHistories] = useState<Record<string,number[]>>({})
  const [zoneFilter, setZoneFilter] = useState('all')
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const tickRef = useRef(0)

  useEffect(() => {
    const updateHistories = (sensorList: Sensor[]) => {
      tickRef.current++
      setHistories(prev => {
        const next = { ...prev }
        sensorList.forEach(s => {
          if (s.value === null) return
          const hist = next[s.sensor_id] ?? []
          // Add slight random walk for demo realism
          const noise = (Math.random() - 0.5) * (s.value ?? 0) * 0.03
          const newVal = Math.max(0, s.value + noise)
          next[s.sensor_id] = [...hist.slice(-59), Math.round(newVal * 10) / 10]
        })
        return next
      })
    }

    const load = async () => {
      try {
        const state = await getFactoryState()
        const liveSensors = (state.sensors ?? []) as Sensor[]
        if (liveSensors.length > 0) { setSensors(liveSensors); updateHistories(liveSensors) }
        else { setSensors(DEMO_SENSORS); updateHistories(DEMO_SENSORS) }
      } catch { setSensors(DEMO_SENSORS); updateHistories(DEMO_SENSORS) }
      setLastUpdate(Date.now())
    }
    load(); const id = setInterval(load, 500); return () => clearInterval(id)
  }, [])

  const zones = ['all', ...Array.from(new Set(sensors.map(s => s.zone ?? 'Unknown')))]
  const filtered = zoneFilter === 'all' ? sensors : sensors.filter(s => s.zone === zoneFilter)

  const active = sensors.filter(s => s.status === 'active').length
  const dead = sensors.filter(s => s.status === 'dead').length
  const deg = sensors.filter(s => s.status === 'degraded').length
  const alerts = sensors.filter(s => s.value != null && s.threshold_warn != null && s.value > s.threshold_warn).length

  const exportJSON = () => {
    const data = { ts: new Date().toISOString(), sensors, histories }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sensor_snapshot.json'; a.click()
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: FD }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', background: CARD, borderBottom: '1px solid ' + BD, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
          <Activity size={18} color="#fff"/>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: TXT, fontFamily: FD }}>Live Sensor Telemetry</div>
          <div style={{ fontSize: 12, color: SUB }}>500ms refresh · {sensors.length} instruments · Updated {Math.round((Date.now()-lastUpdate)/1000)}s ago</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Zone filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F1F5F9', borderRadius: 8, padding: '4px 8px' }}>
            <Filter size={13} color={SUB}/>
            <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} style={{ background: 'none', border: 'none', outline: 'none', fontSize: 12, color: TXT, cursor: 'pointer', fontFamily: FD }}>
              {zones.map(z => <option key={z} value={z}>{z === 'all' ? 'All Zones' : z}</option>)}
            </select>
          </div>
          <button onClick={exportJSON} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'none', border: '1px solid ' + BD, cursor: 'pointer', fontSize: 12, color: SUB, fontFamily: FD }}>
            <Download size={13}/> Export
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ padding: '12px 24px', background: CARD, borderBottom: '1px solid ' + BD, display: 'flex', gap: 24 }}>
        {[
          { label: 'Active', value: active, color: GREEN, icon: CheckCircle },
          { label: 'Degraded', value: deg, color: AMBER, icon: AlertTriangle },
          { label: 'Dead', value: dead, color: '#9CA3B4', icon: WifiOff },
          { label: 'Threshold Alerts', value: alerts, color: RED, icon: AlertTriangle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon size={14} color={color}/>
            <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
            <span style={{ fontSize: 12, color: SUB }}>{label}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, animation: 'pulse 2s infinite' }}/>
          <span style={{ fontSize: 11, color: GREEN, fontWeight: 600 }}>LIVE — 500ms</span>
        </div>
      </div>

      {/* Sensor grid */}
      <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
        {filtered.map((s, i) => (
          <SensorCard key={s.sensor_id} sensor={s} history={histories[s.sensor_id] ?? []} color={COLORS[i % COLORS.length]}/>
        ))}
      </div>

      {/* Health matrix */}
      <div style={{ margin: '0 24px 24px', background: CARD, borderRadius: 12, border: '1px solid ' + BD, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: TXT, marginBottom: 14 }}>Sensor Health Matrix</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {sensors.map(s => {
            const col = s.status === 'active' ? GREEN : s.status === 'degraded' ? AMBER : '#9CA3B4'
            const isW = s.value != null && s.threshold_warn != null && s.value > s.threshold_warn
            return (
              <div key={s.sensor_id} style={{ padding: '6px 12px', borderRadius: 8, background: col + '12', border: '1px solid ' + col + '30', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: col, boxShadow: '0 0 6px ' + col }}/>
                <span style={{ fontSize: 11, fontFamily: FM, color: TXT, fontWeight: 600 }}>{s.sensor_id}</span>
                {isW && <AlertTriangle size={10} color={RED}/>}
              </div>
            )
          })}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
    </div>
  )
}
