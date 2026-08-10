/**
 * frontend/src/components/FactoryHeatmap.tsx
 * 
 * Interactive SVG factory floor heatmap with:
 * - 5 zones color-coded by risk tier (animated pulse on alert)
 * - Sensor nodes with dead-sensor detection (grayed out + ⚠)
 * - Personnel count overlaid on each zone
 * - Tooltip on hover showing zone details
 */
import React, { useState, useEffect } from 'react'
import { getFactoryState, getProductionKPIs } from '../services/api'
import { useCaseStore } from '../store/useCaseStore'

const TIER_COLORS: Record<string, { fill: string; stroke: string; glow: string }> = {
  low:      { fill: '#F0FDF4', stroke: '#16A34A', glow: 'rgba(22,163,74,0)' },
  medium:   { fill: '#FFFBEB', stroke: '#D97706', glow: 'rgba(217,119,6,0.15)' },
  high:     { fill: '#FFF7ED', stroke: '#EA580C', glow: 'rgba(234,88,12,0.2)' },
  critical: { fill: '#FEF2F2', stroke: '#DC2626', glow: 'rgba(220,38,38,0.3)' },
}

const ZONE_LAYOUT = [
  { zone_id: 'Bay1', label: 'Bay 1', sublabel: 'Feedstock Storage', x: 30,  y: 40,  w: 130, h: 110 },
  { zone_id: 'Bay2', label: 'Bay 2', sublabel: 'Pre-Treatment',     x: 175, y: 40,  w: 130, h: 110 },
  { zone_id: 'Bay3', label: 'Bay 3', sublabel: 'Refining Unit',     x: 320, y: 40,  w: 130, h: 110 },
  { zone_id: 'Bay4', label: 'Bay 4', sublabel: 'Reactor Block',     x: 465, y: 40,  w: 130, h: 110 },
  { zone_id: 'Bay5', label: 'Bay 5', sublabel: 'Product Finishing', x: 30,  y: 165, w: 565, h: 70  },
]

const SENSOR_POSITIONS: Array<{ id: string; zone: string; cx: number; cy: number; type: string }> = [
  { id: 'GD-B3-01', zone: 'Bay3', cx: 360, cy: 80, type: 'gas' },
  { id: 'GD-B3-02', zone: 'Bay3', cx: 420, cy: 80, type: 'gas' },
  { id: 'T-07',     zone: 'Bay1', cx: 80,  cy: 80, type: 'tank' },
  { id: 'C-14',     zone: 'Bay3', cx: 385, cy: 115, type: 'compressor' },
  { id: 'R-22',     zone: 'Bay4', cx: 510, cy: 80, type: 'reactor' },
  { id: 'P-08',     zone: 'Bay3', cx: 350, cy: 130, type: 'pump' },
]

interface ZoneState {
  zone_id: string
  risk_tier: string
  equipment_count: number
  last_event: Record<string, unknown> | null
}

interface SensorState {
  sensor_id: string
  status: 'active' | 'dead' | 'degraded'
  value: number | null
  unit: string
}

interface PersonnelState {
  [zone_id: string]: number
}

export default function FactoryHeatmap({ onZoneClick }: { onZoneClick?: (zoneId: string) => void }) {
  const [zones, setZones] = useState<ZoneState[]>([])
  const [sensors, setSensors] = useState<SensorState[]>([])
  const [personnel, setPersonnel] = useState<PersonnelState>({})
  const [hoveredZone, setHoveredZone] = useState<string | null>(null)
  const [pulsePhase, setPulsePhase] = useState(0)

  useEffect(() => {
    const fetchState = async () => {
      try {
        const [state, kpis] = await Promise.all([getFactoryState(), getProductionKPIs()])
        setZones(state.zones)
        setSensors(state.sensors as SensorState[])
        setPersonnel(kpis.personnel_by_zone)
      } catch { /* backend offline */ }
    }
    fetchState()
    const id = setInterval(fetchState, 2000)
    return () => clearInterval(id)
  }, [])

  // Pulse animation for alert zones
  useEffect(() => {
    const id = setInterval(() => setPulsePhase(p => (p + 1) % 60), 50)
    return () => clearInterval(id)
  }, [])

  const getZoneData = (zoneId: string) =>
    zones.find(z => z.zone_id === zoneId) ?? { zone_id: zoneId, risk_tier: 'low', equipment_count: 0, last_event: null }

  const getSensorData = (sensorId: string) =>
    sensors.find(s => s.sensor_id === sensorId)

  const focusedZone = useCaseStore(s => s.uiState.focusedZone)
  
  // Calculate dynamic transform to zoom into focusedZone
  let transform = "translate(0px, 0px) scale(1)"
  if (focusedZone) {
    const layout = ZONE_LAYOUT.find(z => z.zone_id === focusedZone)
    if (layout) {
      const scale = Math.min(625 / (layout.w + 60), 250 / (layout.h + 60))
      const cx = layout.x + layout.w / 2
      const cy = layout.y + layout.h / 2
      const tx = 625 / 2 - cx * scale
      const ty = 250 / 2 - cy * scale
      transform = `translate(${tx}px, ${ty}px) scale(${scale})`
    }
  }

  return (
    <div style={{ width: '100%', background: '#FAFBFF', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
      {/* Legend */}
      <div style={{ padding: '10px 16px', display: 'flex', gap: 16, alignItems: 'center', borderBottom: '1px solid #E4E8EF' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3B4', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Risk Tier</span>
        {[
          ['low', '#16A34A', 'Normal'],
          ['medium', '#D97706', 'Elevated'],
          ['high', '#EA580C', 'High'],
          ['critical', '#DC2626', 'Critical'],
        ].map(([, color, label]) => (
          <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: color as string }} />
            <span style={{ fontSize: 11, color: '#5A6578' }}>{label as string}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#9CA3B4' }} />
          <span style={{ fontSize: 11, color: '#9CA3B4' }}>Dead sensor</span>
        </div>
      </div>

      <svg viewBox="0 0 625 250" style={{ width: '100%', height: 'auto', display: 'block' }}>
        <g style={{ transform, transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)', transformOrigin: '0 0' }}>
        {/* Zone backgrounds */}
        {ZONE_LAYOUT.map(zone => {
          const data = getZoneData(zone.zone_id)
          const tierColor = TIER_COLORS[data.risk_tier] ?? TIER_COLORS.low
          const isAlert = data.risk_tier === 'high' || data.risk_tier === 'critical'
          const pulseFactor = isAlert ? 0.85 + 0.15 * Math.sin((pulsePhase / 60) * 2 * Math.PI) : 1
          const isHovered = hoveredZone === zone.zone_id
          const p = personnel[zone.zone_id] ?? 0

          return (
            <g key={zone.zone_id}>
              {/* Glow effect for alerts */}
              {isAlert && (
                <rect
                  x={zone.x - 4} y={zone.y - 4}
                  width={zone.w + 8} height={zone.h + 8}
                  rx={14} fill={tierColor.glow}
                  opacity={pulseFactor * 0.8}
                />
              )}
              {/* Zone rect */}
              <rect
                x={zone.x} y={zone.y}
                width={zone.w} height={zone.h}
                rx={10}
                fill={tierColor.fill}
                stroke={tierColor.stroke}
                strokeWidth={isHovered ? 2.5 : isAlert ? 2 : 1.5}
                opacity={pulseFactor}
                style={{ cursor: 'pointer', transition: 'stroke-width 0.2s' }}
                onClick={() => onZoneClick?.(zone.zone_id)}
                onMouseEnter={() => setHoveredZone(zone.zone_id)}
                onMouseLeave={() => setHoveredZone(null)}
              />
              {/* Zone label */}
              <text x={zone.x + 10} y={zone.y + 20}
                fontSize={12} fontWeight={700} fill={tierColor.stroke}
                fontFamily="'Plus Jakarta Sans', sans-serif">
                {zone.label}
              </text>
              <text x={zone.x + 10} y={zone.y + 36}
                fontSize={10} fill="#9CA3B4"
                fontFamily="'Inter', sans-serif">
                {zone.sublabel}
              </text>
              {/* Risk tier badge */}
              <rect x={zone.x + zone.w - 54} y={zone.y + 8} width={46} height={16} rx={5}
                fill={tierColor.stroke} opacity={0.1} />
              <text x={zone.x + zone.w - 31} y={zone.y + 20}
                fontSize={9} fontWeight={700} fill={tierColor.stroke}
                textAnchor="middle" fontFamily="'JetBrains Mono', monospace">
                {data.risk_tier.toUpperCase()}
              </text>
              {/* Personnel count */}
              {p > 0 && (
                <g>
                  <circle cx={zone.x + 12} cy={zone.y + zone.h - 14} r={10} fill="#F1F3F7" stroke="#E4E8EF" strokeWidth={1} />
                  <text x={zone.x + 12} y={zone.y + zone.h - 10}
                    fontSize={9} fontWeight={700} fill="#5A6578"
                    textAnchor="middle" fontFamily="'JetBrains Mono', monospace">
                    {p}
                  </text>
                </g>
              )}
            </g>
          )
        })}

        {/* Sensor nodes */}
        {SENSOR_POSITIONS.map(sensor => {
          const data = getSensorData(sensor.id)
          const isDead = data?.status === 'dead' || data?.status === 'degraded'
          const color = isDead ? '#D1D5DB' : '#2563EB'
          const r = 6

          return (
            <g key={sensor.id}>
              <circle cx={sensor.cx} cy={sensor.cy} r={r}
                fill={color} opacity={isDead ? 0.5 : 0.15}
                stroke={color} strokeWidth={1.5} />
              <circle cx={sensor.cx} cy={sensor.cy} r={r - 2}
                fill={color} opacity={isDead ? 0.3 : 0.8} />
              {isDead && (
                <text x={sensor.cx} y={sensor.cy - 9}
                  fontSize={8} fill="#DC2626" textAnchor="middle" fontWeight={700}>
                  ⚠
                </text>
              )}
              {/* Sensor value tooltip on hover handled by CSS title */}
              <title>{sensor.id}{isDead ? ' [DEAD/NO SIGNAL]' : data ? ` ${data.value} ${data.unit}` : ''}</title>
            </g>
          )
        })}

        {/* Corridor lines */}
        <line x1="160" y1="95" x2="175" y2="95" stroke="#E4E8EF" strokeWidth={2} strokeDasharray="4,3" />
        <line x1="305" y1="95" x2="320" y2="95" stroke="#E4E8EF" strokeWidth={2} strokeDasharray="4,3" />
        <line x1="450" y1="95" x2="465" y2="95" stroke="#E4E8EF" strokeWidth={2} strokeDasharray="4,3" />

        {/* North arrow */}
        <text x={605} y={250} fontSize={9} fill="#9CA3B4" textAnchor="end">↑ N</text>
        </g>
      </svg>

      {/* Zone hover tooltip */}
      {hoveredZone && (() => {
        const data = getZoneData(hoveredZone)
        const layout = ZONE_LAYOUT.find(z => z.zone_id === hoveredZone)
        if (!layout) return null
        return (
          <div style={{
            position: 'absolute',
            top: 60 + layout.y * 0.8,
            left: Math.min(layout.x * 0.8 + 10, 400),
            background: '#0F1729',
            color: '#fff',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 12,
            pointerEvents: 'none',
            zIndex: 20,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>{hoveredZone}</div>
            <div style={{ color: '#9CA3B4', fontSize: 11 }}>
              Risk: <span style={{ color: TIER_COLORS[data.risk_tier]?.stroke ?? '#16A34A' }}>
                {data.risk_tier.toUpperCase()}
              </span>
            </div>
            {data.last_event && (
              <div style={{ color: '#9CA3B4', fontSize: 11 }}>
                Last: {String(data.last_event.source ?? 'sensor')}
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
