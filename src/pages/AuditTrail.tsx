import { useState } from 'react';
import { ChevronDown, ChevronRight, Download } from 'lucide-react';
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

const LOG_ENTRIES = [
    {
        id: 'a1',
        stage: 'DETECT',
        ts: '2026-08-09T14:02:11.004Z',
        actor: 'system',
        event: 'threshold_crossed',
        summary: 'Pressure variance on P-204B exceeded configured threshold (+4.0%)',
        raw: { sensor_id: 'P-204B', metric: 'pressure_variance', value: 0.04, threshold: 0.03, unit: 'Unit 7' },
    },
    {
        id: 'a2',
        stage: 'CONTEXTUALIZE',
        ts: '2026-08-09T14:02:11.980Z',
        actor: 'system',
        event: 'signal_correlated',
        summary: 'CCTV entry event in zone A4 correlated to same time window',
        raw: { source: 'cctv', zone: 'A4', event_type: 'restricted_entry', window_s: 120 },
    },
    {
        id: 'a3',
        stage: 'RETRIEVE',
        ts: '2026-08-09T14:02:13.210Z',
        actor: 'system',
        event: 'qdrant_query_executed',
        summary: 'Hybrid search returned 10 candidates, reranked to 3, 1 cited',
        raw: { candidates: 10, reranked: 3, cited: 1, collection: 'incident_history_v3' },
    },
    {
        id: 'a4',
        stage: 'REASON',
        ts: '2026-08-09T14:02:14.550Z',
        actor: 'system',
        event: 'compound_score_computed',
        summary: 'Compound risk score 0.72 (4 factors + capped historical boost 0.18)',
        raw: { score: 0.72, factors: 4, historical_boost: 0.18, boost_cap: 0.2, tier: 'HIGH' },
    },
    {
        id: 'a5',
        stage: 'EXPLAIN',
        ts: '2026-08-09T14:02:15.120Z',
        actor: 'system',
        event: 'explanation_generated',
        summary: 'Natural-language rationale generated and attached to case c_8f21',
        raw: { case_id: 'c_8f21', tokens: 184, model: 'vigil-reason-v2' },
    },
    {
        id: 'a6',
        stage: 'ACT',
        ts: '2026-08-09T14:02:41.660Z',
        actor: 'officer.sharma',
        event: 'action_approved',
        summary: 'Officer Sharma approved permit.suspend for Bay 3',
        raw: { tool: 'permit.suspend', permit_id: 'HW-2291-B3', approved_by: 'officer.sharma' },
    },
    {
        id: 'a7',
        stage: 'VERIFY',
        ts: '2026-08-09T14:03:02.310Z',
        actor: 'system',
        event: 'action_confirmed',
        summary: 'Permit suspension confirmed against permit system of record',
        raw: { permit_id: 'HW-2291-B3', status: 'suspended', confirmed_source: 'permit_db' },
    },
];

function AuditRow({ entry, expanded, onToggle }) {
    return (
        <div className="audit-row">
            <button className="audit-row-main" onClick={onToggle}>
                <span className="audit-chevron">
                    {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </span>
                <span className="audit-cell audit-ts">{entry.ts}</span>
                <span className="audit-cell audit-stage-tag">{entry.stage}</span>
                <span className="audit-cell audit-event">{entry.event}</span>
                <span className="audit-cell audit-actor">{entry.actor}</span>
                <span className="audit-cell audit-summary">{entry.summary}</span>
            </button>
            {expanded && (
                <pre className="audit-raw">{JSON.stringify(entry.raw, null, 2)}</pre>
            )}
        </div>
    );
}

export default function AuditTrail() {
    const [filterStage, setFilterStage] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    const filtered = filterStage ? LOG_ENTRIES.filter((e) => e.stage === filterStage) : LOG_ENTRIES;

    return (
        <>
            <div className="at-root" style={{ background: COLORS.bg }}>
                <style>{`
        .at-root { font-family: 'Inter', system-ui, sans-serif; min-height: 100%; padding: 24px; }
        h1.page-title { font-weight: 900; text-transform: uppercase; letter-spacing: -0.01em; font-size: 60px; color: ${COLORS.dark}; margin: 0 0 4px 0; }
        .page-sub { font-size: 12px; color: ${COLORS.text}; margin: 0 0 24px 0; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.03em; }

        .top-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; gap: 16px; flex-wrap: wrap; }

        .timeline { display: flex; align-items: center; gap: 0; border: 1px solid ${COLORS.border}; background: ${COLORS.card}; border-radius: 8px; overflow: hidden; }
        .timeline-btn { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; letter-spacing: 0.04em; padding: 10px 14px; background: transparent; border: none; border-right: 1px solid ${COLORS.border}; color: ${COLORS.text}; cursor: pointer; white-space: nowrap; }
        .timeline-btn:last-child { border-right: none; }
        .timeline-btn.active { background: ${COLORS.dark}; color: ${COLORS.bg}; font-weight: 700; }
        .timeline-btn:hover:not(.active) { color: ${COLORS.dark}; }

        .export-btn { display: inline-flex; align-items: center; gap: 6px; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; color: ${COLORS.dark}; background: transparent; border: 1px solid ${COLORS.dark}; padding: 9px 14px; border-radius: 6px; cursor: pointer; white-space: nowrap; }
        .export-btn:hover { background: ${COLORS.dark}; color: ${COLORS.bg}; }

        .audit-table { border: 1px solid ${COLORS.border}; border-radius: 4px; overflow: hidden; }
        .audit-table-header { display: grid; grid-template-columns: 16px 190px 110px 170px 130px 1fr; gap: 12px; padding: 10px 14px; background: ${COLORS.dark}; color: ${COLORS.bg}; font-family: 'JetBrains Mono', monospace; font-size: 9.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }

        .audit-row { border-top: 1px solid ${COLORS.border}; background: ${COLORS.card}; }
        .audit-row:first-child { border-top: none; }
        .audit-row-main { width: 100%; display: grid; grid-template-columns: 16px 190px 110px 170px 130px 1fr; gap: 12px; padding: 11px 14px; background: none; border: none; text-align: left; cursor: pointer; align-items: center; font-family: 'JetBrains Mono', monospace; font-size: 11.5px; }
        .audit-row-main:hover { background: ${COLORS.bg}; }
        .audit-chevron { color: ${COLORS.text}; display: flex; }
        .audit-cell { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .audit-ts { color: ${COLORS.text}; }
        .audit-stage-tag { color: ${COLORS.dark}; font-weight: 700; }
        .audit-event { color: ${COLORS.dark}; }
        .audit-actor { color: ${COLORS.text}; }
        .audit-summary { color: ${COLORS.text}; font-family: 'Inter', system-ui, sans-serif; font-size: 11.5px; white-space: normal; }

        .audit-raw { margin: 0 14px 14px 42px; padding: 12px 14px; background: ${COLORS.bg}; border: 1px solid ${COLORS.border}; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: ${COLORS.dark}; overflow-x: auto; line-height: 1.5; }

        @media (max-width: 900px) {
          .audit-table-header, .audit-row-main { grid-template-columns: 16px 1fr; }
          .audit-ts, .audit-stage-tag, .audit-actor { display: none; }
        }
      `}</style>

                <h1 className="page-title">Audit Trail</h1>
                <p className="page-sub">CASE c_8f21 &mdash; IMMUTABLE LOG &middot; {LOG_ENTRIES.length} ENTRIES</p>

                <div className="top-bar">
                    <div className="timeline">
                        <button
                            className={`timeline-btn ${filterStage === null ? 'active' : ''}`}
                            onClick={() => setFilterStage(null)}
                        >
                            ALL
                        </button>
                        {STAGES.map((stage) => (
                            <button
                                key={stage}
                                className={`timeline-btn ${filterStage === stage ? 'active' : ''}`}
                                onClick={() => setFilterStage(stage)}
                            >
                                {stage}
                            </button>
                        ))}
                    </div>

                    <button className="export-btn">
                        <Download size={13} strokeWidth={2.5} />
                        EXPORT AUDIT LOG
                    </button>
                </div>

                <div className="audit-table">
                    <div className="audit-table-header">
                        <span></span>
                        <span>Timestamp</span>
                        <span>Stage</span>
                        <span>Event</span>
                        <span>Actor</span>
                        <span>Summary</span>
                    </div>
                    {filtered.map((entry) => (
                        <AuditRow
                            key={entry.id}
                            entry={entry}
                            expanded={expandedId === entry.id}
                            onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                        />
                    ))}
                </div>
            </div>
            <Footer />
        </>
    );
}