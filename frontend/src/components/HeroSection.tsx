import { Link } from 'react-router-dom'
'use client';
import { motion, useInView } from 'framer-motion';
import * as React from 'react';

export default function HeroSection() {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section
      id="product"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'flex-end',
        overflow: 'hidden',
        paddingTop: '64px',
      }}
    >
      {/* Full-bleed background image */}
      <img
        src="/assets/hero-hands.png"
        alt="Robot and human hands reaching — VIGIL AI-human collaboration"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          filter: 'contrast(1.05) brightness(0.75) saturate(0.9)',
        }}
        onError={(e) => {
          const t = e.currentTarget
          t.style.display = 'none'
          const fallback = t.nextElementSibling as HTMLElement | null
          if (fallback) fallback.style.display = 'block'
        }}
      />

      {/* Fallback background if image not placed yet */}
      <div
        style={{
          display: 'none',
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, var(--bg-primary) 40%, var(--bg-panel) 100%)',
        }}
      >
        <HeroFallbackVisual isDark={true} />
      </div>

      {/* Global top/bottom scrim */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(0deg, rgba(4,7,5,0.95) 0%, rgba(4,7,5,0.5) 40%, rgba(4,7,5,0.15) 60%, rgba(4,7,5,0.6) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Left-side scrim — guarantees contrast under the headline/subhead regardless of what's behind it */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(2,5,3,0.88) 0%, rgba(2,5,3,0.72) 30%, rgba(2,5,3,0.35) 55%, rgba(2,5,3,0) 75%)',
          pointerEvents: 'none',
        }}
      />

      {/* Subtle grid overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          opacity: 0.08,
        }}
      />

      <div
        className="container"
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          paddingBottom: '4rem',
        }}
      >
        <div className="animate-fade-up" style={{ maxWidth: '640px', marginTop: '6rem' }}>
          {/* Badge */}


          {/* Main headline */}
          <div >
            <motion.h1
              style={{
                fontFamily: 'Bebas Neue',
                fontSize: 'clamp(3.5rem, 6vw, 6rem)',
                lineHeight: 0.95,
                letterSpacing: '0.01em',
                color: '#FFFFFF',
                marginBottom: '1.5rem',
                textShadow: '0 4px 32px rgba(0,0,0,0.85)',
                marginLeft: "40px",
              }}
              ref={ref}
              initial={{ filter: 'blur(20px)', opacity: 0 }}
              animate={isInView ? { filter: 'blur(0px)', opacity: 1 } : {}}
              transition={{ duration: 1.2 }}
              className="text-xl sm:text-4xl font-bold tracking-tighter md:text-6xl md:leading-[4rem]"
            >
              Compound Risk,{' '}
              <span style={{ display: 'block' }}>Caught Before It</span>
              <span style={{ display: 'block' }}>Compounds.</span>
            </motion.h1>
          </div>

          {/* Subline */}
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1.05rem',
              fontWeight: 300,
              lineHeight: 1.7,
              color: '#afafafff',
              maxWidth: '440px',
              marginBottom: '2.5rem',
              textShadow: '0 2px 16px rgba(0,0,0,0.8)',
              marginLeft: "40px",
            }}
          >
            Detect unrelated signals across sensors and systems —
            permitting, operations, CCTV, behaviour — and fuse them into
            actionable compound risk in real time.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginLeft: "40px" }}>
            <Link
              to="/simulation"
              style={{
                fontFamily: "'Titillium Web', sans-serif",
                fontWeight: 700,
                fontSize: '0.8rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                background: '#4a6741',
                color: '#ffffff',
                padding: '14px 32px',
                borderRadius: '3px',
                clipPath: 'polygon(0 0, 92% 0, 100% 100%, 0% 100%)',
                textDecoration: 'none',
                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: '0 4px 16px rgba(74,103,65,0.4)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#587a4d'
                e.currentTarget.style.transform = 'scale(1.05) translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(74,103,65,0.6)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#4a6741'
                e.currentTarget.style.transform = 'scale(1) translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(74,103,65,0.4)'
              }}
            >
              ENTER LIVE SIMULATION
            </Link>
          </div>


          {/* Small stats row using Golden Ratio split */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              marginTop: '3rem',
              paddingTop: '2rem',
              borderTop: '1px solid rgba(255,255,255,0.25)',
              maxWidth: '440px',
              marginLeft: '40px',
            }}
          >
            {[
              { value: '1,284', label: 'Live pipeline snapshots' },
              { value: '1.8s', label: 'Avg. first-audio latency' },
              { value: '54', label: 'Cases resolved today' },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div
                  style={{
                    width: '61.8%',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.75rem',
                    fontWeight: 400,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    width: '38.2%',
                    textAlign: 'right',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: '#c8f542',
                    textShadow: '0 0 10px rgba(200,245,66,0.3)',
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>





        {/* Responsive: stack floating cards under hero text on narrow viewports */}
        <style>{`
        @media (max-width: 860px) {
          .hero-float-card {
            position: static !important;
            margin-top: 1.5rem;
            max-width: 100% !important;
          }
        }
      `}</style>
      </div>
    </section>
  )
}

/* ─── Fallback hero visual if image not present ─────────────────── */
function HeroFallbackVisual({ isDark }: { isDark: boolean }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: isDark
          ? 'linear-gradient(135deg, #0d130a 0%, #111a0e 100%)'
          : 'linear-gradient(135deg, #C8D5C8 0%, #EEF0E0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
        <defs>
          <pattern id="circuit" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <path
              d="M10 40 H30 V10 H70 M50 40 H70 V70 H30 M40 10 V0 M40 70 V80"
              stroke="#FFFFFF"
              strokeWidth="1"
              fill="none"
            />
            <circle cx="30" cy="40" r="3" fill="#FFFFFF" />
            <circle cx="70" cy="40" r="3" fill="#FFFFFF" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuit)" />
      </svg>

      <svg width="160" height="100" viewBox="0 0 160 100" style={{ position: 'relative', zIndex: 1 }}>
        <path
          d="M80 15 C40 15 10 50 10 50 C10 50 40 85 80 85 C120 85 150 50 150 50 C150 50 120 15 80 15Z"
          stroke="#FFFFFF"
          strokeWidth="2"
          fill="none"
          opacity="0.8"
        />
        <circle cx="80" cy="50" r="22" stroke="#FFFFFF" strokeWidth="1.5" fill="none" opacity="0.6" />
        <circle cx="80" cy="50" r="13" stroke="#FFFFFF" strokeWidth="1" fill="none" opacity="0.4" />
        <circle cx="80" cy="50" r="6" fill="#FFFFFF" opacity="0.9" />
        <circle
          cx="80"
          cy="50"
          r="28"
          stroke="#FFFFFF"
          strokeWidth="0.5"
          fill="none"
          strokeDasharray="3 6"
          opacity="0.3"
          style={{ animation: 'rotate-slow 12s linear infinite', transformOrigin: '80px 50px' }}
        />
      </svg>
    </div>
  )
}