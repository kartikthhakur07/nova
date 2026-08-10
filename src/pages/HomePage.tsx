import { Link } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'

export default function HomePage() {
  return (
    <div style={{ background: '#fafaf5', minHeight: '100vh', overflow: 'hidden' }}>
      <HomeNavbar />
      <HeroBlock />
      <CapabilitiesSection />
      <StatsSection />
      <HowItWorksSection />
      <CTASection />
      <HomeFooter />
    </div>
  )
}

function HomeNavbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  return (
    <nav style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 100,
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 40px',
      background: scrolled ? 'rgba(10,14,10,0.92)' : 'rgba(10,14,10,0.4)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      transition: 'all 0.35s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: '#c8f542',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4m0 14v4m-9-11h4m14 0h4" />
          </svg>
        </div>
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '1.4rem',
          color: '#ffffff',
          letterSpacing: '0.08em',
        }}>NOVA</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {['Product', 'How It Works', 'Demo', 'Contact'].map(item => (
          <a
            key={item}
            href={item === 'Demo' ? '/demo' : `#${item.toLowerCase().replace(/\s/g, '-')}`}
            style={{
              fontFamily: "'Titillium Web', sans-serif",
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.7)',
              textDecoration: 'none',
              letterSpacing: '0.04em',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#c8f542'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
          >
            {item}
          </a>
        ))}
        <Link
          to="/simulation"
          style={{
            fontFamily: "'Titillium Web', sans-serif",
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#0a0f0a',
            background: '#84ff00',
            padding: '8px 20px',
            borderRadius: '24px',
            textDecoration: 'none',
            letterSpacing: '0.04em',
            transition: 'all 0.25s ease',
            border: 'none',
            boxShadow: '0 0 16px rgba(132,255,0,0.3)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(132,255,0,0.45)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(132,255,0,0.3)' }}
        >
          ⚡ Enter Simulation
        </Link>
      </div>
    </nav>
  )
}

function HeroBlock() {
  return (
    <section id="product" style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      paddingTop: '64px',
      overflow: 'hidden',
    }}>
      <img
        src="/assets/hero-hands.png"
        alt="Robot and human hand reaching — NOVA AI Collaboration"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          filter: 'contrast(1.1) brightness(0.65) saturate(0.8)',
        }}
      />

      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, rgba(6,10,6,0.92) 0%, rgba(6,10,6,0.75) 45%, rgba(6,10,6,0.25) 100%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: '1280px', margin: '0 auto', padding: '0 40px',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '60px', alignItems: 'center',
        position: 'relative', zIndex: 2, width: '100%',
      }}>
        <div style={{ animation: 'fade-up 0.8s ease both' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(200,245,66,0.15)',
            border: '1px solid rgba(200,245,66,0.4)',
            borderRadius: '20px',
            padding: '4px 14px',
            marginBottom: '24px',
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#84ff00', animation: 'pulse-ring 2s ease-in-out infinite' }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.6rem', fontWeight: 600,
              letterSpacing: '0.12em', color: '#c8f542',
              textTransform: 'uppercase',
            }}>
              AI-POWERED SAFETY OFFICER
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(3.2rem, 5.5vw, 5.5rem)',
            lineHeight: 0.95,
            letterSpacing: '0.02em',
            color: '#ffffff',
            marginBottom: '20px',
            textShadow: '0 4px 24px rgba(0,0,0,0.8)',
          }}>
            A New Standard{' '}
            <span style={{ display: 'block' }}>of Industrial</span>
            <span style={{ display: 'block', color: '#c8f542' }}>Intelligence.</span>
          </h1>

          <p style={{
            fontFamily: "'Titillium Web', sans-serif",
            fontSize: '1.05rem',
            fontWeight: 300,
            lineHeight: 1.7,
            color: 'rgba(255,255,255,0.8)',
            maxWidth: '440px',
            marginBottom: '32px',
            textShadow: '0 2px 12px rgba(0,0,0,0.8)',
          }}>
            Nova watches your entire plant — fusing gas sensors, permits, CCTV, and maintenance logs into compound-risk intelligence. Speaking when it matters, silent when it doesn't.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              to="/simulation"
              style={{
                fontFamily: "'Titillium Web', sans-serif",
                fontWeight: 700, fontSize: '0.8rem',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                background: '#84ff00', color: '#0a0f0a',
                padding: '14px 32px', borderRadius: '6px',
                textDecoration: 'none', border: 'none',
                transition: 'all 0.25s ease',
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 0 24px rgba(132,255,0,0.4)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(132,255,0,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(132,255,0,0.4)' }}
            >
              ⚡ Enter Live Simulation
            </Link>

            <Link
              to="/demo"
              style={{
                fontFamily: "'Titillium Web', sans-serif",
                fontWeight: 700, fontSize: '0.8rem',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                background: 'rgba(200,245,66,0.15)', color: '#c8f542',
                padding: '14px 28px', borderRadius: '6px',
                textDecoration: 'none', border: '1px solid rgba(200,245,66,0.3)',
                transition: 'all 0.25s ease',
                display: 'inline-flex', alignItems: 'center', gap: '8px',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'rgba(200,245,66,0.25)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(200,245,66,0.15)' }}
            >
              Scripted Demo
            </Link>
          </div>

          <div style={{
            display: 'flex', gap: '40px', marginTop: '48px',
            paddingTop: '28px', borderTop: '1px solid rgba(255,255,255,0.15)',
          }}>
            {[
              { num: '40+', label: 'Sensor Streams' },
              { num: '1.8s', label: 'Response Time' },
              { num: '< 3%', label: 'False Positive Rate' },
            ].map(s => (
              <div key={s.label}>
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '2.2rem', color: '#ffffff',
                  lineHeight: 1,
                  textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                }}>{s.num}</div>
                <div style={{
                  fontFamily: "'Titillium Web', sans-serif",
                  fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginTop: '4px',
                }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', animation: 'fade-up 0.8s ease 0.2s both' }}>
          <div style={{
            background: 'rgba(10,15,10,0.85)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(16px)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              background: 'rgba(132,255,0,0.03)',
              borderRadius: '10px',
              border: '1px solid rgba(132,255,0,0.15)',
              padding: '20px',
              marginBottom: '16px',
            }}>
              <svg width="100%" height="180" viewBox="0 0 400 180">
                {[
                  { x: 10, y: 10, w: 120, h: 60, label: 'Bay 1', risk: 'low' },
                  { x: 140, y: 10, w: 120, h: 60, label: 'Bay 2', risk: 'low' },
                  { x: 270, y: 10, w: 120, h: 60, label: 'Bay 3', risk: 'high' },
                  { x: 10, y: 80, w: 120, h: 60, label: 'Bay 4', risk: 'low' },
                  { x: 140, y: 80, w: 250, h: 60, label: 'Bay 5', risk: 'medium' },
                  { x: 10, y: 150, w: 380, h: 24, label: 'Utility Corridor', risk: 'low' },
                ].map((z, i) => (
                  <g key={i}>
                    <rect
                      x={z.x} y={z.y} width={z.w} height={z.h}
                      fill={z.risk === 'high' ? 'rgba(249,115,22,0.2)' : z.risk === 'medium' ? 'rgba(251,191,36,0.1)' : 'rgba(132,255,0,0.06)'}
                      stroke={z.risk === 'high' ? 'rgba(249,115,22,0.6)' : z.risk === 'medium' ? 'rgba(251,191,36,0.3)' : 'rgba(132,255,0,0.15)'}
                      strokeWidth="1" rx="3"
                    />
                    <text x={z.x + 8} y={z.y + 16} fontFamily="'JetBrains Mono', monospace" fontSize="8" fill="rgba(255,255,255,0.4)">{z.label}</text>
                    {z.risk === 'high' && (
                      <circle cx={z.x + z.w - 12} cy={z.y + 12} r="4" fill="#ff6b35">
                        <animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                    )}
                  </g>
                ))}
              </svg>
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#84ff00', boxShadow: '0 0 8px rgba(132,255,0,0.5)', animation: 'pulse-ring 2s ease-in-out infinite' }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: '#84ff00', letterSpacing: '0.1em' }}>
                  NOVA MONITORING
                </span>
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)' }}>
                5 BAYS · 12 SENSORS
              </span>
            </div>
          </div>

          <div style={{
            position: 'absolute', top: -20, right: -20,
            background: '#c8f542', borderRadius: '12px',
            padding: '14px 18px', boxShadow: '0 8px 24px rgba(200,245,66,0.3)',
            animation: 'float 4s ease-in-out infinite',
          }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem', color: '#1a1a1a', lineHeight: 1 }}>5</div>
            <div style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: '0.55rem', color: '#333', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Agent<br/>Systems</div>
          </div>

          <div style={{
            position: 'absolute', bottom: -16, left: -16,
            background: 'rgba(255,255,255,0.95)', borderRadius: '12px',
            padding: '12px 16px', boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
            border: '1px solid rgba(0,0,0,0.06)',
            display: 'flex', alignItems: 'center', gap: '10px',
            animation: 'float 5s ease-in-out 1s infinite',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #c8f542, #84ff00)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: '0.7rem', fontWeight: 700, color: '#1a1a1a' }}>Voice Active</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.5rem', color: '#666' }}>Always listening</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CapabilitiesSection() {
  const cards = [
    {
      icon: '◈',
      title: 'What We Do',
      desc: 'We correlate seemingly unrelated signals — gas sensors, work permits, CCTV, shift data — into a single compound-risk picture that no human could assemble in time.',
      accent: false,
    },
    {
      icon: '◉',
      title: 'Our Impact',
      desc: 'We work with both field operators and safety officers to create real-time intelligence that makes an impact. Catch compound risks before they compound.',
      accent: true,
    },
    {
      icon: '◎',
      title: 'Core Values',
      desc: 'We prioritize auditability, human-in-the-loop authorization, and transparent AI reasoning. Every decision is logged, every action is traceable.',
      accent: false,
    },
  ]

  return (
    <section style={{
      background: '#fafaf5',
      padding: '100px 0 80px',
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 40px' }}>
        <div style={{ marginBottom: '60px' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.6rem', letterSpacing: '0.16em',
            color: '#4a6741', textTransform: 'uppercase',
            marginBottom: '12px',
          }}>
            COMPOUND-RISK INTELLIGENCE
          </div>
          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
            color: '#1a1a1a', lineHeight: 1,
            maxWidth: '600px',
          }}>
            We developed landmark<br />industrial safety intelligence
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0',
        }}>
          {cards.map((card, i) => (
            <div
              key={i}
              style={{
                background: card.accent ? '#c8f542' : '#fff',
                padding: '40px 32px',
                border: card.accent ? 'none' : '1px solid rgba(0,0,0,0.06)',
                borderRadius: i === 0 ? '12px 0 0 12px' : i === 2 ? '0 12px 12px 0' : '0',
                transition: 'transform 0.3s ease',
              }}
            >
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '1.8rem', marginBottom: '16px',
                color: card.accent ? '#1a1a1a' : '#4a6741',
              }}>{card.icon}</div>
              <h3 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '1.6rem', color: card.accent ? '#1a1a1a' : '#1a1a1a',
                letterSpacing: '0.04em', marginBottom: '12px',
              }}>{card.title}</h3>
              <p style={{
                fontFamily: "'Titillium Web', sans-serif",
                fontSize: '0.82rem', fontWeight: 300,
                color: card.accent ? '#333' : '#777',
                lineHeight: 1.7,
              }}>{card.desc}</p>
              <div style={{ marginTop: '20px' }}>
                <a
                  href="#"
                  style={{
                    fontFamily: "'Titillium Web', sans-serif",
                    fontSize: '0.72rem', fontWeight: 600,
                    color: card.accent ? '#1a1a1a' : '#4a6741',
                    textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                  }}
                >
                  Learn More →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function StatsSection() {
  return (
    <section style={{
      background: '#1a1a1a',
      padding: '80px 0',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 800, height: 400,
        background: 'radial-gradient(ellipse, rgba(200,245,66,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 40px', position: 'relative', zIndex: 2 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0', textAlign: 'center',
        }}>
          {[
            { num: '52+', label: 'Projects in\nDevelopment', color: '#c8f542' },
            { num: '2.3b+', label: 'Total Projects\nCost', color: '#fff' },
            { num: '48+', label: 'Completed\nProjects', color: '#c8f542' },
            { num: '18m+', label: 'Data Points\nProcessed', color: '#fff' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '32px 20px',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none',
            }}>
              <CountUpNumber target={s.num} color={s.color} />
              <div style={{
                fontFamily: "'Titillium Web', sans-serif",
                fontSize: '0.7rem', fontWeight: 300,
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginTop: '8px', whiteSpace: 'pre-line',
              }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CountUpNumber({ target, color }: { target: string; color: string }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true)
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} style={{
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: '3.5rem', color,
      lineHeight: 1,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 0.6s ease',
    }}>
      {target}
    </div>
  )
}

function HowItWorksSection() {
  const steps = [
    { num: '01', title: 'Detect & Correlate', desc: 'Real-time sensor fusion across gas, pressure, CCTV, and permit systems. Nova watches everything simultaneously.' },
    { num: '02', title: 'Retrieve & Remember', desc: 'Qdrant-powered semantic memory recalls similar historical incidents to contextualize current readings.' },
    { num: '03', title: 'Reason & Explain', desc: 'Multi-agent reasoning computes compound risk scores with full evidence chains — no black boxes.' },
    { num: '04', title: 'Act & Verify', desc: 'Voice-driven authorization for safety actions. Every decision auditable, every action logged immutably.' },
  ]

  return (
    <section id="how-it-works" style={{ background: '#fafaf5', padding: '100px 0' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.6rem', letterSpacing: '0.16em',
            color: '#4a6741', textTransform: 'uppercase', marginBottom: '12px',
          }}>
            THE PIPELINE
          </div>
          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
            color: '#1a1a1a', lineHeight: 1,
          }}>
            How Nova Reasons
          </h2>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '24px',
        }}>
          {steps.map((step, i) => (
            <div
              key={i}
              style={{
                padding: '32px 24px',
                background: '#fff',
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.06)',
                transition: 'all 0.3s ease',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '2.8rem', color: '#c8f542', lineHeight: 1,
                marginBottom: '12px',
              }}>{step.num}</div>
              <h3 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '1.3rem', color: '#1a1a1a',
                letterSpacing: '0.04em', marginBottom: '10px',
              }}>{step.title}</h3>
              <p style={{
                fontFamily: "'Titillium Web', sans-serif",
                fontSize: '0.78rem', fontWeight: 300,
                color: '#888', lineHeight: 1.6,
              }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section style={{
      background: 'linear-gradient(135deg, #c8f542, #a8e010)',
      padding: '80px 0',
    }}>
      <div style={{
        maxWidth: '800px', margin: '0 auto', padding: '0 40px',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
          color: '#1a1a1a', lineHeight: 1,
          marginBottom: '16px',
        }}>
          See Nova In Action
        </h2>
        <p style={{
          fontFamily: "'Titillium Web', sans-serif",
          fontSize: '1rem', fontWeight: 300,
          color: '#333', lineHeight: 1.6,
          marginBottom: '32px',
        }}>
          Experience the agent-piloted control room. Watch Nova detect, analyze, and guide you through a compound risk scenario — hands-free.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link
            to="/simulation"
            style={{
              fontFamily: "'Titillium Web', sans-serif",
              fontWeight: 700, fontSize: '0.85rem',
              letterSpacing: '0.06em', textTransform: 'uppercase',
              background: '#1a1a1a', color: '#84ff00',
              padding: '16px 40px', borderRadius: '50px',
              textDecoration: 'none', border: 'none',
              transition: 'all 0.3s ease',
              display: 'inline-block',
              boxShadow: '0 0 20px rgba(0,0,0,0.2)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)'
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0,0,0,0.2)'
            }}
          >
            ⚡ Launch Live Simulation →
          </Link>
          <Link
            to="/demo"
            style={{
              fontFamily: "'Titillium Web', sans-serif",
              fontWeight: 700, fontSize: '0.85rem',
              letterSpacing: '0.06em', textTransform: 'uppercase',
              background: 'rgba(26,26,26,0.1)', color: '#1a1a1a',
              padding: '16px 40px', borderRadius: '50px',
              textDecoration: 'none', border: '1px solid rgba(26,26,26,0.3)',
              transition: 'all 0.3s ease',
              display: 'inline-block',
            }}
          >
            Scripted Demo Mode
          </Link>
        </div>
      </div>
    </section>
  )
}

function HomeFooter() {
  return (
    <footer id="contact" style={{
      background: '#1a1a1a', padding: '60px 0 24px',
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 40px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: '40px', marginBottom: '48px', paddingBottom: '40px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '1.5rem', color: '#fff',
              letterSpacing: '0.08em', marginBottom: '12px',
            }}>NOVA</div>
            <p style={{
              fontFamily: "'Titillium Web', sans-serif",
              fontSize: '0.78rem', fontWeight: 300,
              color: 'rgba(255,255,255,0.4)', lineHeight: 1.6,
              maxWidth: '280px',
            }}>
              AI-powered compound-risk intelligence for industrial safety. The voice that notices what no single sensor can.
            </p>
          </div>
          {[
            { title: 'Product', links: ['Risk Overview', 'Signals', 'Voice Agent', 'Audit Trail'] },
            { title: 'Pipeline', links: ['Detect', 'Retrieve', 'Reason', 'Act'] },
            { title: 'Trust', links: ['Audit Logs', 'Mission', 'Terms'] },
          ].map(col => (
            <div key={col.title}>
              <div style={{
                fontFamily: "'Titillium Web', sans-serif",
                fontSize: '0.65rem', fontWeight: 700,
                color: 'rgba(255,255,255,0.3)',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                marginBottom: '16px',
              }}>{col.title}</div>
              {col.links.map(l => (
                <div key={l} style={{ marginBottom: '8px' }}>
                  <a href="#" style={{
                    fontFamily: "'Titillium Web', sans-serif",
                    fontSize: '0.75rem', fontWeight: 300,
                    color: 'rgba(255,255,255,0.5)',
                    textDecoration: 'none', transition: 'color 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = '#c8f542'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                  >{l}</a>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)',
          }}>
            © 2026 NOVA · StarForge Hackathon
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#84ff00', boxShadow: '0 0 6px rgba(132,255,0,0.5)' }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.55rem', color: '#84ff00', letterSpacing: '0.1em',
            }}>SYSTEM OPERATIONAL</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
