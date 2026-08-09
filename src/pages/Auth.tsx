import { useState } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, Inbox } from 'lucide-react';
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

const PENDING_ACTION = {
    summary: 'Suspend the active hot-work permit for Bay 3 and notify the shift supervisor on duty.',
    toolCall: {
        tool: 'permit.suspend',
        params: {
            permit_id: 'HW-2291-B3',
            zone: 'Bay 3',
            reason: 'compound_risk_threshold_exceeded',
            notify: ['shift_supervisor'],
            case_id: 'c_8f21',
        },
    },
    evidence: [
        'SCADA \u2014 pressure variance +4% on Unit 7 pump P-204B',
        'CCTV \u2014 unscheduled entry detected in restricted zone A4',
        'Historical match \u2014 same pump, unresolved handover gap (Mar 14)',
    ],
};

function ActionPreview({ action }) {
    return (
        <div className="action-preview">
            <div className="ap-summary">{action.summary}</div>
            <div className="ap-raw">
                <div className="ap-raw-label">Raw Tool Call</div>
                <pre className="ap-raw-body">{JSON.stringify(action.toolCall, null, 2)}</pre>
            </div>
        </div>
    );
}

function EvidenceRecap({ items }) {
    return (
        <div className="evidence-recap">
            <div className="er-label">Why this is being asked</div>
            <ul className="er-list">
                {items.map((item, i) => (
                    <li key={i}>{item}</li>
                ))}
            </ul>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="empty-state">
            <Inbox size={28} strokeWidth={1.5} color={COLORS.text} />
            <p className="empty-title">No action currently awaiting authorization</p>
            <p className="empty-sub">This case is being monitored. You&rsquo;ll be prompted here the moment VIGIL requests a decision.</p>
        </div>
    );
}

export default function ConfirmationScreen() {
    const [pending, setPending] = useState(true);
    const [resolved, setResolved] = useState(null); // 'approved' | 'denied' | null

    const handleDecision = (decision) => {
        setResolved(decision);
        setTimeout(() => {
            setPending(false);
            setResolved(null);
        }, 900);
    };

    return (
        <>
            <div className="cf-root" style={{ background: COLORS.bg }}>
                <style>{`
        .cf-root { font-family: 'Inter', system-ui, sans-serif; min-height: 100%; padding: 24px; display: flex; flex-direction: column; align-items: center; }
        h1.page-title { align-self: flex-start; font-weight: 900; text-transform: uppercase; letter-spacing: -0.01em; font-size: 60px; color: ${COLORS.dark}; margin: 0 0 4px 0; }
        .page-sub { align-self: flex-start; font-size: 12px; color: ${COLORS.text}; margin: 0 0 28px 0; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.03em; }

        .toggle-row { align-self: flex-start; margin-bottom: 20px; }
        .toggle-btn { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.05em; background: transparent; border: 1px solid ${COLORS.border}; color: ${COLORS.text}; padding: 6px 12px; border-radius: 6px; cursor: pointer; }

        .auth-modal { width: 100%; max-width: 640px; border: 1px solid ${COLORS.high}; border-radius: 14px; background: ${COLORS.card}; box-shadow: 0 8px 32px rgba(45,74,52,0.14); padding: 28px; animation: modalIn 0.35s ease both; }
        @keyframes modalIn { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

        .auth-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
        .auth-header-title { font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; font-size: 14px; color: ${COLORS.dark}; }
        .auth-header-tag { margin-left: auto; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.05em; color: ${COLORS.bg}; background: ${COLORS.high}; padding: 4px 10px; border-radius: 999px; }
        .auth-case { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: ${COLORS.text}; margin-bottom: 20px; }

        .action-preview { background: ${COLORS.bg}; border: 1px solid ${COLORS.border}; border-radius: 10px; padding: 16px 18px; margin-bottom: 18px; }
        .ap-summary { font-size: 14px; color: ${COLORS.dark}; line-height: 1.5; margin-bottom: 14px; }
        .ap-raw-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: ${COLORS.text}; margin-bottom: 6px; }
        .ap-raw-body { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: ${COLORS.dark}; background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 6px; padding: 10px 12px; margin: 0; overflow-x: auto; line-height: 1.5; }

        .evidence-recap { margin-bottom: 24px; }
        .er-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: ${COLORS.text}; margin-bottom: 8px; }
        .er-list { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px; }
        .er-list li { font-size: 12.5px; color: ${COLORS.dark}; line-height: 1.4; }

        .auth-actions { display: flex; gap: 12px; }
        .auth-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 13px; border-radius: 10px; border: none; font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 700; letter-spacing: 0.05em; cursor: pointer; transition: opacity 0.15s ease; }
        .auth-btn:hover { opacity: 0.9; }
        .auth-btn.approve { background: ${COLORS.dark}; color: ${COLORS.bg}; }
        .auth-btn.deny { background: transparent; color: ${COLORS.high}; border: 1px solid ${COLORS.high}; }
        .auth-btn:disabled { opacity: 0.6; cursor: default; }

        .empty-state { width: 100%; max-width: 480px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px; border: 1px dashed ${COLORS.border}; border-radius: 14px; padding: 56px 32px; margin-top: 12px; }
        .empty-title { font-size: 14px; font-weight: 700; color: ${COLORS.dark}; margin: 4px 0 0 0; }
        .empty-sub { font-size: 12.5px; color: ${COLORS.text}; margin: 0; max-width: 340px; line-height: 1.5; }
      `}</style>

                <h1 className="page-title">Authorization</h1>
                <p className="page-sub">CASE c_8f21 &mdash; HUMAN-IN-THE-LOOP GATE</p>

                <div className="toggle-row">
                    <button className="toggle-btn" onClick={() => { setPending((p) => !p); setResolved(null); }}>
                        {pending ? 'PREVIEW: EMPTY STATE' : 'PREVIEW: PENDING ACTION'}
                    </button>
                </div>

                {pending ? (
                    <div className="auth-modal">
                        <div className="auth-header">
                            <ShieldAlert size={20} color={COLORS.high} strokeWidth={2} />
                            <span className="auth-header-title">Authorization Required</span>
                            <span className="auth-header-tag">HIGH RISK</span>
                        </div>
                        <div className="auth-case">Requested by VIGIL &middot; case c_8f21 &middot; awaiting your decision</div>

                        <ActionPreview action={PENDING_ACTION} />
                        <EvidenceRecap items={PENDING_ACTION.evidence} />

                        <div className="auth-actions">
                            <button className="auth-btn approve" disabled={!!resolved} onClick={() => handleDecision('approved')}>
                                <CheckCircle2 size={15} strokeWidth={2.5} />
                                {resolved === 'approved' ? 'APPROVED' : 'APPROVE ACTION'}
                            </button>
                            <button className="auth-btn deny" disabled={!!resolved} onClick={() => handleDecision('denied')}>
                                <XCircle size={15} strokeWidth={2.5} />
                                {resolved === 'denied' ? 'DENIED' : 'DENY'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <EmptyState />
                )}
            </div>
            <Footer />
        </>
    );
}