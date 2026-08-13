/**
 * frontend/src/components/EquipmentStatus.tsx
 * Live equipment status table with health scores, alerts, and maintenance badges.
 */
import React, { useEffect, useState } from 'react'
import { getEquipmentStatus } from '../services/api'
import { AlertTriangle, CheckCircle, Clock, Wifi, WifiOff, Zap } from 'lucide-react'

const P = '#0E0D1F', S = '#62636A', M = '#8E9096', BD = '#C8C9C6'
const CARD = '#FFFFFF'
const GREEN = '#72856C', AMBER = '#D98A3A', ORANGE = '#D98A3A', RED = '#C84B42'
const BLUE = '#0D9488'

type Equipment = {
  equipment_id: string
  name: string
  class: string
  zone_id: string
  status: string
  criticality: string
  health_pct: number
  last_serviced_days_ago: number
  overdue_maintenance: boolean
  alerts: string[]
}

function healthColor(pct: number): string {
  if (pct >= 80) return GREEN
  if (pct >= 60) return AMBER
  if (pct >= 40) return ORANGE
  return RED
}

function statusIcon(status: string) {
  if (status === 'operational') return <CheckCircle size={13} color={GREEN} />
  if (status === 'no_signal') return <WifiOff size={13} color={RED} />
  if (status === 'overdue_maintenance' || status === 'overdue_calibration') return <Clock size={13} color={AMBER} />
  if (status === 'pending_repair') return <AlertTriangle size={13} color={ORANGE} />
  return <Zap size={13} color={M} />
}

function criticalityBadge(level: string) {
  const map: Record<string, [string, string]> = {
    critical: [RED, '#FEF2F2'],
    high: [ORANGE, '#FFF7ED'],
    medium: [AMBER, '#FFFBEB'],
    low: [GREEN, '#F0FDF4'],
  }
  const [color, bg] = map[level] ?? [M, '#F8F9FB']
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
      background: bg, color, border: `1px solid ${color}22`,
      fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase' as const,
    }}>
      {level}
    </span>
  )
}

export default function EquipmentStatus({ zone }: { zone?: string }) {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getEquipmentStatus()
        setEquipment(data)
      } catch {
        // fallback to empty
      } finally {
        setLoading(false)
      }
    }
    fetch()
    const id = setInterval(fetch, 5000)
    return () => clearInterval(id)
  }, [])

  const zones = ['ALL', ...Array.from(new Set(equipment.map(e => e.zone_id)))]
  const displayed = equipment.filter(e =>
    (filter === 'ALL' || e.zone_id === filter) &&
    (!zone || e.zone_id === zone)
  )

  return (
    <div style={{ background: CARD, borderRadius: 12, border: `1px solid ${BD}`, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BD}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: P, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Equipment Status
          </div>
          <div style={{ fontSize: 11, color: M, marginTop: 1 }}>
            {displayed.filter(e => e.alerts.length > 0).length} with alerts
          </div>
        </div>
        {/* Zone filter */}
        <div style={{ display: 'flex', gap: 4 }}>
          {zones.map(z => (
            <button key={z} onClick={() => setFilter(z)} style={{
              padding: '3px 8px', borderRadius: 6, border: `1px solid ${filter === z ? BLUE : BD}`,
              background: filter === z ? '#EFF6FF' : 'transparent',
              color: filter === z ? BLUE : S, fontSize: 10, fontWeight: 600, cursor: 'pointer',
            }}>
              {z}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#F8F9FB' }}>
              {['Equipment', 'Zone', 'Status', 'Criticality', 'Health', 'Last Service', 'Alerts'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left' as const, fontSize: 10, fontWeight: 700,
                  color: M, letterSpacing: '0.06em', textTransform: 'uppercase' as const, borderBottom: `1px solid ${BD}` }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center' as const, color: M }}>Loading...</td></tr>
            ) : displayed.map((eq, i) => (
              <tr key={eq.equipment_id} style={{
                borderBottom: i < displayed.length - 1 ? `1px solid ${BD}` : 'none',
                background: eq.overdue_maintenance ? '#FFFBEB' : eq.status === 'no_signal' ? '#FEF2F2' : 'transparent',
              }}>
                <td style={{ padding: '9px 12px' }}>
                  <div style={{ fontWeight: 600, color: P }}>{eq.equipment_id}</div>
                  <div style={{ fontSize: 11, color: M }}>{eq.name.replace(eq.equipment_id + ' — ', '')}</div>
                </td>
                <td style={{ padding: '9px 12px', color: S }}>{eq.zone_id}</td>
                <td style={{ padding: '9px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {statusIcon(eq.status)}
                    <span style={{ color: S, fontSize: 11 }}>{eq.status.replace(/_/g, ' ')}</span>
                  </div>
                </td>
                <td style={{ padding: '9px 12px' }}>{criticalityBadge(eq.criticality)}</td>
                <td style={{ padding: '9px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 50, height: 5, borderRadius: 3, background: '#F1F3F7', overflow: 'hidden' }}>
                      <div style={{ width: `${eq.health_pct}%`, height: '100%', borderRadius: 3, background: healthColor(eq.health_pct) }} />
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: healthColor(eq.health_pct), fontWeight: 700 }}>
                      {eq.health_pct}%
                    </span>
                  </div>
                </td>
                <td style={{ padding: '9px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: eq.overdue_maintenance ? AMBER : S }}>
                  {eq.last_serviced_days_ago < 1 ? '< 1 day' : `${Math.floor(eq.last_serviced_days_ago)}d ago`}
                  {eq.overdue_maintenance && <span style={{ marginLeft: 4, color: AMBER }}>⚠</span>}
                </td>
                <td style={{ padding: '9px 12px' }}>
                  {eq.alerts.length === 0
                    ? <span style={{ color: M, fontSize: 11 }}>—</span>
                    : eq.alerts.map((a, i) => (
                        <div key={i} style={{ fontSize: 10, color: ORANGE, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <AlertTriangle size={9} /> {a}
                        </div>
                      ))
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
