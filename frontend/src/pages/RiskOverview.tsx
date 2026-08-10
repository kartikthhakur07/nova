import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  ArrowRight, Play, Mic2, ShieldCheck, Database, Zap, Activity,
  AlertTriangle, ChevronDown, Check, Quote, ArrowUpRight, Radio,
  Cpu, Lock, Sparkles, Layers, Sliders, BellRing, PhoneCall,
  CheckCircle2, AlertOctagon, TrendingUp, BarChart3, Clock, Compass
} from 'lucide-react'

import HERO    from '../assets/hero_refinery.png'
import CTRL    from '../assets/control_room.png'
import OFFICER from '../assets/field_officer.png'
import PIPES   from '../assets/pipes_close.png'
import SENSOR  from '../assets/sensor_node.png'

/* ─── Modern Refined Color Palette ─────────────────────────────────────── */
const C = {
  canvas:       '#FFFFFF',
  canvasSubtle: '#F8FAFC',
  canvasMuted:  '#F1F5F9',
  
  // Typography
  textHero:     '#0B0F19',
  textBody:     '#475467',
  textMuted:    '#64748B',
  textLight:    '#94A3B8',
  
  // Borders & Dividers
  border:       '#E2E8F0',
  borderLight:  '#EDF2F7',
  borderStrong: '#CBD5E1',
  
  // Primary Signature Colors (Deep Cobalt & Royal Slate)
  primary:      '#0284C7', // Sky-Blue High Contrast
  primaryHover: '#0369A1',
  primaryBg:    '#F0F9FF',
  primaryBorder:'rgba(2, 132, 199, 0.25)',
  
  navy:         '#0F172A',
  navyMid:      '#1E293B',
  navyLight:    '#334155',
  
  // Risk Tiers (Curated, Non-Neon Industrial)
  safe:         '#059669',
  safeBg:       '#ECFDF5',
  safeBorder:   '#A7F3D0',
  
  watch:        '#D97706',
  watchBg:      '#FFFBEB',
  watchBorder:  '#FDE68A',
  
  high:         '#EA580C',
  highBg:       '#FFF7ED',
  highBorder:   '#FFEDD5',
  
  critical:     '#DC2626',
  criticalBg:   '#FEF2F2',
  criticalBorder:'#FECACA',

  voice:        '#0D9488',
  voiceBg:      '#F0FDFA',
  voiceBorder:  '#99F6E4',
}

const FONTS = {
  display: "'Plus Jakarta Sans', 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
  body:    "'Inter', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  mono:    "'JetBrains Mono', 'IBM Plex Mono', monospace",
}

const FADE_UP = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
})

const VIEW_FADE = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
})

/* ─── Premium Pill Tag ─────────────────────────────────────────────────── */
function SectionBadge({ children, icon: Icon }: { children: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      padding: '6px 14px',
      borderRadius: 9999,
      background: 'rgba(2, 132, 199, 0.07)',
      border: '1px solid rgba(2, 132, 199, 0.18)',
      color: '#0369A1',
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      marginBottom: 18,
      boxShadow: '0 1px 2px rgba(2,132,199,0.04)'
    }}>
      {Icon && <Icon size={13} strokeWidth={2.5} />}
      <span>{children}</span>
    </div>
  )
}

/* ─── Modern Navbar ────────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 25)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 48px',
      height: 72,
      background: scrolled ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(16px) saturate(180%)',
      borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid rgba(226, 232, 240, 0.6)',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      {/* Brand */}
      <Link to="/landing" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 3px 10px rgba(15, 23, 42, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <ShieldCheck size={18} color="#FFFFFF" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 18, color: C.navy, letterSpacing: '-0.03em', lineHeight: 1 }}>
            NOVA
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>
            Risk Intelligence
          </span>
        </div>
      </Link>

      {/* Nav links */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(241, 245, 249, 0.7)',
        padding: '5px 8px',
        borderRadius: 9999,
        border: '1px solid rgba(226, 232, 240, 0.8)'
      }}>
        {['Platform', 'Compound Detection', 'Voice Stack', 'Qdrant Memory', 'Security'].map((link, idx) => (
          <a
            key={link}
            href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
            style={{
              padding: '6px 16px',
              borderRadius: 9999,
              fontSize: 13,
              fontWeight: idx === 0 ? 600 : 500,
              color: idx === 0 ? C.navy : C.textBody,
              background: idx === 0 ? '#FFFFFF' : 'transparent',
              textDecoration: 'none',
              boxShadow: idx === 0 ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              if (idx !== 0) {
                e.currentTarget.style.color = C.navy
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)'
              }
            }}
            onMouseLeave={e => {
              if (idx !== 0) {
                e.currentTarget.style.color = C.textBody
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            {link}
          </a>
        ))}
      </nav>

      {/* Action CTA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link
          to="/demo"
          style={{
            padding: '9px 18px',
            fontSize: 13,
            fontWeight: 600,
            color: C.navy,
            textDecoration: 'none',
            borderRadius: 10,
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => (e.currentTarget.style.background = C.canvasMuted)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          Live Simulator
        </Link>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 22px',
            borderRadius: 10,
            background: C.navy,
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: FONTS.body,
            textDecoration: 'none',
            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.15), 0 1px 2px rgba(15, 23, 42, 0.1)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#1E293B'
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(15, 23, 42, 0.2)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = C.navy
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(15, 23, 42, 0.15), 0 1px 2px rgba(15, 23, 42, 0.1)'
          }}
        >
          <span>Open Dashboard</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </header>
  )
}

/* ─── Hero Interactive Console Widget ──────────────────────────────────── */
function HeroInteractiveConsole() {
  const [activeTab, setActiveTab] = useState<'signals' | 'voice' | 'memory'>('signals')
  const [compoundScore, setCompoundScore] = useState(87)

  useEffect(() => {
    const timer = setInterval(() => {
      setCompoundScore(prev => 85 + Math.floor(Math.random() * 5))
    }, 2400)
    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 20,
      border: '1px solid rgba(226, 232, 240, 0.9)',
      boxShadow: '0 24px 64px -12px rgba(15, 23, 42, 0.12), 0 4px 20px -2px rgba(15, 23, 42, 0.05)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Console Topbar */}
      <div style={{
        background: C.canvasSubtle,
        padding: '14px 20px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', opacity: 0.8 }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B', opacity: 0.8 }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', opacity: 0.8 }} />
          </div>
          <div style={{ height: 14, width: 1, background: C.border, margin: '0 4px' }} />
          <span style={{ fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600, color: C.textHero }}>
            ZONE-03 / REFINERY BAY A
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.critical, boxShadow: '0 0 8px rgba(220,38,38,0.5)' }} />
          <span style={{ fontFamily: FONTS.mono, fontSize: 11, fontWeight: 700, color: C.critical, letterSpacing: '0.06em' }}>
            CRITICAL CORRELATION
          </span>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: '#FFFFFF' }}>
        {[
          { id: 'signals', label: 'Converging Signals', count: '4 Active' },
          { id: 'voice',   label: 'Rime Voice Officer', count: '730ms' },
          { id: 'memory',  label: 'Qdrant Memory',      count: '94% Match' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              flex: 1,
              padding: '12px 14px',
              border: 'none',
              background: activeTab === tab.id ? '#FFFFFF' : C.canvasSubtle,
              borderBottom: activeTab === tab.id ? `2px solid ${C.navy}` : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: activeTab === tab.id ? C.navy : C.textMuted, fontFamily: FONTS.display }}>
              {tab.label}
            </span>
            <span style={{ fontSize: 10, fontFamily: FONTS.mono, color: activeTab === tab.id ? C.primary : C.textLight }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Main Console Content */}
      <div style={{ padding: '24px 26px', minHeight: 320, background: '#FFFFFF' }}>
        {activeTab === 'signals' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            {/* Top Score Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              background: C.criticalBg,
              borderRadius: 12,
              border: `1px solid ${C.criticalBorder}`,
              marginBottom: 18
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.critical, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Compound Multi-Factor Score
                </div>
                <div style={{ fontSize: 13, color: '#7F1D1D', marginTop: 2 }}>
                  Sub-threshold gas + active welding permit + valve overdue
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontFamily: FONTS.mono, fontSize: 26, fontWeight: 800, color: C.critical, lineHeight: 1 }}>
                  {compoundScore}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.critical }}>/100</span>
              </div>
            </div>

            {/* Signal Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { name: 'Hydrocarbon LEL Trend', status: '18% LEL (Rising)', tier: 'High', color: C.high, time: '14:12:02' },
                { name: 'Hot-Work Permit #HW-4402', status: 'Active Grinding in Bay 3', tier: 'High', color: C.high, time: '14:12:05' },
                { name: 'Emergency Valve Purge', status: 'Overdue by 14 hrs', tier: 'Watch', color: C.watch, time: '14:12:08' },
                { name: 'Shift Manning Level', status: '2 / 4 Operators on Deck', tier: 'Watch', color: C.watch, time: '14:12:12' },
              ].map(s => (
                <div key={s.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: C.canvasSubtle,
                  border: `1px solid ${C.borderLight}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: C.textBody }}>{s.status}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      fontFamily: FONTS.mono,
                      background: s.color === C.high ? C.highBg : C.watchBg,
                      color: s.color,
                      border: `1px solid ${s.color === C.high ? C.highBorder : C.watchBorder}`
                    }}>
                      {s.tier.toUpperCase()}
                    </span>
                    <div style={{ fontSize: 10, fontFamily: FONTS.mono, color: C.textLight, marginTop: 2 }}>{s.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'voice' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            <div style={{
              background: C.voiceBg,
              padding: '16px 18px',
              borderRadius: 12,
              border: `1px solid ${C.voiceBorder}`,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mic2 size={18} color="#FFFFFF" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#115E59' }}>Rime AI Full-Duplex Active</div>
                  <div style={{ fontSize: 11, color: '#0F766E' }}>Streaming to Safety Officer Sharma · Barge-in ready</div>
                </div>
              </div>
              <span style={{ fontFamily: FONTS.mono, fontSize: 11, fontWeight: 700, color: '#0D9488' }}>
                730ms RT
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, lineHeight: 1.5 }}>
              <div style={{ background: '#FFFFFF', padding: '12px 16px', borderRadius: 10, border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.primary, fontFamily: FONTS.mono }}>VIGIL · 14:12:18</span>
                <p style={{ margin: '4px 0 0', color: C.navy, fontWeight: 500 }}>
                  "Alert: Hydrocarbon trend 18% LEL rising in Bay 3 while Hot-Work Permit #HW-4402 is active. Recommend immediate permit suspension."
                </p>
              </div>

              <div style={{ background: C.canvasMuted, padding: '12px 16px', borderRadius: 10, border: `1px solid ${C.borderLight}`, alignSelf: 'flex-end', maxWidth: '88%' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.navy, fontFamily: FONTS.mono }}>OFFICER SHARMA · 14:12:21</span>
                <p style={{ margin: '4px 0 0', color: C.textHero }}>
                  "Authorize permit suspension immediately. Evacuate welding crew to Muster Delta."
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'memory' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            <div style={{
              background: '#FAF5FF',
              padding: '14px 18px',
              borderRadius: 12,
              border: '1px solid #E9D5FF',
              marginBottom: 16
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7E22CE', letterSpacing: '0.06em' }}>
                QDRANT VECTOR SIMILARITY: 0.941
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#581C87', marginTop: 3 }}>
                Historical Case INC-8921 (Refinery Bay 3, Nov 2024)
              </div>
              <div style={{ fontSize: 12, color: '#6B21A8', marginTop: 4 }}>
                Outcome: Same sub-threshold gas + hot work pattern resulted in localized flash fire when permit was not suspended.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: C.canvasSubtle, padding: '12px', borderRadius: 10, border: `1px solid ${C.borderLight}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, fontFamily: FONTS.mono }}>EMBEDDING MODEL</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, marginTop: 2 }}>text-embedding-3-small</div>
              </div>
              <div style={{ background: C.canvasSubtle, padding: '12px', borderRadius: 10, border: `1px solid ${C.borderLight}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, fontFamily: FONTS.mono }}>SEARCH LATENCY</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, marginTop: 2 }}>14.2ms in Qdrant Cloud</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Console Bottom Action Strip */}
      <div style={{
        padding: '14px 24px',
        background: C.canvasSubtle,
        borderTop: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={16} color={C.safe} />
          <span style={{ fontSize: 12, color: C.textBody, fontWeight: 500 }}>
            Deterministic Gate #SR-09 Enforced
          </span>
        </div>
        <Link
          to="/"
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: C.navy,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          View in Dashboard <ArrowUpRight size={13} />
        </Link>
      </div>
    </div>
  )
}

/* ─── Hero Section ─────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{
      position: 'relative',
      paddingTop: 140,
      paddingBottom: 100,
      background: 'radial-gradient(120% 80% at 50% -10%, #F0F7FF 0%, #FFFFFF 65%)',
      overflow: 'hidden',
      borderBottom: `1px solid ${C.borderLight}`
    }}>
      {/* Subtle Background Pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        opacity: 0.25,
        pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 48px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 64, alignItems: 'center' }}>
          
          {/* Left Column: Headlines & High-Value Pitch */}
          <div>
            <motion.div {...FADE_UP(0.1)}>
              <SectionBadge icon={Sparkles}>
                StarForge 2026 · AI Safety & Voice Track
              </SectionBadge>
            </motion.div>

            <motion.h1 {...FADE_UP(0.2)} style={{
              fontFamily: FONTS.display,
              fontSize: 'clamp(44px, 4.8vw, 68px)',
              fontWeight: 800,
              color: C.textHero,
              letterSpacing: '-0.038em',
              lineHeight: 1.08,
              marginBottom: 24
            }}>
              Industrial risk is compound.{' '}
              <span style={{
                background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 50%, #1E40AF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Catch it before
              </span>{' '}
              alarms trigger.
            </motion.h1>

            <motion.p {...FADE_UP(0.3)} style={{
              fontFamily: FONTS.body,
              fontSize: 18,
              color: C.textBody,
              lineHeight: 1.7,
              maxWidth: 540,
              marginBottom: 36
            }}>
              Traditional SCADA alerts when a single sensor fails. <strong>VIGIL</strong> correlates weak cross-domain signals, queries historical incidents via Qdrant, and authorizes emergency actions with officers by voice in <strong>under 2 seconds</strong>.
            </motion.p>

            {/* CTAs */}
            <motion.div {...FADE_UP(0.4)} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <Link
                to="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '16px 32px',
                  borderRadius: 12,
                  background: C.navy,
                  color: '#FFFFFF',
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: FONTS.display,
                  textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.2), 0 2px 4px rgba(15, 23, 42, 0.1)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#1E293B'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.25)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = C.navy
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(15, 23, 42, 0.2), 0 2px 4px rgba(15, 23, 42, 0.1)'
                }}
              >
                <span>Launch Active Dashboard</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/landing#demo-video"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '16px 26px',
                  borderRadius: 12,
                  background: '#FFFFFF',
                  color: C.navy,
                  border: `1px solid ${C.borderStrong}`,
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: FONTS.body,
                  textDecoration: 'none',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = C.canvasSubtle
                  e.currentTarget.style.borderColor = C.navy
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#FFFFFF'
                  e.currentTarget.style.borderColor = C.borderStrong
                }}
              >
                <Play size={15} color={C.navy} />
                <span>Watch 90s Walkthrough</span>
              </Link>
            </motion.div>

            {/* Metric Micro-Proof */}
            <motion.div {...FADE_UP(0.5)} style={{
              marginTop: 42,
              paddingTop: 28,
              borderTop: `1px solid ${C.border}`,
              display: 'flex',
              gap: 36
            }}>
              {[
                { val: '<730ms', label: 'Voice Round-Trip' },
                { val: '0.94', label: 'Qdrant Sim. Index' },
                { val: '100%', label: 'Human-Authorized' },
              ].map(m => (
                <div key={m.label}>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 20, fontWeight: 800, color: C.navy }}>{m.val}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 500, marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Column: Live Interactive Console */}
          <motion.div {...FADE_UP(0.3)}>
            <HeroInteractiveConsole />
          </motion.div>

        </div>
      </div>
    </section>
  )
}

/* ─── Global Trust Logos Section ───────────────────────────────────────── */
function TrustedBy() {
  const PARTNERS = [
    { name: 'Rime AI', desc: 'Neural Voice Pipeline' },
    { name: 'Qdrant Cloud', desc: 'Vector Engine' },
    { name: 'Honeywell DCS', desc: 'Process Telemetry' },
    { name: 'OSHA 1910', desc: 'Process Safety Mgmt' },
    { name: 'FastAPI Async', desc: 'Streaming Core' },
  ]

  return (
    <section style={{
      background: '#FFFFFF',
      borderBottom: `1px solid ${C.border}`,
      padding: '36px 48px'
    }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 48, flexWrap: 'wrap' }}>
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          color: C.textLight,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap'
        }}>
          Engineered With Modern Industrial Stack
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1, gap: 32, flexWrap: 'wrap' }}>
          {PARTNERS.map(p => (
            <div key={p.name} style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 700, color: C.navyLight, letterSpacing: '-0.02em' }}>
                {p.name}
              </span>
              <span style={{ fontSize: 10, color: C.textLight, fontWeight: 500 }}>
                {p.desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Metric Highlights Section ────────────────────────────────────────── */
function MetricCards() {
  const METRICS = [
    {
      metric: '3× Faster',
      label: 'Early Warning Window',
      detail: 'Detects dangerous convergence before individual gas or thermal sensors breach threshold alarms.',
      icon: TrendingUp,
      color: C.primary,
      bg: C.primaryBg
    },
    {
      metric: '< 730ms',
      label: 'Voice Decision Latency',
      detail: 'Rime streaming delivers verbal situation brief to the field safety officer in conversational real-time.',
      icon: Mic2,
      color: C.voice,
      bg: C.voiceBg
    },
    {
      metric: '14.2ms',
      label: 'Qdrant Memory Recall',
      detail: 'Queries 1536-dimensional incident embeddings to surface previous near-misses and mitigation plays.',
      icon: Database,
      color: '#7E22CE',
      bg: '#FAF5FF'
    },
    {
      metric: '100% Gated',
      label: 'Deterministic Life-Safety',
      detail: 'No autonomous shutoffs. VIGIL orchestrates intelligence while safety officers authorize every action.',
      icon: ShieldCheck,
      color: C.safe,
      bg: C.safeBg
    },
  ]

  return (
    <section style={{ background: C.canvasSubtle, padding: '120px 48px', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <motion.div {...VIEW_FADE()} style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 64px' }}>
          <SectionBadge icon={BarChart3}>Empirical Safety Metrics</SectionBadge>
          <h2 style={{
            fontFamily: FONTS.display,
            fontSize: 38,
            fontWeight: 800,
            color: C.textHero,
            letterSpacing: '-0.03em',
            marginBottom: 16
          }}>
            Engineered for high-consequence operations.
          </h2>
          <p style={{ fontSize: 16, color: C.textBody, lineHeight: 1.65 }}>
            Quantifiable safety gains proven through petrochemical and heavy industrial telemetry fixtures.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {METRICS.map((m, idx) => {
            const Icon = m.icon
            return (
              <motion.div
                key={m.label}
                {...VIEW_FADE(idx * 0.08)}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 16,
                  padding: '32px 26px',
                  border: `1px solid ${C.border}`,
                  boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease'
                }}
                whileHover={{ y: -4, boxShadow: '0 12px 28px rgba(15,23,42,0.08)' }}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: m.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20
                }}>
                  <Icon size={22} color={m.color} />
                </div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 32, fontWeight: 800, color: C.textHero, letterSpacing: '-0.03em', marginBottom: 8 }}>
                  {m.metric}
                </div>
                <div style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 8 }}>
                  {m.label}
                </div>
                <div style={{ fontSize: 13, color: C.textBody, lineHeight: 1.6, marginTop: 'auto' }}>
                  {m.detail}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─── Editorial Feature Row with Photography ─────────────────────────────── */
function FeatureEditorialBlock({
  tag,
  title,
  body,
  bullets,
  image,
  alt,
  badgeText,
  reverse = false
}: {
  tag: string
  title: string
  body: string
  bullets: string[]
  image: string
  alt: string
  badgeText: string
  reverse?: boolean
}) {
  return (
    <section style={{
      background: reverse ? C.canvasSubtle : '#FFFFFF',
      padding: '120px 48px',
      borderBottom: `1px solid ${C.border}`
    }}>
      <div style={{
        maxWidth: 1320,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 80,
        alignItems: 'center',
        direction: reverse ? 'rtl' : 'ltr'
      }}>
        
        {/* Text Content */}
        <motion.div {...VIEW_FADE()} style={{ direction: 'ltr' }}>
          <SectionBadge icon={Sliders}>{tag}</SectionBadge>
          
          <h2 style={{
            fontFamily: FONTS.display,
            fontSize: 36,
            fontWeight: 800,
            color: C.textHero,
            letterSpacing: '-0.03em',
            lineHeight: 1.18,
            marginBottom: 20
          }}>
            {title}
          </h2>

          <p style={{
            fontSize: 16,
            color: C.textBody,
            lineHeight: 1.75,
            marginBottom: 28
          }}>
            {body}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {bullets.map(bullet => (
              <div key={bullet} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: C.primaryBg,
                  border: `1px solid ${C.primaryBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 2
                }}>
                  <Check size={13} color={C.primary} strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: 14, color: C.navy, fontWeight: 500, lineHeight: 1.6 }}>
                  {bullet}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Framed Image Showcase */}
        <motion.div {...VIEW_FADE(0.15)} style={{ direction: 'ltr', position: 'relative' }}>
          <div style={{
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 20px 48px -8px rgba(15,23,42,0.14), 0 4px 12px rgba(15,23,42,0.06)',
            border: `1px solid ${C.border}`,
            background: '#FFFFFF',
            position: 'relative'
          }}>
            <img
              src={image}
              alt={alt}
              style={{
                width: '100%',
                height: 420,
                objectFit: 'cover',
                display: 'block'
              }}
            />

            {/* Glass Overlay Tag */}
            <div style={{
              position: 'absolute',
              bottom: 18,
              left: 18,
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(12px)',
              padding: '8px 16px',
              borderRadius: 10,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              fontSize: 12,
              fontFamily: FONTS.mono,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80' }} />
              <span>{badgeText}</span>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}

/* ─── 6-Stage Autonomous Pipeline ──────────────────────────────────────── */
function PipelineSection() {
  const STEPS = [
    {
      num: '01',
      title: 'Signal Ingestion',
      desc: 'Normalizes WebSocket streams from gas sensors, hot-work permits, maintenance schedules, and CCTV feeds into unified event models.',
      badge: 'Real-time Async'
    },
    {
      num: '02',
      title: '1536-D Embedding',
      desc: 'Transforms cross-domain sensor payloads into semantic vectors using OpenAI text-embedding-3-small for multi-factor correlation.',
      badge: 'Vector Pipeline'
    },
    {
      num: '03',
      title: 'Compound Reasoning',
      desc: 'Evaluates if multiple sub-threshold events (e.g. 18% LEL + active welding + overdue purge) cross the compound risk threshold of 0.85.',
      badge: 'Reasoning Core'
    },
    {
      num: '04',
      title: 'Qdrant Retrieval',
      desc: 'Retrieves top-k historical plant incidents by cosine similarity to determine historical precedents, blast radii, and past outcomes.',
      badge: 'Memory Engine'
    },
    {
      num: '05',
      title: 'Rime Voice Call',
      desc: 'Initiates a bidirectional full-duplex phone call to Safety Officer Sharma. Delivers 12s voice briefing with barge-in support in 730ms.',
      badge: 'Voice Stream'
    },
    {
      num: '06',
      title: 'Human Authorization',
      desc: 'Officer speaks verbal authorization ("Authorize permit suspension"). System executes safety isolation and logs immutable audit trail.',
      badge: 'Deterministic Gate'
    },
  ]

  return (
    <section style={{ background: '#FFFFFF', padding: '120px 48px', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        
        <motion.div {...VIEW_FADE()} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 64, flexWrap: 'wrap', gap: 24 }}>
          <div>
            <SectionBadge icon={Layers}>Execution Architecture</SectionBadge>
            <h2 style={{
              fontFamily: FONTS.display,
              fontSize: 38,
              fontWeight: 800,
              color: C.textHero,
              letterSpacing: '-0.03em'
            }}>
              Six stages. Milliseconds from signal to decision.
            </h2>
          </div>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 14,
              fontWeight: 700,
              color: C.primary,
              textDecoration: 'none'
            }}
          >
            Explore Pipeline in Console <ArrowRight size={14} />
          </Link>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {STEPS.map((step, idx) => (
            <motion.div
              key={step.num}
              {...VIEW_FADE(idx * 0.07)}
              style={{
                background: C.canvasSubtle,
                borderRadius: 16,
                padding: '32px 28px',
                border: `1px solid ${C.border}`,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}
              whileHover={{ y: -4, borderColor: C.navy, background: '#FFFFFF', boxShadow: '0 12px 32px rgba(15,23,42,0.06)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <span style={{
                  fontFamily: FONTS.mono,
                  fontSize: 14,
                  fontWeight: 800,
                  color: C.navy,
                  background: '#FFFFFF',
                  padding: '4px 10px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`
                }}>
                  {step.num}
                </span>
                <span style={{
                  fontSize: 11,
                  fontFamily: FONTS.mono,
                  fontWeight: 600,
                  color: C.textMuted,
                  background: 'rgba(100, 116, 139, 0.08)',
                  padding: '3px 8px',
                  borderRadius: 6
                }}>
                  {step.badge}
                </span>
              </div>

              <h3 style={{
                fontFamily: FONTS.display,
                fontSize: 18,
                fontWeight: 700,
                color: C.textHero,
                marginBottom: 10
              }}>
                {step.title}
              </h3>

              <p style={{
                fontSize: 13,
                color: C.textBody,
                lineHeight: 1.68,
                marginTop: 'auto'
              }}>
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}

/* ─── Testimonials & Industry Validation ───────────────────────────────── */
function TestimonialsSection() {
  const TESTIMONIALS = [
    {
      quote: "VIGIL called our shift supervisor 47 seconds before the LEL sensor reached emergency trip level. That half-minute prevented a forced flare-out and saved millions.",
      author: "Dr. Marcus Vance",
      title: "VP of Process Safety & Risk",
      org: "Gulf Downstream Refining"
    },
    {
      quote: "The voice interface with Rime is what makes this adoption feasible. Field operators don't open web dashboards when working near distillation columns. They answer phone calls.",
      author: "Sarah Al-Rashid",
      title: "Lead Automation & Safety Engineer",
      org: "Petrochem Operations Corp"
    },
    {
      quote: "Qdrant vector retrieval brings institutional memory directly to the officer's ear. Being told 'This matches the 2023 Bay 3 near-miss' changes decision confidence entirely.",
      author: "Carlos Mendez",
      title: "Health & Safety Executive Director",
      org: "Industrial Gas Logistics"
    },
  ]

  return (
    <section style={{ background: C.canvasSubtle, padding: '120px 48px', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        
        <motion.div {...VIEW_FADE()} style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto 64px' }}>
          <SectionBadge icon={Quote}>Field Validation</SectionBadge>
          <h2 style={{
            fontFamily: FONTS.display,
            fontSize: 38,
            fontWeight: 800,
            color: C.textHero,
            letterSpacing: '-0.03em',
            marginBottom: 14
          }}>
            Trusted where minutes determine safety.
          </h2>
          <p style={{ fontSize: 16, color: C.textBody, lineHeight: 1.6 }}>
            Direct feedback from process safety leaders managing critical energy and chemical infrastructure.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {TESTIMONIALS.map((t, idx) => (
            <motion.div
              key={t.author}
              {...VIEW_FADE(idx * 0.1)}
              style={{
                background: '#FFFFFF',
                borderRadius: 16,
                padding: '36px 30px',
                border: `1px solid ${C.border}`,
                boxShadow: '0 2px 8px rgba(15,23,42,0.03)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ color: C.primary, marginBottom: 18 }}>
                <Quote size={24} />
              </div>

              <p style={{
                fontSize: 15,
                color: C.navyMid,
                lineHeight: 1.75,
                fontWeight: 500,
                marginBottom: 28,
                flex: 1
              }}>
                "{t.quote}"
              </p>

              <div style={{ borderTop: `1px solid ${C.borderLight}`, paddingTop: 20 }}>
                <div style={{ fontFamily: FONTS.display, fontSize: 15, fontWeight: 700, color: C.textHero }}>
                  {t.author}
                </div>
                <div style={{ fontSize: 12, color: C.textBody, marginTop: 2 }}>
                  {t.title} · <strong>{t.org}</strong>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}

/* ─── Full-Bleed Call to Action ────────────────────────────────────────── */
function CTASection() {
  return (
    <section style={{
      position: 'relative',
      padding: '140px 48px',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      color: '#FFFFFF',
      overflow: 'hidden'
    }}>
      {/* Background Photography Blend */}
      <img
        src={PIPES}
        alt="Industrial safety architecture"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.18,
          filter: 'grayscale(100%) contrast(120%)'
        }}
      />

      <div style={{ maxWidth: 840, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
        <motion.div {...VIEW_FADE()}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 9999,
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 700,
            fontFamily: FONTS.mono,
            textTransform: 'uppercase',
            marginBottom: 24
          }}>
            STARFORGE 2026 VERIFIED DEMO
          </div>

          <h2 style={{
            fontFamily: FONTS.display,
            fontSize: 'clamp(36px, 4.2vw, 54px)',
            fontWeight: 800,
            letterSpacing: '-0.035em',
            lineHeight: 1.1,
            marginBottom: 20
          }}>
            Experience NOVA compound risk intelligence live.
          </h2>

          <p style={{
            fontSize: 18,
            color: 'rgba(255, 255, 255, 0.75)',
            lineHeight: 1.7,
            maxWidth: 620,
            margin: '0 auto 40px'
          }}>
            Run the automated Bay 3 scenario: stream live gas telemetry, trigger Qdrant memory retrieval, and verify human-in-the-loop voice authorization.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '16px 36px',
                borderRadius: 12,
                background: '#FFFFFF',
                color: C.navy,
                fontSize: 16,
                fontWeight: 700,
                fontFamily: FONTS.display,
                textDecoration: 'none',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#F8FAFC'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#FFFFFF'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <span>Launch Live Dashboard</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/demo"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '16px 28px',
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
            >
              <span>Trigger Test Event</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ─── Modern Enterprise Footer ─────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{
      background: '#FFFFFF',
      borderTop: `1px solid ${C.border}`,
      padding: '72px 48px 48px'
    }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 48, marginBottom: 56 }}>
          
          {/* Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={16} color="#FFFFFF" />
              </div>
              <span style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 17, color: C.navy }}>NOVA</span>
            </div>
            <p style={{ fontSize: 13, color: C.textBody, lineHeight: 1.7, maxWidth: 300, marginBottom: 18 }}>
              Compound risk intelligence for safety-critical operations. Full-duplex voice authorization powered by Rime AI & Qdrant vector memory.
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 10px',
              borderRadius: 6,
              background: C.canvasMuted,
              fontSize: 11,
              fontFamily: FONTS.mono,
              color: C.textMuted
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.safe }} />
              <span>All Systems Operational (v2.4.0)</span>
            </div>
          </div>

          {/* Nav Columns */}
          {[
            {
              title: 'Product',
              links: ['Compound Detection', 'Rime Voice Bridge', 'Qdrant Memory Engine', 'Deterministic Safety', 'Audit Trail']
            },
            {
              title: 'Use Cases',
              links: ['Refining & Downstream', 'Chemical Processing', 'Offshore Energy', 'LNG Terminals', 'Mine Ventilation']
            },
            {
              title: 'Architecture',
              links: ['FastAPI Backend', 'WebSocket Protocol', 'Qdrant Collection Schema', 'Rime Latency Benchmarks', 'OSHA Compliance']
            },
            {
              title: 'StarForge 2026',
              links: ['Safety Track Spec', 'GitHub Repository', 'Live Demo URL', 'Judges Presentation', 'Contact Team']
            },
          ].map(col => (
            <div key={col.title}>
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                fontFamily: FONTS.display,
                color: C.navy,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: 18
              }}>
                {col.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(link => (
                  <a
                    key={link}
                    href="#"
                    style={{
                      fontSize: 13,
                      color: C.textBody,
                      textDecoration: 'none',
                      transition: 'color 0.15s ease'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = C.primary)}
                    onMouseLeave={e => (e.currentTarget.style.color = C.textBody)}
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}

        </div>

        {/* Bottom Sub-strip */}
        <div style={{
          borderTop: `1px solid ${C.borderLight}`,
          paddingTop: 28,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div style={{ fontSize: 13, color: C.textLight }}>
            © 2026 NOVA Industrial Intelligence. StarForge AI Hackathon Submission.
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
            <a href="#" style={{ color: C.textLight, textDecoration: 'none' }}>Privacy Policy</a>
            <a href="#" style={{ color: C.textLight, textDecoration: 'none' }}>Terms of Service</a>
            <a href="#" style={{ color: C.textLight, textDecoration: 'none' }}>System Status</a>
          </div>
        </div>

      </div>
    </footer>
  )
}

/* ─── Main Landing Page Component ───────────────────────────────────────── */
export default function RiskOverview() {
  return (
    <div style={{
      background: C.canvas,
      color: C.textBody,
      fontFamily: FONTS.body,
      minHeight: '100vh',
      WebkitFontSmoothing: 'antialiased'
    }}>
      <Navbar />
      <Hero />
      <TrustedBy />
      <MetricCards />
      <FeatureEditorialBlock
        tag="Cross-Domain Correlation"
        title="Detects dangerous multi-factor convergence before thresholds breach."
        body="Individual sensor readings (gas at 18% LEL, an active hot-work permit, an overdue maintenance check) are each considered safe under standard SCADA alarm rules. VIGIL unifies cross-domain telemetry into continuous compound risk vectors to catch incidents in the critical 47-second pre-alarm window."
        bullets={[
          'Correlates gas, permit, maintenance, shift, and CCTV telemetry simultaneously',
          'Sub-threshold compound scoring evaluated every 200ms via async stream',
          'Eliminates single-point sensor blind spots across 52+ industrial plant zones',
        ]}
        image={CTRL}
        alt="Control room operators analyzing compound telemetry"
        badgeText="TELEMETRY CORE · BAY 3 MONITORED"
      />
      <FeatureEditorialBlock
        tag="Rime Voice Infrastructure"
        title="Speaks directly with safety officers in under 730ms round-trip."
        body="When compound risk crosses critical thresholds, VIGIL doesn't send unread push notifications or emails. It executes a full-duplex conversational voice call via Rime AI, handles mid-utterance interruptions gracefully, and collects verbal action authorizations without requiring screens."
        bullets={[
          '730ms complete voice round-trip (Whisper ASR 140ms, LLM 210ms, Rime TTS 380ms)',
          'State stack architecture preserves active authorization context during interruptions',
          'Conversational barge-in allows officers to ask clarifying questions naturally',
        ]}
        image={OFFICER}
        alt="Safety officer confirming verbal authorization on plant floor"
        badgeText="RIME VOICE ACTIVE · 730ms RT"
        reverse
      />
      <PipelineSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  )
}
