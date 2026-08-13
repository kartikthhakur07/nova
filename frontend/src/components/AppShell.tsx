import React, { useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Radio, Database, Mic2, ShieldCheck,
  FileText, BookOpen, Home, WifiOff, Cpu, ChevronRight, Wifi,
  Building2, Bot, Activity
} from 'lucide-react'
import { getCases } from '../services/api'
import { useCaseStore } from '../store/useCaseStore'
import { useSessionSocket } from '../ws/useSessionSocket'

const NAV_ITEMS = [
  { label: 'Mission Control',    icon: LayoutDashboard, to: '/',          badge: 'Live',  badgeCol: '#2563EB' },
  { label: '3D Factory Twin',    icon: Building2,       to: '/factory-twin', badge: 'New',   badgeCol: '#10B981' },
  { label: 'NOVA Co-Pilot',      icon: Bot,             to: '/dashboard/nova', badge: 'AI',    badgeCol: '#8B5CF6' },
  { label: 'Sensor Telemetry',   icon: Activity,        to: '/telemetry', badge: null,    badgeCol: '' },
  { label: 'Audit Trail',        icon: FileText,        to: '/audit',     badge: null,    badgeCol: '' },
  { label: 'Lessons Learned',    icon: BookOpen,        to: '/lessons',   badge: null,    badgeCol: '' },
]

const TOPBAR_METRICS = [
  { label: 'ASR Whisper', value: '140ms', color: '#2563EB' },
  { label: 'LLM Token',   value: '219ms', color: '#7C3AED' },
  { label: 'Rime Audio',  value: '388ms', color: '#0D9488' },
]

const PHASE_5_NAV_ITEMS = [
  { label: 'Live Plant',         icon: Activity,        to: '/dashboard/live-plant' },
  { label: 'Active Case',        icon: ShieldCheck,     to: '/dashboard/active-case' },
  { label: 'Counterfactual',     icon: Cpu,             to: '/dashboard/counterfactual' },
  { label: 'Memory & Reports',   icon: Database,        to: '/dashboard/reports' },
]

export default function AppShell() {
  const location = useLocation()
  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  const activeCase = useCaseStore(s => s.activeCase)
  const setActiveCase = useCaseStore(s => s.setActiveCase)
  const connectionStatus = useCaseStore(s => s.connectionStatus)

  // Auto-fetch cases on load and pick the first one
  useEffect(() => {
    getCases().then(cases => {
      if (cases.length > 0 && !activeCase) {
        setActiveCase(cases[0])
      }
    }).catch(err => console.error("Failed to fetch cases:", err))
  }, [activeCase, setActiveCase])

  // Connect websocket for the active case
  useSessionSocket(activeCase?.case_id || 'demo')

  const navigate = useNavigate()
  const navTarget = useCaseStore(s => s.uiState.navTarget)
  const setNavTarget = useCaseStore(s => s.setNavTarget)

  useEffect(() => {
    if (navTarget) {
      // Clear the target so we don't keep navigating
      setNavTarget(null)
      // Switch screen
      navigate(navTarget)
    }
  }, [navTarget, navigate, setNavTarget])

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', background: '#F7F6F2',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside style={{
        width: 240, minHeight: '100vh', flexShrink: 0,
        background: '#FFFFFF',
        borderRight: '1px solid #C8C9C6',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Brand */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #E9E9E5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #0D9488, #0B7A70)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(13,148,136,0.25)',
            }}>
              <ShieldCheck size={17} color="#fff" />
            </div>
            <div>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800,
                fontSize: 16, color: '#0E0D1F', lineHeight: 1, letterSpacing: '-0.02em',
              }}>NOVA</div>
              <div style={{ fontSize: 11, color: '#62636A', marginTop: 2, fontWeight: 500 }}>Safety Intelligence</div>
            </div>
          </div>
        </div>

        {/* Return to landing */}
        <div style={{ padding: '12px 16px 4px' }}>
          <Link
            to="/"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', borderRadius: 8,
              background: '#F7F6F2', border: '1px solid #C8C9C6',
              color: '#62636A', textDecoration: 'none',
              fontSize: 12, fontWeight: 500, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#E9E9E5'; e.currentTarget.style.color = '#0E0D1F' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F7F6F2'; e.currentTarget.style.color = '#62636A' }}
          >
            <Home size={13} />
            Return to Landing
          </Link>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: '12px 12px 8px' }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#8E9096',
            textTransform: 'uppercase', marginBottom: 8, paddingLeft: 8,
          }}>
            Pipeline Views
          </div>

          {NAV_ITEMS.map(item => {
            const active = isActive(item.to)
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                  background: active ? '#F3DFC0' : 'transparent',
                  color: active ? '#D98A3A' : '#62636A',
                  textDecoration: 'none', fontSize: 13.5,
                  fontWeight: active ? 600 : 500,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#F7F6F2'; e.currentTarget.style.color = '#0E0D1F' } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#62636A' } }}
              >
                <Icon size={15} color={active ? '#D98A3A' : '#8E9096'} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 6,
                    background: `${item.badgeCol}0D`, border: `1px solid ${item.badgeCol}22`,
                    color: item.badgeCol, fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        <div style={{ padding: '12px 12px 8px', borderTop: '1px solid #E9E9E5' }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#8E9096',
            textTransform: 'uppercase', marginBottom: 8, paddingLeft: 8,
          }}>
            Phase 5 Tabs
          </div>
          {PHASE_5_NAV_ITEMS.map(item => {
            const active = isActive(item.to)
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                  background: active ? '#F3DFC0' : 'transparent',
                  color: active ? '#D98A3A' : '#62636A',
                  textDecoration: 'none', fontSize: 13.5,
                  fontWeight: active ? 600 : 500,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#F7F6F2'; e.currentTarget.style.color = '#0E0D1F' } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#62636A' } }}
              >
                <Icon size={15} color={active ? '#D98A3A' : '#8E9096'} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Active session */}
        <div style={{ padding: '14px 18px', borderTop: '1px solid #E9E9E5' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#8E9096', textTransform: 'uppercase', marginBottom: 6 }}>
            Active Session
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#D98A3A', fontWeight: 700 }}>
            {activeCase ? activeCase.case_id : 'WAITING...'}
          </div>
          <div style={{ fontSize: 11, color: '#62636A', marginTop: 2 }}>
            {activeCase ? activeCase.zone_id : '---'}
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top Bar */}
        <header style={{
          height: 56, background: '#FFFFFF',
          borderBottom: '1px solid #C8C9C6',
          display: 'flex', alignItems: 'center', padding: '0 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}>
          {/* NOVA chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 20, borderRight: '1px solid #C8C9C6', marginRight: 20 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: 'linear-gradient(135deg, #0D9488, #0B7A70)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShieldCheck size={14} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 14, color: '#0E0D1F', letterSpacing: '-0.02em' }}>NOVA</span>
                <span style={{
                  fontSize: 9, padding: '2px 6px', borderRadius: 5,
                  background: '#F3DFC0', border: '1px solid #D98A3A',
                  color: '#D98A3A', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                }}>v1.0</span>
              </div>
            </div>
          </div>

          {/* Active case */}
          <TopBarChip label="Active Case" value={activeCase ? activeCase.case_id : '---'} mono valueColor="#D98A3A" />
          <TopBarChip label="Zone" value={activeCase ? activeCase.zone_id : '---'} />

          {/* Risk */}
          <div style={{ paddingRight: 20, borderRight: '1px solid #C8C9C6', marginRight: 20 }}>
            <div style={{ fontSize: 10, color: '#8E9096', letterSpacing: '0.06em', marginBottom: 1 }}>Compound Risk</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: '#0E0D1F' }}>
                {activeCase ? Math.round(activeCase.compound_score * 100) : 0} <span style={{ color: '#8E9096', fontSize: 11 }}>/ 100</span>
              </span>
              <span style={{
                fontSize: 9, padding: '2px 7px', borderRadius: 5,
                background: activeCase?.risk_tier === 'critical' ? 'rgba(200, 75, 66, 0.1)' : 'rgba(217, 138, 58, 0.1)',
                border: `1px solid ${activeCase?.risk_tier === 'critical' ? '#C84B42' : '#D98A3A'}`,
                color: activeCase?.risk_tier === 'critical' ? '#C84B42' : '#D98A3A',
                fontWeight: 700, textTransform: 'uppercase'
              }}>{activeCase ? activeCase.risk_tier : '---'}</span>
            </div>
          </div>

          {/* Latency */}
          <div style={{ display: 'flex', gap: 14, paddingRight: 20, borderRight: '1px solid #C8C9C6', marginRight: 20 }}>
            {TOPBAR_METRICS.map(m => (
              <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: m.color }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: m.color, fontWeight: 600 }}>{m.value}</span>
              </div>
            ))}
          </div>

          {/* Status */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
            {connectionStatus === 'connected' ? (
              <>
                <Wifi size={13} color="#72856C" />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#72856C', fontWeight: 700 }}>CONNECTED</span>
              </>
            ) : (
              <>
                <WifiOff size={13} color="#C84B42" />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#C84B42', fontWeight: 700 }}>DISCONNECTED</span>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', background: '#F7F6F2' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function TopBarChip({ label, value, mono = false, valueColor = '#0E0D1F' }: { label: string; value: string; mono?: boolean; valueColor?: string }) {
  return (
    <div style={{ paddingRight: 20, borderRight: '1px solid #C8C9C6', marginRight: 20 }}>
      <div style={{ fontSize: 10, color: '#8E9096', letterSpacing: '0.06em', marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: valueColor, fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit' }}>{value}</div>
    </div>
  )
}
