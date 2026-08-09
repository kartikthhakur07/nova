import { useState, useEffect, useRef } from 'react';
import { Radio, Camera, Mic, AlertCircle } from 'lucide-react';
import Footer from '../components/Footer'

const COLORS = {
    bg: '#F0F0DC',
    card: '#E4E4D0',
    border: '#C8C8B0',
    dark: '#2D4A34',
    text: '#5A5A48',
    high: '#D97A3D',
    medium: '#D9B54D',
    low: '#8A9A7E',
    live: '#3FA98A',
};

const STAGES = ['DETECT', 'CONTEXTUALIZE', 'RETRIEVE', 'REASON', 'EXPLAIN', 'ACT', 'VERIFY'];

const EVIDENCE_SOURCE = [
    { id: 1, tag: 'SCADA', icon: Radio, text: 'Pressure variance +4% \u00b7 Unit 7 pump P-204B', color: COLORS.medium },
    { id: 2, tag: 'CCTV', icon: Camera, text: 'Unscheduled entry detected \u00b7 Restricted zone A4', color: COLORS.high },
    { id: 3, tag: 'VOICE', icon: Mic, text: 'Officer Sharma responded \u00b7 permit suspended', color: COLORS.live },
    { id: 4, tag: 'PERMIT', icon: AlertCircle, text: 'Hot-work permit window closed \u00b7 Bay 3', color: COLORS.high },
];

function useTimeAgo(timestamp) {
    const [, setTick] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setTick((x) => x + 1), 1000);
        return () => clearInterval(t);
    }, []);
    const secs = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (secs < 60) return `${secs}s ago`;
    return `${Math.floor(secs / 60)}m ago`;
}

function EvidenceRow({ item, index }) {
    const timeAgo = useTimeAgo(item.arrivedAt);
    const Icon = item.icon;
    return (
        <div
            className="evidence-row"
            style={{
                animationDelay: `${index * 0.05}s`,
                borderColor: COLORS.border,
                background: COLORS.card,
            }}
        >
            <div className="evidence-tag" style={{ background: item.color }}>
                <Icon size={12} strokeWidth={2.5} />
                <span>{item.tag}</span>
            </div>
            <p style={{ color: COLORS.dark }}>{item.text}</p>
            <span className="evidence-time" style={{ color: COLORS.text }}>{timeAgo}</span>
        </div>
    );
}

function RiskPulseRing({ score, tier }) {
    const circumference = 2 * Math.PI * 88;
    const offset = circumference * (1 - score);
    const tierColor = tier === 'HIGH' ? COLORS.high : tier === 'MEDIUM' ? COLORS.medium : COLORS.low;

    return (
        <div className="ring-wrap">
            <svg viewBox="0 0 220 220" className="ring-svg">
                <circle cx="110" cy="110" r="100" fill="none" stroke={COLORS.border} strokeWidth="1" />
                {[0, 1, 2].map((i) => (
                    <circle
                        key={i}
                        cx="110"
                        cy="110"
                        r="88"
                        className="pulse-circle"
                        style={{ animationDelay: `${i * 1}s`, stroke: tierColor }}
                    />
                ))}
                <circle cx="110" cy="110" r="88" fill="none" stroke={COLORS.card} strokeWidth="10" />
                <circle
                    cx="110"
                    cy="110"
                    r="88"
                    fill="none"
                    stroke={tierColor}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform="rotate(-90 110 110)"
                    className="score-arc"
                />
            </svg>
            <div className="ring-center">
                <span className="ring-score" style={{ color: COLORS.dark }}>{score.toFixed(2)}</span>
                <span className="ring-tier" style={{ background: tierColor }}>{tier} RISK</span>
            </div>
        </div>
    );
}

export default function ConvergingSignals() {
    const [activeStage] = useState(3);
    const [evidence, setEvidence] = useState([]);
    const nextIndex = useRef(0);

    useEffect(() => {
        const addNext = () => {
            if (nextIndex.current >= EVIDENCE_SOURCE.length) {
                nextIndex.current = 0;
                setEvidence([]);
                return;
            }
            const src = EVIDENCE_SOURCE[nextIndex.current];
            setEvidence((prev) => [{ ...src, arrivedAt: Date.now() }, ...prev]);
            nextIndex.current += 1;
        };
        addNext();
        const interval = setInterval(addNext, 3200);
        return () => clearInterval(interval);
    }, []);

    const score = 0.72;
    const tier = 'HIGH';

    return (
        <>
            <div className="csv-root" style={{ background: COLORS.bg }}>
                <style>{`
        .csv-root { font-family: 'Inter', system-ui, sans-serif; min-height: 100%; padding: 24px; }
        .timeline { display: flex; align-items: center; gap: 4px; margin-bottom: 60px; overflow-x: auto; }
        .timeline-step { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .timeline-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .timeline-label { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.05em; white-space: nowrap; }
        .timeline-line { width: 24px; height: 1px; flex-shrink: 0; }
        .main-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 32px; align-items: start; }
        @media (max-width: 860px) { .main-grid { grid-template-columns: 1fr; } }
        .hero-col { display: flex; flex-direction: column; align-items: center; gap: 24px; padding-top: 12px; }
        .ring-wrap { position: relative; width: 240px; height: 240px; }
        .ring-svg { width: 100%; height: 100%; }
        .pulse-circle { fill: none; stroke-width: 1.5; opacity: 0; transform-origin: 110px 110px; animation: pulseOut 3s ease-out infinite; }
        @keyframes pulseOut {
          0% { r: 88px; opacity: 0.6; }
          100% { r: 108px; opacity: 0; }
        }
        .score-arc { transition: stroke-dashoffset 1s ease; }
        .ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; }
        .ring-score { font-family: 'JetBrains Mono', monospace; font-size: 44px; font-weight: 700; line-height: 1; }
        .ring-tier { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; color: #F0F0DC; padding: 4px 12px; border-radius: 999px; }
        .readout { width: 100%; max-width: 340px; border: 1px solid ${COLORS.border}; background: ${COLORS.card}; border-radius: 10px; padding: 18px 20px; }
        .readout-title { font-size: 10px; letter-spacing: 0.1em; color: ${COLORS.text}; margin-bottom: 6px; text-transform: uppercase; }
        .readout-formula { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: ${COLORS.dark}; line-height: 1.6; }
        .thesis { font-size: 13px; color: ${COLORS.text}; font-style: italic; text-align: center; max-width: 320px; }
        .evidence-panel { border: 1px solid ${COLORS.border}; border-radius: 10px; overflow: hidden; background: ${COLORS.bg}; }
        .evidence-header { padding: 14px 18px; border-bottom: 1px solid ${COLORS.border}; }
        .evidence-header-title { font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; font-size: 12px; color: ${COLORS.dark}; }
        .evidence-list { display: flex; flex-direction: column; max-height: 480px; overflow-y: auto; }
        .evidence-row { display: flex; flex-direction: column; gap: 6px; padding: 14px 18px; border-bottom: 1px solid; animation: rowIn 0.4s ease both; }
        @keyframes rowIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .evidence-tag { display: inline-flex; align-items: center; gap: 5px; width: fit-content; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.05em; color: #F0F0DC; padding: 3px 8px; border-radius: 4px; }
        .evidence-row p { font-size: 13px; line-height: 1.4; margin: 0; }
        .evidence-time { font-family: 'JetBrains Mono', monospace; font-size: 10px; opacity: 0.75; }
        h1.page-title { font-weight: 900; text-transform: uppercase; letter-spacing: -0.01em; font-size: 22px; color: ${COLORS.dark}; margin: 0 0 4px 0; }
        .page-sub { font-size: 12px; color: ${COLORS.text}; margin: 0 0 28px 0; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.03em; }
      `}</style>

                <h1 className="page-title">Converging Signals</h1>
                <p className="page-sub">CASE c_8f21 &mdash; LIVE CORRELATION VIEW</p>

                <div className="timeline">
                    {STAGES.map((stage, i) => (
                        <div className="timeline-step" key={stage}>
                            <div
                                className="timeline-dot"
                                style={{
                                    background: i < activeStage ? COLORS.low : i === activeStage ? COLORS.high : 'transparent',
                                    border: i > activeStage ? `1px solid ${COLORS.border}` : 'none',
                                }}
                            />
                            <span
                                className="timeline-label"
                                style={{
                                    color: i === activeStage ? COLORS.dark : i < activeStage ? COLORS.text : COLORS.border,
                                    fontWeight: i === activeStage ? 700 : 400,
                                }}
                            >
                                {stage}
                            </span>
                            {i < STAGES.length - 1 && <div className="timeline-line" style={{ background: COLORS.border }} />}
                        </div>
                    ))}
                </div>

                <div className="main-grid">
                    <div className="hero-col">
                        <RiskPulseRing score={score} tier={tier} />
                        <div className="readout">
                            <div className="readout-title">Compound Score Breakdown</div>
                            <div className="readout-formula">
                                0.72 = 4 factors correlated<br />
                                + historical boost (capped) 0.18
                            </div>
                        </div>
                        <p className="thesis">&ldquo;Individually normal. Jointly dangerous.&rdquo;</p>
                    </div>

                    <div className="evidence-panel">
                        <div className="evidence-header">
                            <span className="evidence-header-title">Evidence Panel &mdash; Live</span>
                        </div>
                        <div className="evidence-list">
                            {evidence.map((item, i) => (
                                <EvidenceRow key={item.arrivedAt} item={item} index={i} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}