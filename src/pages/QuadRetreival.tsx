import React, { useState } from 'react';
import { Search, Layers, GitMerge, Filter, CheckCircle2, XCircle } from 'lucide-react';
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

const PIPELINE_STEPS = [
    { key: 'query', label: 'Query', icon: Search, count: 1, unit: 'query' },
    { key: 'embed', label: 'Embed', icon: Layers, count: 1, unit: 'vector' },
    { key: 'hybrid', label: 'Hybrid Search', icon: GitMerge, count: 10, unit: 'candidates' },
    { key: 'rerank', label: 'Rerank', icon: GitMerge, count: 3, unit: 'reranked' },
    { key: 'filter', label: 'Grounding Filter', icon: Filter, count: 1, unit: 'cited' },
];

const MATCHES = [
    {
        id: 'm1',
        title: 'Unit 7 pump pressure drift \u2014 near-miss, unresolved permit gap',
        date: 'Mar 14, 2025',
        similarity: 0.91,
        rerank: 0.88,
        matchedOn: ['pressure_variance', 'zone_A4', 'permit_gap'],
        contribution: '+0.12 to historical_boost \u2014 same pump ID, same shift-handover pattern',
        status: 'cited',
    },
    {
        id: 'm2',
        title: 'Restricted-zone entry during active hot-work permit',
        date: 'Nov 02, 2024',
        similarity: 0.84,
        rerank: 0.79,
        matchedOn: ['restricted_entry', 'hot_work_permit'],
        contribution: '+0.06 to historical_boost \u2014 overlapping permit type, different zone',
        status: 'cited',
    },
    {
        id: 'm3',
        title: 'CCTV flag \u2014 PPE non-compliance, no downstream incident',
        date: 'Jul 22, 2024',
        similarity: 0.77,
        rerank: 0.52,
        matchedOn: ['cctv_flag'],
        contribution: 'Dropped \u2014 single weak signal, no corroborating SCADA/permit factor',
        status: 'dropped',
    },
];

function PipelineStrip({ steps }) {
    return (
        <div className="pipeline-strip">
            {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                    <React.Fragment key={step.key}>
                        <div className="pipeline-node">
                            <div className="pipeline-icon">
                                <Icon size={16} strokeWidth={2} />
                            </div>
                            <span className="pipeline-label">{step.label}</span>
                            <span className="pipeline-count">
                                {step.count} {step.unit}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className="pipeline-arrow">
                                <svg width="28" height="10" viewBox="0 0 28 10">
                                    <line x1="0" y1="5" x2="22" y2="5" stroke={COLORS.border} strokeWidth="1.5" />
                                    <path d="M20 1 L26 5 L20 9" fill="none" stroke={COLORS.border} strokeWidth="1.5" />
                                </svg>
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

function MatchCard({ match }) {
    const isCited = match.status === 'cited';
    return (

        <div className="match-card" style={{ borderColor: isCited ? COLORS.low : COLORS.border }}>
            <div className="match-scores">
                <div className="score-block">
                    <span className="score-label">Similarity</span>
                    <span className="score-value" style={{ color: COLORS.dark }}>{match.similarity.toFixed(2)}</span>
                </div>
                <div className="score-block">
                    <span className="score-label">Rerank</span>
                    <span className="score-value" style={{ color: COLORS.dark }}>{match.rerank.toFixed(2)}</span>
                </div>
                <div className="status-pill" style={{ background: isCited ? COLORS.low : COLORS.border, color: isCited ? COLORS.bg : COLORS.text }}>
                    {isCited ? <CheckCircle2 size={12} strokeWidth={2.5} /> : <XCircle size={12} strokeWidth={2.5} />}
                    {isCited ? 'CITED' : 'DROPPED'}
                </div>
            </div>

            <h3 className="match-title">{match.title}</h3>
            <span className="match-date">{match.date}</span>

            <div className="match-chips">
                {match.matchedOn.map((chip) => (
                    <span key={chip} className="chip">{chip}</span>
                ))}
            </div>

            <p className="match-contribution" style={{ color: isCited ? COLORS.dark : COLORS.text }}>
                {match.contribution}
            </p>
        </div>
    );
}

export default function RetrievalTrace() {
    const [steps] = useState(PIPELINE_STEPS);

    return (
        <>
            <div className="rt-root" style={{ background: COLORS.bg }}>
                <style>{`
        .rt-root { font-family: 'Inter', system-ui, sans-serif; min-height: 100%; padding: 24px; }
        h1.page-title { font-weight: 900; text-transform: uppercase; letter-spacing: -0.01em; font-size: 60px; color: ${COLORS.dark}; margin: 0 0 4px 0; }
        .page-sub { font-size: 12px; color: ${COLORS.text}; margin: 0 0 28px 0; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.03em; }

        .pipeline-strip { display: flex; align-items: center; gap: 4px; overflow-x: auto; padding: 20px; margin-bottom: 32px; border: 1px solid ${COLORS.border}; border-radius: 10px; background: ${COLORS.card}; }
        .pipeline-node { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; min-width: 84px; }
        .pipeline-icon { width: 34px; height: 34px; border-radius: 50%; background: ${COLORS.bg}; border: 1px solid ${COLORS.border}; display: flex; align-items: center; justify-content: center; color: ${COLORS.dark}; }
        .pipeline-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: ${COLORS.dark}; }
        .pipeline-count { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: ${COLORS.text}; }
        .pipeline-arrow { flex-shrink: 0; display: flex; align-items: center; padding: 0 2px; }

        .matches-list { display: flex; flex-direction: column; gap: 16px; }
        .match-card { border: 1px solid; border-left-width: 3px; border-radius: 10px; padding: 18px 20px; background: ${COLORS.card}; }
        .match-scores { display: flex; align-items: center; gap: 20px; margin-bottom: 12px; }
        .score-block { display: flex; flex-direction: column; gap: 2px; }
        .score-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: ${COLORS.text}; }
        .score-value { font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: 700; }
        .status-pill { margin-left: auto; display: inline-flex; align-items: center; gap: 5px; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.05em; padding: 4px 10px; border-radius: 999px; }
        .match-title { font-size: 14px; font-weight: 700; color: ${COLORS.dark}; margin: 0 0 4px 0; line-height: 1.4; }
        .match-date { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: ${COLORS.text}; }
        .match-chips { display: flex; gap: 6px; flex-wrap: wrap; margin: 12px 0; }
        .chip { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: ${COLORS.dark}; background: ${COLORS.bg}; border: 1px solid ${COLORS.border}; padding: 3px 8px; border-radius: 4px; }
        .match-contribution { font-size: 12.5px; line-height: 1.5; margin: 0; font-style: italic; }
      `}</style>

                <h1 className="page-title">Qdrant Retrieval Trace</h1>
                <p className="page-sub">CASE c_8f21 &mdash; HYBRID SEARCH + RERANK + GROUNDING FILTER</p>

                <PipelineStrip steps={steps} />

                <div className="matches-list">
                    {MATCHES.map((match) => (
                        <MatchCard key={match.id} match={match} />
                    ))}
                </div>
            </div>
            <Footer />
        </>
    );
}