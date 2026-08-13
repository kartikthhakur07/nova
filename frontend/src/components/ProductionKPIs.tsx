/**
 * frontend/src/components/ProductionKPIs.tsx
 * Live production KPI cards with sparkline animations.
 */
import React, { useEffect, useState } from 'react'
import { getProductionKPIs, getActivePermits } from '../services/api'
import { Activity, Zap, AlertTriangle, Users, Clock, Shield } from 'lucide-react'

const P = '#0E0D1F', S = '#62636A', M = '#8E9096', BD = '#C8C9C6'
const CARD = '#FFFFFF'
const GREEN = '#72856C', AMBER = '#D98A3A', RED = '#C84B42', BLUE = '#0D9488', TEAL = '#0D9488'

type KPI = {
  production_rate_units_hr: number
  plant_efficiency_pct: number
  power_draw_kw: number
  active_alarms: number
  active_permits: number
  personnel_onsite: number
  mtbi_hours: number
  last_incident_days_ago: number
  shifts: { current: string; supervisor: string; changeover_in_min: number }
}

function KPICard({
  icon: Icon, label, value, sub, color, trend,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color: string
  trend?: 'up' | 'down' | 'stable'
}) {
  return (
    <div style={{
      background: CARD, borderRadius: 12, border: `1px solid ${BD}`,
      padding: '14px 16px', flex: 1, minWidth: 120,
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      transition: 'transform 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: `${color}12`, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={14} color={color} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: M, letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
          {label}
        </span>
      </div>
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 800, color: P, lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: M, marginTop: 4 }}>{sub}</div>
      )}
      {trend && (
        <div style={{ marginTop: 6, fontSize: 10, color: trend === 'up' ? GREEN : trend === 'down' ? RED : M }}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trend}
        </div>
      )}
    </div>
  )
}

export default function ProductionKPIs() {
  const [kpi, setKpi] = useState<KPI | null>(null)
  const [permits, setPermits] = useState<number>(0)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [k, p] = await Promise.all([getProductionKPIs(), getActivePermits()])
        setKpi(k)
        setPermits(p.length)
      } catch {}
    }
    fetch()
    const id = setInterval(fetch, 3000)
    return () => clearInterval(id)
  }, [])

  if (!kpi) {
    return (
      <div style={{ display: 'flex', gap: 10 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ flex: 1, height: 90, borderRadius: 12, border: `1px solid ${BD}`,
            background: 'linear-gradient(90deg, #F8F9FB 25%, #F1F3F7 50%, #F8F9FB 75%)',
            backgroundSize: '200% 100%', animation: 'nova-shimmer 1.5s infinite' }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      <KPICard icon={Activity} label="Production" color={BLUE}
        value={`${kpi.production_rate_units_hr}`}
        sub="units / hour" trend="stable" />

      <KPICard icon={Zap} label="Efficiency" color={GREEN}
        value={`${kpi.plant_efficiency_pct}%`}
        sub="plant uptime" trend={kpi.plant_efficiency_pct > 90 ? 'stable' : 'down'} />

      <KPICard icon={AlertTriangle} label="Active Alarms" color={kpi.active_alarms > 0 ? RED : GREEN}
        value={kpi.active_alarms}
        sub={kpi.active_alarms > 0 ? 'requires attention' : 'all clear'} />

      <KPICard icon={Shield} label="Permits" color={AMBER}
        value={permits}
        sub="permits-to-work active" />

      <KPICard icon={Users} label="Personnel" color={TEAL}
        value={kpi.personnel_onsite}
        sub="on-site across zones" />

      <KPICard icon={Clock} label="Last Incident" color={S}
        value={`${kpi.last_incident_days_ago}d`}
        sub="ago — cooling pump" />
    </div>
  )
}
