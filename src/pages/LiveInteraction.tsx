import React, { useState, useEffect, useRef } from 'react';
import { Mic, AlertTriangle } from 'lucide-react';
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

const TRANSCRIPT = [
    { speaker: 'vigil', text: 'Unit 7 pump P-204B pressure variance plus four percent, correlated with restricted-zone entry at A4.', t: '00:00' },
    { speaker: 'officer', text: 'Copy that. Checking the permit board now.', t: '00:04' },
    { speaker: 'vigil', text: 'Note \u2014 the hot-work permit for Bay 3 closed six minutes ago. No active clearance for that zone.', t: '00:08' },
    { speaker: 'officer', text: 'Wait, hold on\u2014', t: '00:13' },
    { speaker: 'vigil', text: '\u2014 pausing.', t: '00:13' },
    { speaker: 'officer', text: 'I need the last incident on this pump, not the permit.', t: '00:16' },
    { speaker: 'vigil', text: 'Understood. Pulling nearest historical match now \u2014 March 14th, same pump, unresolved handover gap.', t: '00:19' },
    { speaker: 'officer', text: 'Suspending permit, dispatching to A4.', t: '00:25' },
];

const LATENCY_STAGES = [
    { key: 'threshold', label: 'Threshold Crossed', t: '00:00.000', color: COLORS.medium },
    { key: 'first_audio', label: 'First Audio', t: '00:01.840', color: COLORS.live },
    { key: 'interruption', label: 'Interruption Detected', t: '00:13.120', color: COLORS.high },
    { key: 'resumed', label: 'Resumed', t: '00:16.300', color: COLORS.low },
];

function useWaveform(active) {
    const [bars, setBars] = useState(Array.from({ length: 48 }, () => 4));
    useEffect(() => {
        const interval = setInterval(() => {
            setBars((prev) =>
                prev.map(() => (active ? 6 + Math.random() * 52 : 3 + Math.random() * 6))
            );
        }, 120);
        return () => clearInterval(interval);
    }, [active]);
    return bars;
}

function Waveform({ active }) {
    const bars = useWaveform(active);
    return (
        <div className="waveform">
            {bars.map((h, i) => (
                <div
                    key={i}
                    className="wave-bar"
                    style={{
                        height: `${h}px`,
                        background: active ? COLORS.live : COLORS.border,
                    }}
                />
            ))}
        </div>
    );
}

function LatencyHUD({ stages }) {
    return (
        <div className="latency-hud">
            {stages.map((s, i) => (
                <React.Fragment key={s.key}>
                    <div className="latency-stage">
                        <span className="latency-dot" style={{ background: s.color }} />
                        <span className="latency-label">{s.label}</span>
                        <span className="latency-time">{s.t}</span>
                    </div>
                    {i < stages.length - 1 && <div className="latency-divider" />}
                </React.Fragment>
            ))}
        </div>
    );
}

function InterruptionIndicator({ show }) {
    if (!show) return null;
    return (
        <div className="interruption-banner">
            <AlertTriangle size={14} strokeWidth={2.5} />
            <span>BARGE-IN DETECTED \u2014 OFFICER INTERRUPTED AT 00:13</span>
        </div>
    );
}

function TalkButton({ pressed, onDown, onUp }) {
    return (
        <button
            className="talk-button"
            style={{
                background: pressed ? COLORS.high : COLORS.dark,
                transform: pressed ? 'scale(0.96)' : 'scale(1)',
            }}
            onMouseDown={onDown}
            onMouseUp={onUp}
            onMouseLeave={onUp}
            onTouchStart={onDown}
            onTouchEnd={onUp}
        >
            <Mic size={18} strokeWidth={2.5} />
            <span>{pressed ? 'LISTENING\u2026 HOLD TO TALK' : 'PRESS &amp; HOLD TO TALK'}</span>
        </button>
    );
}

export default function VoiceInteraction() {
    const [visibleLines, setVisibleLines] = useState(0);
    const [talking, setTalking] = useState(false);
    const [interrupted, setInterrupted] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (visibleLines >= TRANSCRIPT.length) return;
        const timer = setTimeout(() => {
            setVisibleLines((n) => n + 1);
            if (TRANSCRIPT[visibleLines]?.text.endsWith('\u2014')) {
                setInterrupted(true);
                setTimeout(() => setInterrupted(false), 2600);
            }
        }, 1400);
        return () => clearTimeout(timer);
    }, [visibleLines]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [visibleLines]);

    const lines = TRANSCRIPT.slice(0, visibleLines);
    const active = visibleLines > 0 && visibleLines < TRANSCRIPT.length;

    return (
        <>
            <div className="vi-root" style={{ background: COLORS.bg }}>
                <style>{`
        .vi-root { font-family: 'Inter', system-ui, sans-serif; min-height: 100%; padding: 24px; }
        h1.page-title { font-weight: 900; text-transform: uppercase; letter-spacing: -0.01em; font-size: 60px; color: ${COLORS.dark}; margin: 0 0 4px 0; }
        .page-sub { font-size: 12px; color: ${COLORS.text}; margin: 0 0 24px 0; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.03em; }

        .interruption-banner { display: flex; align-items: center; gap: 8px; background: ${COLORS.high}; color: ${COLORS.bg}; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; padding: 10px 16px; border-radius: 8px; margin-bottom: 18px; }

        .waveform-panel { border: 1px solid ${COLORS.border}; background: ${COLORS.card}; border-radius: 12px; padding: 32px 24px; margin-bottom: 24px; display: flex; flex-direction: column; align-items: center; gap: 20px; }
        .waveform { display: flex; align-items: center; justify-content: center; gap: 3px; height: 64px; width: 100%; max-width: 620px; }
        .wave-bar { width: 4px; border-radius: 2px; transition: height 0.1s ease; }

        .latency-hud { display: flex; align-items: center; gap: 0; border: 1px solid ${COLORS.border}; background: ${COLORS.card}; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px; overflow-x: auto; }
        .latency-stage { display: flex; flex-direction: column; align-items: flex-start; gap: 5px; flex-shrink: 0; padding: 0 20px; }
        .latency-dot { width: 8px; height: 8px; border-radius: 50%; }
        .latency-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: ${COLORS.text}; }
        .latency-time { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 700; color: ${COLORS.dark}; }
        .latency-divider { width: 1px; height: 32px; background: ${COLORS.border}; flex-shrink: 0; }

        .transcript-panel { border: 1px solid ${COLORS.border}; background: ${COLORS.bg}; border-radius: 10px; margin-bottom: 24px; }
        .transcript-header { padding: 14px 18px; border-bottom: 1px solid ${COLORS.border}; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; font-size: 12px; color: ${COLORS.dark}; }
        .transcript-scroll { max-height: 340px; overflow-y: auto; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
        .transcript-line { display: flex; gap: 12px; animation: lineIn 0.35s ease both; }
        @keyframes lineIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .transcript-line.vigil { flex-direction: row; }
        .transcript-line.officer { flex-direction: row-reverse; text-align: right; }
        .transcript-bubble { max-width: 62%; padding: 10px 14px; border-radius: 10px; font-size: 13px; line-height: 1.45; }
        .transcript-line.vigil .transcript-bubble { background: ${COLORS.card}; color: ${COLORS.dark}; border: 1px solid ${COLORS.border}; }
        .transcript-line.officer .transcript-bubble { background: ${COLORS.dark}; color: ${COLORS.bg}; }
        .transcript-meta { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: ${COLORS.text}; margin-top: 4px; display: block; }

        .talk-button { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 16px; border: none; border-radius: 10px; color: ${COLORS.bg}; font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; cursor: pointer; transition: background 0.15s ease, transform 0.1s ease; user-select: none; }
      `}</style>

                <h1 className="page-title">Voice Interaction</h1>
                <p className="page-sub">CASE c_8f21 &mdash; LIVE VIGIL / OFFICER CHANNEL</p>

                <InterruptionIndicator show={interrupted} />

                <div className="waveform-panel">
                    <Waveform active={active} />
                </div>

                <LatencyHUD stages={LATENCY_STAGES} />

                <div className="transcript-panel">
                    <div className="transcript-header">Live Transcript</div>
                    <div className="transcript-scroll" ref={scrollRef}>
                        {lines.map((line, i) => (
                            <div key={i} className={`transcript-line ${line.speaker}`}>
                                <div className="transcript-bubble">
                                    {line.text}
                                    <span className="transcript-meta">
                                        {line.speaker === 'vigil' ? 'VIGIL' : 'OFFICER'} \u00b7 {line.t}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <TalkButton
                    pressed={talking}
                    onDown={() => setTalking(true)}
                    onUp={() => setTalking(false)}
                />
            </div>
            <Footer />
        </>
    );
}