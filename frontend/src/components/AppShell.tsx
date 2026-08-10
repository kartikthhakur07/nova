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
  { label: 'FRIDAY Co-Pilot',    icon: Bot,             to: '/friday',    badge: 'AI',    badgeCol: '#8B5CF6' },
  { label: 'Sensor Telemetry',   icon: Activity,        to: '/telemetry', badge: null,    badgeCol: '' },
  { label: 'Audit Trail',        icon: FileText,        to: '/audit',     badge: null,    badgeCol: '' },
  { label: 'Lessons Learned',    icon: BookOpen,        to: '/lessons',   badge: null,    badgeCol: '' },
]

const TOPBAR_METRICS = [
  { label: 'ASR Whisper', value: '140ms', color: '#2563EB' },
  { label: 'LLM Token',   value: '219ms', color: '#7C3AED' },
  { label: 'Rime Audio',  value: '388ms', color: '#0D9488' },
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
      display: 'flex', minHeight: '100vh', background: '#F8F9FB',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside style={{
        width: 240, minHeight: '100vh', flexShrink: 0,
        background: '#FFFFFF',
        borderRight: '1px solid #E4E8EF',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Brand */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #F1F3F7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
            }}>
              <ShieldCheck size={17} color="#fff" />
            </div>
            <div>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800,
                fontSize: 16, color: '#0F1729', lineHeight: 1, letterSpacing: '-0.02em',
              }}>NOVA</div>
              <div style={{ fontSize: 11, color: '#9CA3B4', marginTop: 2, fontWeight: 500 }}>Safety Intelligence</div>
            </div>
          </div>
        </div>

        {/* Return to landing */}
        <div style={{ padding: '12px 16px 4px' }}>
          <Link
            to="/landing"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', borderRadius: 8,
              background: '#F8F9FB', border: '1px solid #E4E8EF',
              color: '#5A6578', textDecoration: 'none',
              fontSize: 12, fontWeight: 500, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F1F3F7'; e.currentTarget.style.color = '#0F1729' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F8F9FB'; e.currentTarget.style.color = '#5A6578' }}
          >
            <Home size={13} />
            Return to Landing
          </Link>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: '12px 12px 8px' }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#9CA3B4',
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
                  background: active ? '#EFF6FF' : 'transparent',
                  color: active ? '#2563EB' : '#5A6578',
                  textDecoration: 'none', fontSize: 13.5,
                  fontWeight: active ? 600 : 500,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#F8F9FB'; e.currentTarget.style.color = '#0F1729' } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5A6578' } }}
              >
                <Icon size={15} color={active ? '#2563EB' : '#9CA3B4'} style={{ flexShrink: 0 }} />
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

        {/* Active session */}
        <div style={{ padding: '14px 18px', borderTop: '1px solid #F1F3F7' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#9CA3B4', textTransform: 'uppercase', marginBottom: 6 }}>
            Active Session
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#D97706', fontWeight: 700 }}>
            {activeCase ? activeCase.case_id : 'WAITING...'}
          </div>
          <div style={{ fontSize: 11, color: '#9CA3B4', marginTop: 2 }}>
            {activeCase ? activeCase.zone_id : '---'}
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top Bar */}
        <header style={{
          height: 56, background: '#FFFFFF',
          borderBottom: '1px solid #E4E8EF',
          display: 'flex', alignItems: 'center', padding: '0 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}>
          {/* NOVA chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 20, borderRight: '1px solid #E4E8EF', marginRight: 20 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShieldCheck size={14} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 14, color: '#0F1729', letterSpacing: '-0.02em' }}>NOVA</span>
                <span style={{
                  fontSize: 9, padding: '2px 6px', borderRadius: 5,
                  background: '#EFF6FF', border: '1px solid #BFDBFE',
                  color: '#2563EB', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                }}>v1.0</span>
              </div>
            </div>
          </div>

          {/* Active case */}
          <TopBarChip label="Active Case" value={activeCase ? activeCase.case_id : '---'} mono valueColor="#D97706" />
          <TopBarChip label="Zone" value={activeCase ? activeCase.zone_id : '---'} />

          {/* Risk */}
          <div style={{ paddingRight: 20, borderRight: '1px solid #E4E8EF', marginRight: 20 }}>
            <div style={{ fontSize: 10, color: '#9CA3B4', letterSpacing: '0.06em', marginBottom: 1 }}>Compound Risk</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: '#0F1729' }}>
                {activeCase ? Math.round(activeCase.compound_score * 100) : 0} <span style={{ color: '#9CA3B4', fontSize: 11 }}>/ 100</span>
              </span>
              <span style={{
                fontSize: 9, padding: '2px 7px', borderRadius: 5,
                background: activeCase?.risk_tier === 'critical' ? '#FEF2F2' : '#FFF7ED',
                border: `1px solid ${activeCase?.risk_tier === 'critical' ? '#FCA5A5' : '#FED7AA'}`,
                color: activeCase?.risk_tier === 'critical' ? '#DC2626' : '#EA580C',
                fontWeight: 700, textTransform: 'uppercase'
              }}>{activeCase ? activeCase.risk_tier : '---'}</span>
            </div>
          </div>

          {/* Latency */}
          <div style={{ display: 'flex', gap: 14, paddingRight: 20, borderRight: '1px solid #E4E8EF', marginRight: 20 }}>
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
                <Wifi size={13} color="#16A34A" />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#16A34A', fontWeight: 700 }}>CONNECTED</span>
              </>
            ) : (
              <>
                <WifiOff size={13} color="#DC2626" />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#DC2626', fontWeight: 700 }}>DISCONNECTED</span>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', background: '#F8F9FB' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function TopBarChip({ label, value, mono = false, valueColor = '#0F1729' }: { label: string; value: string; mono?: boolean; valueColor?: string }) {
  return (
    <div style={{ paddingRight: 20, borderRight: '1px solid #E4E8EF', marginRight: 20 }}>
      <div style={{ fontSize: 10, color: '#9CA3B4', letterSpacing: '0.06em', marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: valueColor, fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit' }}>{value}</div>
    </div>
  )
}
