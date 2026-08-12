import React, { useEffect, useState } from 'react'
import { useCaseStore } from '../store/useCaseStore'
import { getTraces, getPrediction, getActions, resolveAction } from '../services/api'
import { ShieldCheck, Activity, Key, Mic2 } from 'lucide-react'

export default function TabActiveCase() {
  const activeCase = useCaseStore(s => s.activeCase)
  const [traces, setTraces] = useState<any[]>([])
  const [prediction, setPrediction] = useState<any>(null)
  const [actions, setActions] = useState<{ pending: any[]; executed: any[] }>({ pending: [], executed: [] })

  useEffect(() => {
    if (!activeCase) return
    const id = activeCase.case_id
    getTraces(id).then(setTraces).catch(console.error)
    getPrediction(id).then(setPrediction).catch(console.error)
    getActions(id).then(setActions).catch(console.error)
  }, [activeCase])

  if (!activeCase) {
    return <div style={{ padding: 24, color: '#5A6578' }}>No active case. Waiting for telemetry...</div>
  }

  const handleResolveAction = async (actionId: string, approved: boolean) => {
    try {
      await resolveAction(actionId, approved)
      // refresh
      getActions(activeCase.case_id).then(setActions)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div style={{ padding: 24, display: 'flex', gap: 24, height: '100%' }}>
      {/* LEFT COLUMN */}
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Predictive Projection */}
        <div style={{ background: '#FFF', padding: 24, borderRadius: 8, border: '1px solid #E4E8EF' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={18} /> Predictive Projection (Linear Regression + AI Narrative)
          </h2>
          {prediction ? (
            <div>
              <div style={{ fontSize: 14, color: '#0F1729', lineHeight: 1.6, marginBottom: 16 }}>
                {prediction.narrative}
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ padding: 12, background: '#F8F9FB', borderRadius: 8, flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#5A6578', marginBottom: 4 }}>Predicted Max Score (next 30m)</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{Math.round(prediction.projected_max_score * 100)} / 100</div>
                </div>
                <div style={{ padding: 12, background: '#F8F9FB', borderRadius: 8, flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#5A6578', marginBottom: 4 }}>Projected Risk Tier</div>
                  <div style={{ fontSize: 18, fontWeight: 700, textTransform: 'capitalize' }}>{prediction.projected_tier}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: '#9CA3B4', fontSize: 13 }}>Loading projection...</div>
          )}
        </div>

        {/* Expandable Decision Trace */}
        <div style={{ background: '#FFF', padding: 24, borderRadius: 8, border: '1px solid #E4E8EF', flex: 1, overflowY: 'auto' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={18} /> Decision Traces
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {traces.map(t => (
              <details key={t.trace_id} style={{ border: '1px solid #E4E8EF', borderRadius: 6, padding: '12px 16px', background: '#F8F9FB' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                  {t.stage} — {t.decision} (Confidence: {Math.round(t.confidence_score * 100)}%)
                </summary>
                <div style={{ marginTop: 12, fontSize: 12, fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', background: '#1E293B', color: '#E2E8F0', padding: 12, borderRadius: 6 }}>
                  {JSON.stringify(t.context_used, null, 2)}
                  <hr style={{ borderColor: '#334155', margin: '8px 0' }} />
                  {t.raw_response}
                </div>
              </details>
            ))}
            {traces.length === 0 && <div style={{ color: '#9CA3B4', fontSize: 13 }}>No traces available yet.</div>}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Permit Actions Overlay */}
        <div style={{ background: '#FFF', padding: 16, borderRadius: 8, border: '1px solid #E4E8EF' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={16} /> Human-in-the-Loop Actions
          </h2>
          
          <h3 style={{ fontSize: 12, fontWeight: 600, color: '#5A6578', marginBottom: 8, textTransform: 'uppercase' }}>Pending Authorizations</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {actions.pending.map(act => (
              <div key={act.action_id} style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: 12, borderRadius: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Suspend Permit {act.permit_id}</div>
                <div style={{ fontSize: 12, color: '#92400E', marginBottom: 8 }}>{act.reason}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleResolveAction(act.action_id, true)} style={{ flex: 1, background: '#10B981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Approve</button>
                  <button onClick={() => handleResolveAction(act.action_id, false)} style={{ flex: 1, background: '#EF4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Reject</button>
                </div>
              </div>
            ))}
            {actions.pending.length === 0 && <div style={{ fontSize: 12, color: '#9CA3B4' }}>No pending actions.</div>}
          </div>

          <h3 style={{ fontSize: 12, fontWeight: 600, color: '#5A6578', marginBottom: 8, textTransform: 'uppercase' }}>Executed Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {actions.executed.map(act => (
              <div key={act.action_id} style={{ background: '#F8F9FB', border: '1px solid #E4E8EF', padding: 8, borderRadius: 6, fontSize: 12 }}>
                <span style={{ fontWeight: 600 }}>{act.permit_id}</span> - {act.status === 'APPROVED' ? 'Suspended' : 'Rejected'}
              </div>
            ))}
          </div>
        </div>

        {/* Voice Transcript Block */}
        <div style={{ background: '#FFF', padding: 16, borderRadius: 8, border: '1px solid #E4E8EF', flex: 1 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mic2 size={16} /> Voice Transcript
          </h2>
          <div style={{ fontSize: 13, color: '#9CA3B4' }}>
            Voice stream not active. Use the operator headset to interact.
          </div>
        </div>

      </div>
    </div>
  )
}
