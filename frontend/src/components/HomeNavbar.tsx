import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Zap } from 'lucide-react'
import LOGO from '../assets/LOGO.png'

const NAV_LINKS = [
  { label: 'Platform', href: '#platform' },
  { label: 'How It Works', href: '#how' },
  { label: 'Technology', href: '#tech' },
  { label: 'Demo', to: '/demo' },
]

export default function HomeNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 48px)',
          maxWidth: 1200,
          zIndex: 999,
          borderRadius: 20,
          padding: '0 24px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          ...(scrolled
            ? {
                background: 'rgba(255,255,255,0.72)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                boxShadow: '0 4px 32px rgba(0,0,0,0.10), 0 1px 0 rgba(255,255,255,0.6) inset',
                border: '1px solid rgba(255,255,255,0.55)',
              }
            : {
                background: 'rgba(255,255,255,0.48)',
                backdropFilter: 'blur(16px) saturate(160%)',
                WebkitBackdropFilter: 'blur(16px) saturate(160%)',
                boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                border: '1px solid rgba(255,255,255,0.45)',
              }),
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src={LOGO} alt="NOVA" style={{ height: 36, width: 'auto' }} />
        </Link>

        {/* Center links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="hidden md:flex">
          {NAV_LINKS.map(link => (
            link.to ? (
              <Link
                key={link.label}
                to={link.to}
                style={{
                  padding: '6px 16px',
                  borderRadius: 100,
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#111',
                  textDecoration: 'none',
                  transition: 'background 0.2s',
                  background: 'rgba(0,0,0,0.06)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.10)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                style={{
                  padding: '6px 16px',
                  borderRadius: 100,
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#111',
                  textDecoration: 'none',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {link.label}
              </a>
            )
          ))}
        </div>

        {/* Right CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 100,
            background: 'rgba(34,197,94,0.12)',
            border: '1px solid rgba(34,197,94,0.3)',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', display: 'inline-block', boxShadow: '0 0 8px #22C55E' }} className="animate-pulse" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', fontFamily: 'monospace' }}>LIVE</span>
          </div>
          <Link
            to="/case/1"
            style={{
              padding: '8px 20px',
              borderRadius: 100,
              background: '#111',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'opacity 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <Zap size={13} />
            Open Case
          </Link>
          {/* Mobile menu toggle */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111', padding: 4 }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          position: 'fixed',
          top: 88,
          left: 24,
          right: 24,
          zIndex: 998,
          borderRadius: 16,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          border: '1px solid rgba(255,255,255,0.6)',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {NAV_LINKS.map(link =>
            link.to ? (
              <Link key={link.label} to={link.to} onClick={() => setMobileOpen(false)}
                style={{ fontSize: 16, fontWeight: 500, color: '#111', textDecoration: 'none' }}>
                {link.label}
              </Link>
            ) : (
              <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)}
                style={{ fontSize: 16, fontWeight: 500, color: '#111', textDecoration: 'none' }}>
                {link.label}
              </a>
            )
          )}
        </div>
      )}
    </>
  )
}
