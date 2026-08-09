import { useState, useEffect } from 'react';
import { Mic, CheckCircle2, ArrowUpRight, Database } from 'lucide-react';
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

const DEBRIEF = {
    question: 'In one line \u2014 what should VIGIL watch for next time this happens?',
    answer: 'Flag any Unit 7 pump variance alongside an open permit gap immediately, don\u2019t wait for a second signal.',
};

const LESSON_RECORD = {
    id: 'lesson_2291',
    case_id: 'c_8f21',
    equipment_class: 'centrifugal_pump',
    zone: 'A4',
    trigger_pattern: 'pressure_variance + unresolved_permit_gap',
    weight_adjustment: '+0.05 to correlation prior for this equipment_class',
    written_at: '2026-08-09T14:04:12.500Z',
};

const RELATED = [
    { label: 'Unit 4 pump P-118A \u2014 similar variance pattern, Zone B1', count: 3 },
    { label: 'Restricted-zone entries during open permits, Zone A4', count: 7 },
];

function DebriefCapture({ stage }) {
    return (
        <div className="debrief-card">
            <div className="debrief-header">
                <Mic size={14} strokeWidth={2.5} color={COLORS.live} />
                <span>Debrief Capture</span>
            </div>
            <div className="debrief-line question">
                <span className="debrief-speaker">VIGIL</span>
                <p>{DEBRIEF.question}</p>
            </div>
            {stage >= 1 && (
                <div className="debrief-line answer">
                    <span className="debrief-speaker">OFFICER SHARMA</span>
                    <p>{DEBRIEF.answer}</p>
                </div>
            )}
            {stage < 1 && (
                <div className="debrief-listening">
                    <span className="listening-dot" />
                    listening for response&hellip;
                </div>
            )}
        </div>
    );
}

function LessonJustCreatedBanner({ record }) {
    return (
        <div className="lesson-banner">
            <div className="lesson-banner-head">
                <CheckCircle2 size={16} strokeWidth={2.5} color={COLORS.live} />
                <span>Lesson written to memory</span>
                <span className="lesson-id">{record.id}</span>
            </div>
            <pre className="lesson-payload">{JSON.stringify(record, null, 2)}</pre>
        </div>
    );
}

function RelatedMemoryLink({ items }) {
    return (
        <div className="related-block">
            <div className="related-label">This lesson may help future cases like:</div>
            <div className="related-list">
                {items.map((item) => (
                    <a key={item.label} href="#" className="related-item">
                        <span>{item.label}</span>
                        <span className="related-count">{item.count} related</span>
                        <ArrowUpRight size={13} strokeWidth={2.5} />
                    </a>
                ))}
            </div>
        </div>
    );
}

function GlobalMemoryBrowserLink() {
    return (
        <a href="#" className="global-link">
            <Database size={13} strokeWidth={2} />
            <span>Browse full cross-case memory</span>
            <ArrowUpRight size={12} strokeWidth={2.5} />
        </a>
    );
}

export default function LessonsLearned() {
    const [stage, setStage] = useState(0); // 0: listening, 1: answered, 2: written

    useEffect(() => {
        const t1 = setTimeout(() => setStage(1), 1800);
        const t2 = setTimeout(() => setStage(2), 3400);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, []);

    return (
        <>
            <div className="ll-root" style={{ background: COLORS.bg }}>
                <style>{`
        .ll-root { font-family: 'Inter', system-ui, sans-serif; min-height: 100%; padding: 24px; }
        h1.page-title { font-weight: 900; text-transform: uppercase; letter-spacing: -0.01em; font-size: 60px; color: ${COLORS.dark}; margin: 0 0 4px 0; }
        .page-sub { font-size: 12px; color: ${COLORS.text}; margin: 0 0 28px 0; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.03em; }
        .content-col { display: flex; flex-direction: column; gap: 20px; max-width: 640px; }

        .debrief-card { border: 1px solid ${COLORS.border}; background: ${COLORS.card}; border-radius: 10px; padding: 18px 20px; }
        .debrief-header { display: flex; align-items: center; gap: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; font-size: 11px; color: ${COLORS.dark}; margin-bottom: 14px; }
        .debrief-line { margin-bottom: 12px; animation: fadeIn 0.4s ease both; }
        .debrief-line:last-child { margin-bottom: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .debrief-speaker { display: block; font-family: 'JetBrains Mono', monospace; font-size: 9.5px; letter-spacing: 0.06em; color: ${COLORS.text}; margin-bottom: 3px; }
        .debrief-line p { margin: 0; font-size: 13px; line-height: 1.5; color: ${COLORS.dark}; }
        .debrief-listening { display: flex; align-items: center; gap: 8px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: ${COLORS.text}; }
        .listening-dot { width: 6px; height: 6px; border-radius: 50%; background: ${COLORS.live}; animation: blink 1s ease infinite; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }

        .lesson-banner { border: 1px solid ${COLORS.live}; background: ${COLORS.card}; border-radius: 10px; padding: 18px 20px; animation: bannerIn 0.4s ease both; }
        @keyframes bannerIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .lesson-banner-head { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 12.5px; color: ${COLORS.dark}; margin-bottom: 12px; }
        .lesson-id { margin-left: auto; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: ${COLORS.text}; }
        .lesson-payload { margin: 0; padding: 12px 14px; background: ${COLORS.bg}; border: 1px solid ${COLORS.border}; border-radius: 6px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: ${COLORS.dark}; line-height: 1.55; overflow-x: auto; }

        .related-block { border: 1px solid ${COLORS.border}; background: ${COLORS.card}; border-radius: 10px; padding: 16px 18px; }
        .related-label { font-size: 11.5px; font-weight: 700; color: ${COLORS.dark}; margin-bottom: 10px; }
        .related-list { display: flex; flex-direction: column; gap: 8px; }
        .related-item { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: ${COLORS.bg}; border: 1px solid ${COLORS.border}; border-radius: 6px; text-decoration: none; font-size: 12px; color: ${COLORS.dark}; transition: border-color 0.15s ease; }
        .related-item:hover { border-color: ${COLORS.live}; }
        .related-count { margin-left: auto; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: ${COLORS.text}; flex-shrink: 0; }

        .global-link { display: inline-flex; align-items: center; gap: 7px; align-self: flex-start; font-size: 11.5px; color: ${COLORS.text}; text-decoration: none; padding-top: 4px; }
        .global-link:hover { color: ${COLORS.dark}; }
      `}</style>

                <h1 className="page-title">Lessons Learned</h1>
                <p className="page-sub">CASE c_8f21 &mdash; MEMORY WRITE-BACK</p>

                <div className="content-col">
                    <DebriefCapture stage={stage} />

                    {stage >= 2 && (
                        <>
                            <LessonJustCreatedBanner record={LESSON_RECORD} />
                            <RelatedMemoryLink items={RELATED} />
                            <GlobalMemoryBrowserLink />
                        </>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}