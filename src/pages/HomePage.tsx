import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import heroHandsImg from '../assets/hero-hands.png'

export default function HomePage() {
  return (
    <div style={{ background: '#fafaf5', minHeight: '100vh', overflowX: 'hidden' }}>
      <HomeNavbar />
      <HeroBlock />
      <ProblemSection />
      <ApproachSection />
      <CapabilitiesSection />
      <CTASection />
      <HomeFooter />
    </div>
  )
}

/**
 * Scroll Reveal Hook using IntersectionObserver
 */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.12 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
}

function HomeNavbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
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
      background: scrolled ? 'rgba(12,16,12,0.92)' : 'rgba(12,16,12,0.25)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      transition: 'all 0.35s ease',
    }}>
      {/* Brand Logo matching screenshot layout */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c8f542" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4m0 14v4m-9-11h4m14 0h4" />
          </svg>
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '1.5rem',
            color: '#ffffff',
            letterSpacing: '0.1em',
            lineHeight: 1,
          }}>
            NOVA
          </span>
        </div>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.42rem',
          color: 'rgba(255,255,255,0.5)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginTop: '2px',
        }}>
          THE VOICE THAT NOTICES WHAT NO SINGLE SENSOR CAN.
        </span>
      </div>

      {/* Navigation Links & Live Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {[
          { label: 'PRODUCT', href: '#product' },
          { label: 'APPROACH', href: '#approach' },
          { label: 'CAPABILITIES', href: '#capabilities' },
          { label: 'CONTACT', href: '#contact' },
        ].map(item => (
          <a
            key={item.label}
            href={item.href}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.65rem',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.75)',
              textDecoration: 'none',
              letterSpacing: '0.12em',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#c8f542'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.75)'}
          >
            {item.label}
          </a>
        ))}

        {/* Live Status Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '4px',
          padding: '3px 8px',
        }}>
          <div style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: '#c8f542',
            boxShadow: '0 0 6px #c8f542',
            animation: 'pulse-ring 2s ease-in-out infinite',
          }} />
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.5rem',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '0.12em',
          }}>
            LIVE
          </span>
        </div>
      </div>
    </nav>
  )
}

/**
 * Hero Block (First Screen) — Exact Dark to Light gradient theme matching user uploaded picture
 */
function HeroBlock() {
  return (
    <section id="product" style={{
      position: 'relative',
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      paddingTop: '64px',
      overflow: 'hidden',
      background: 'linear-gradient(110deg, #161816 0%, #2a2e2a 45%, #6a706a 85%, #888e88 100%)',
    }}>
      {/* Robot + Human Hands Background Image */}
      <img
        src={heroHandsImg}
        alt="Robot and Human Hands Touching — NOVA AI Safety Intelligence"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
          opacity: 0.9,
          filter: 'contrast(1.12) brightness(0.9) grayscale(100%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* Dark-to-Light gradient scrim matching target image: dark left (for text contrast), lighter soft silver right */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 85% 25%, rgba(220,225,220,0.3) 0%, transparent 55%), linear-gradient(90deg, rgba(14,16,14,0.65) 0%, rgba(20,24,20,0.42) 40%, rgba(130,136,130,0.1) 85%, rgba(160,165,160,0.2) 100%)',
        zIndex: 2,
        pointerEvents: 'none',
      }} />

      {/* Grid Pattern Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
        zIndex: 2,
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: '1280px',
        width: '100%',
        margin: '0 auto',
        padding: '0 40px',
        position: 'relative',
        zIndex: 3,
      }}>
        <div style={{ maxWidth: '620px', animation: 'fade-up 0.8s ease both' }}>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(2.4rem, 4.2vw, 4.2rem)',
            lineHeight: 0.98,
            letterSpacing: '0.04em',
            color: '#ffffff',
            marginBottom: '20px',
            textShadow: '0 4px 20px rgba(0,0,0,0.85), 0 1px 4px rgba(0,0,0,0.9)',
          }}>
            COMPOUND RISK,
            <span style={{ display: 'block' }}>CAUGHT BEFORE IT</span>
            <span style={{ display: 'block' }}>COMPOUNDS.</span>
          </h1>

          <p style={{
            fontFamily: "'Titillium Web', sans-serif",
            fontSize: '0.95rem',
            fontWeight: 400,
            lineHeight: 1.55,
            color: 'rgba(255,255,255,0.95)',
            marginBottom: '32px',
            maxWidth: '520px',
            textShadow: '0 2px 12px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.95)',
          }}>
            Detect unrelated signals across sensors and systems — permitting, operations, CCTV, behaviour — and fuse them into actionable compound risk in real time.
          </p>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <Link
              to="/demo"
              style={{
                fontFamily: "'Titillium Web', sans-serif",
                fontWeight: 700,
                fontSize: '0.8rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                background: '#4a6741',
                color: '#ffffff',
                padding: '14px 32px',
                borderRadius: '3px',
                clipPath: 'polygon(0 0, 92% 0, 100% 100%, 0% 100%)',
                textDecoration: 'none',
                transition: 'all 0.25s ease',
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#587a4d'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#4a6741'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              SEE IT IN ACTION
            </Link>

            <a
              href="#approach"
              style={{
                fontFamily: "'Titillium Web', sans-serif",
                fontWeight: 700,
                fontSize: '0.8rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                background: '#73787c',
                color: '#ffffff',
                padding: '14px 32px',
                borderRadius: '3px',
                clipPath: 'polygon(0 0, 92% 0, 100% 100%, 0% 100%)',
                textDecoration: 'none',
                transition: 'all 0.25s ease',
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#858b90'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#73787c'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              HOW NOVA WORKS
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function ProblemSection() {
  const { ref, isVisible } = useScrollReveal()

  const isolatedSignals = [
    {
      title: 'GAS SENSOR',
      reading: '+8% H₂S Above Baseline',
      verdict: 'Individually Unremarkable',
      desc: 'Not high enough to breach a single-sensor SCADA threshold alarm.',
      tag: 'SENSOR SCADA',
    },
    {
      title: 'PERMIT TO WORK',
      reading: 'Hot-Work Welding Active',
      verdict: 'Routine Paperwork',
      desc: 'Authorized permit PTW-0441 active in Bay 3 compressor zone.',
      tag: 'PERMIT SYSTEM',
    },
    {
      title: 'MAINTENANCE LOG',
      reading: 'Thermal Drift Flag',
      verdict: 'Logbook Footnote',
      desc: 'Compressor C-14 seal inspection logged two hours prior.',
      tag: 'CMMS LOG',
    },
    {
      title: 'SHIFT ROSTER',
      reading: 'Handover in 20 Mins',
      verdict: 'Scheduling Event',
      desc: 'Supervisory shift changeover scheduled across facility.',
      tag: 'SHIFT ROSTER',
    },
  ]

  return (
    <section ref={ref} style={{
      background: '#fafaf5',
      padding: '80px 0',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
      transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 40px' }}>
        <div style={{ marginBottom: '48px' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.6rem',
            letterSpacing: '0.14em',
            color: '#4a6741',
            fontWeight: 700,
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            THE SYSTEMIC INDUSTRIAL GAP
          </div>
          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)',
            color: '#1a1a1a',
            lineHeight: 0.95,
            maxWidth: '640px',
          }}>
            Industrial Disasters Don't Start With Single Alarms
          </h2>
          <p style={{
            fontFamily: "'Titillium Web', sans-serif",
            fontSize: '0.95rem',
            fontWeight: 300,
            color: '#555',
            lineHeight: 1.6,
            maxWidth: '780px',
            marginTop: '12px',
          }}>
            DGFASLI recorded over 6,500 fatal workplace accidents in India in FY2023. In January 2025 at the Visakhapatnam Steel Plant, eight workers died in a coke oven explosion despite functioning gas detectors, permit controls, and SCADA. The warning signals existed — but no intelligence connected them in time. A FICCI survey found that over 60 percent of industrial facilities rely on manual handoffs between isolated safety tools.
          </p>
        </div>

        {/* 4 Isolated Signal Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
        }}>
          {isolatedSignals.map((sig, idx) => (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: '6px',
                padding: '24px 20px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                transition: 'all 0.3s ease',
                borderLeft: '4px solid #4a6741',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-5px)'
                e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.08)'
                e.currentTarget.style.borderColor = '#4a6741'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.03)'
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'
              }}
            >
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.52rem',
                color: '#4a6741',
                fontWeight: 700,
                letterSpacing: '0.1em',
                marginBottom: '10px',
              }}>
                {sig.tag}
              </div>
              <h3 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '1.3rem',
                color: '#1a1a1a',
                letterSpacing: '0.04em',
                marginBottom: '6px',
              }}>
                {sig.title}
              </h3>
              <div style={{
                fontFamily: "'Titillium Web', sans-serif",
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#d97706',
                marginBottom: '4px',
              }}>
                {sig.reading}
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.6rem',
                color: '#888',
                marginBottom: '10px',
              }}>
                Verdict: {sig.verdict}
              </div>
              <p style={{
                fontFamily: "'Titillium Web', sans-serif",
                fontSize: '0.75rem',
                fontWeight: 300,
                color: '#666',
                lineHeight: 1.45,
              }}>
                {sig.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ApproachSection() {
  const { ref, isVisible } = useScrollReveal()

  const steps = [
    { num: '01', title: 'DETECT & CONTEXTUALIZE', desc: 'Continuous stream ingestion across SCADA, permits, CCTV, and maintenance logs inside a rolling time window per bay.' },
    { num: '02', title: 'RETRIEVE MEMORY', desc: 'Searching Qdrant vector memory for matching historical near-misses and organizational precedents.' },
    { num: '03', title: 'REASON & EXPLAIN', desc: 'Computing compound risk via auditable, deterministic arithmetic and structuring transparent evidence chains.' },
    { num: '04', title: 'PROACTIVE VOICE RECOMMENDATION', desc: 'Initiating hands-free voice calls to safety officers structured as state -> evidence -> ask.' },
    { num: '05', title: 'AUTHORIZE & ACT', desc: 'Single human confirmation gate before executing typed safety tools with immutable audit logging.' },
    { num: '06', title: 'COMPOUNDING MEMORY', desc: 'Embedding resolved incidents back into Qdrant memory so the next incident is caught faster.' },
  ]

  return (
    <section id="approach" ref={ref} style={{
      background: '#080c08',
      padding: '80px 0',
      color: '#ffffff',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
      transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 40px' }}>
        <div style={{ marginBottom: '48px' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.6rem',
            letterSpacing: '0.14em',
            color: '#c8f542',
            fontWeight: 700,
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            THE STANDING AGENTIC PIPELINE
          </div>
          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)',
            color: '#ffffff',
            lineHeight: 0.95,
          }}>
            How Nova Reasons and Operates
          </h2>
          <p style={{
            fontFamily: "'Titillium Web', sans-serif",
            fontSize: '0.95rem',
            fontWeight: 300,
            color: 'rgba(255,255,255,0.65)',
            maxWidth: '640px',
            marginTop: '12px',
          }}>
            NOVA runs a continuous autonomous loop over live operational data. It speaks up the moment an otherwise invisible combination of facts becomes dangerous.
          </p>
        </div>

        {/* 6 Cards Grid (3x2) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
        }}>
          {steps.map((step, idx) => (
            <div
              key={idx}
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                border: '1px solid rgba(200,245,66,0.25)',
                borderRadius: '8px',
                padding: '24px 20px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                borderTop: '3px solid #c8f542',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-5px)'
                e.currentTarget.style.borderColor = '#c8f542'
                e.currentTarget.style.boxShadow = '0 10px 28px rgba(200,245,66,0.15)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'rgba(200,245,66,0.25)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)'
              }}
            >
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '2.2rem',
                color: '#c8f542',
                lineHeight: 1,
                marginBottom: '6px',
              }}>
                {step.num}
              </div>
              <h3 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '1.25rem',
                color: '#ffffff',
                letterSpacing: '0.04em',
                marginBottom: '8px',
              }}>
                {step.title}
              </h3>
              <p style={{
                fontFamily: "'Titillium Web', sans-serif",
                fontSize: '0.78rem',
                fontWeight: 300,
                color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.5,
              }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CapabilitiesSection() {
  const { ref, isVisible } = useScrollReveal()

  const capabilities = [
    {
      title: 'COMPOUND-RISK REASONING',
      why: 'Standing correlation loop that initiates contact proactively, not a chatbot waiting to be asked.',
    },
    {
      title: 'TEMPORAL CORRELATION',
      why: 'Multi-signal stateful reasoning across rolling time windows, not single-snapshot retrieval calls.',
    },
    {
      title: 'DECISION-DRIVING RETRIEVAL',
      why: 'Qdrant vector similarity score directly inputs into compound risk arithmetic, altering decision tiers.',
    },
    {
      title: 'COMPOUNDING ORGANIZATIONAL MEMORY',
      why: 'Every resolved incident writes back into memory, strengthening subsequent detections in real time.',
    },
    {
      title: 'INTERRUPTION-SAFE VOICE (BARGE-IN)',
      why: 'Native interruption-state stack preventing conversation loss when interrupted mid-sentence.',
    },
    {
      title: 'DETERMINISTIC SAFETY ARCHITECTURE',
      why: 'Strict human authorization gate — the reasoning layer proposes, it never executes unilaterally.',
    },
  ]

  return (
    <section id="capabilities" ref={ref} style={{
      background: '#fafaf5',
      padding: '80px 0',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
      transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 40px' }}>
        <div style={{ marginBottom: '48px' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.6rem',
            letterSpacing: '0.14em',
            color: '#4a6741',
            fontWeight: 700,
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            CAPABILITIES & ADVANTAGES
          </div>
          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)',
            color: '#1a1a1a',
            lineHeight: 0.95,
          }}>
            Why Generic Chatbots & Dashboards Fail
          </h2>
          <p style={{
            fontFamily: "'Titillium Web', sans-serif",
            fontSize: '0.95rem',
            fontWeight: 300,
            color: '#555',
            lineHeight: 1.6,
            maxWidth: '640px',
            marginTop: '12px',
          }}>
            Workers in hazardous industrial zones wear PPE and operate heavy machinery. They cannot safely stop to read screens or type prompts into chatbots.
          </p>
        </div>

        {/* 6 Cards Grid (3x2) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
        }}>
          {capabilities.map((cap, idx) => (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: '8px',
                padding: '28px 24px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                transition: 'all 0.3s ease',
                borderTop: '3px solid #4a6741',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-5px)'
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.08)'
                e.currentTarget.style.borderColor = '#4a6741'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.03)'
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'
              }}
            >
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '1.25rem',
                color: '#1a1a1a',
                letterSpacing: '0.04em',
                marginBottom: '10px',
              }}>
                {cap.title}
              </div>
              <p style={{
                fontFamily: "'Titillium Web', sans-serif",
                fontSize: '0.8rem',
                fontWeight: 300,
                color: '#666',
                lineHeight: 1.55,
              }}>
                {cap.why}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  const { ref, isVisible } = useScrollReveal()

  return (
    <section ref={ref} style={{
      background: 'linear-gradient(135deg, #141c14 0%, #080c08 100%)',
      padding: '80px 0',
      color: '#ffffff',
      borderTop: '1px solid rgba(200,245,66,0.2)',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
      transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '0 40px',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.6rem',
          letterSpacing: '0.14em',
          color: '#c8f542',
          fontWeight: 700,
          textTransform: 'uppercase',
          marginBottom: '10px',
        }}>
          EXPERIENCE AGENT-PILOTED SAFETY
        </div>
        <h2 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(2.4rem, 4vw, 3.6rem)',
          color: '#ffffff',
          lineHeight: 0.95,
          marginBottom: '16px',
        }}>
          Experience Nova in Action
        </h2>
        <p style={{
          fontFamily: "'Titillium Web', sans-serif",
          fontSize: '0.95rem',
          fontWeight: 300,
          color: 'rgba(255,255,255,0.7)',
          lineHeight: 1.55,
          marginBottom: '32px',
        }}>
          Select Scripted Demo Mode to experience the full 6-phase detection-to-resolution sequence, or Enter Live Simulation to converse with Nova against an unscripted telemetry stream.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link
            to="/demo"
            style={{
              fontFamily: "'Titillium Web', sans-serif",
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: '#4a6741',
              color: '#ffffff',
              padding: '14px 32px',
              borderRadius: '3px',
              clipPath: 'polygon(0 0, 92% 0, 100% 100%, 0% 100%)',
              textDecoration: 'none',
              transition: 'all 0.25s ease',
              boxShadow: '0 4px 16px rgba(74,103,65,0.4)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#587a4d'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#4a6741'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            SEE IT IN ACTION
          </Link>

          <Link
            to="/simulation"
            style={{
              fontFamily: "'Titillium Web', sans-serif",
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: '#73787c',
              color: '#ffffff',
              padding: '14px 32px',
              borderRadius: '3px',
              clipPath: 'polygon(0 0, 92% 0, 100% 100%, 0% 100%)',
              textDecoration: 'none',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#858b90'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#73787c'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            ENTER LIVE SIMULATION
          </Link>
        </div>
      </div>
    </section>
  )
}

function HomeFooter() {
  return (
    <footer id="contact" style={{
      background: '#060a06',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      padding: '50px 0 24px',
      color: 'rgba(255,255,255,0.6)',
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 40px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: '36px',
          paddingBottom: '36px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          marginBottom: '28px',
        }}>
          <div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '1.6rem',
              color: '#ffffff',
              letterSpacing: '0.08em',
              marginBottom: '6px',
            }}>
              NOVA
            </div>
            <p style={{
              fontFamily: "'Titillium Web', sans-serif",
              fontSize: '0.75rem',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.5,
              maxWidth: '280px',
            }}>
              Agentic industrial safety intelligence system fusing gas sensors, permit logs, maintenance records, and CCTV into compound risk intelligence.
            </p>
          </div>

          {[
            { title: 'PRODUCT', links: ['Risk Reasoner', 'Signals', 'Audit Trail', 'Qdrant Memory'] },
            { title: 'PIPELINE', links: ['Detect', 'Retrieve', 'Reason', 'Authorize'] },
            { title: 'COMPLIANCE', links: ['MIT License', 'Safety Policy', 'Limitations', 'Architecture'] },
          ].map(col => (
            <div key={col.title}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.55rem',
                fontWeight: 700,
                color: '#c8f542',
                letterSpacing: '0.12em',
                marginBottom: '12px',
              }}>
                {col.title}
              </div>
              {col.links.map(l => (
                <div key={l} style={{ marginBottom: '6px' }}>
                  <a
                    href="#"
                    style={{
                      fontFamily: "'Titillium Web', sans-serif",
                      fontSize: '0.72rem',
                      fontWeight: 300,
                      color: 'rgba(255,255,255,0.5)',
                      textDecoration: 'none',
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#c8f542'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                  >
                    {l}
                  </a>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.52rem',
            color: 'rgba(255,255,255,0.3)',
          }}>
            Built by team .bin under VoxForge track @ StarForge 2026
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#c8f542',
              boxShadow: '0 0 5px #c8f542',
            }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.52rem',
              color: '#c8f542',
              letterSpacing: '0.1em',
              fontWeight: 700,
            }}>
              SYSTEM OPERATIONAL
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
