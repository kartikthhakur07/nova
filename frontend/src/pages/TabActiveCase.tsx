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
    <div style={{ padding: 24, display: 'flex', gap: 24, height: '100%', background: '#F7F6F2' }}>
      {/* LEFT COLUMN */}
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Predictive Projection */}
        <div style={{ background: '#FFFFFF', padding: 24, borderRadius: 8, border: '1px solid #C8C9C6', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#0E0D1F' }}>
            <Activity size={18} color="#0D9488" /> Predictive Projection (Linear Regression + AI Narrative)
          </h2>
          {prediction ? (
            <div>
              <div style={{ fontSize: 14, color: '#0E0D1F', lineHeight: 1.6, marginBottom: 16 }}>
                {prediction.narrative}
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ padding: 12, background: '#F7F6F2', borderRadius: 8, flex: 1, border: '1px solid #E9E9E5' }}>
                  <div style={{ fontSize: 11, color: '#62636A', marginBottom: 4 }}>Predicted Max Score (next 30m)</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#0E0D1F' }}>{Math.round(prediction.projected_max_score * 100)} / 100</div>
                </div>
                <div style={{ padding: 12, background: '#F7F6F2', borderRadius: 8, flex: 1, border: '1px solid #E9E9E5' }}>
                  <div style={{ fontSize: 11, color: '#62636A', marginBottom: 4 }}>Projected Risk Tier</div>
                  <div style={{ fontSize: 18, fontWeight: 700, textTransform: 'capitalize', color: '#D98A3A' }}>{prediction.projected_tier}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: '#8E9096', fontSize: 13 }}>Loading projection...</div>
          )}
        </div>

        {/* Expandable Decision Trace */}
        <div style={{ background: '#FFFFFF', padding: 24, borderRadius: 8, border: '1px solid #C8C9C6', flex: 1, overflowY: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#0E0D1F' }}>
            <ShieldCheck size={18} color="#0D9488" /> Decision Traces
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {traces.map(t => (
              <details key={t.trace_id} style={{ border: '1px solid #C8C9C6', borderRadius: 6, padding: '12px 16px', background: '#F7F6F2' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#0E0D1F' }}>
                  {t.stage} — {t.decision} (Confidence: {Math.round(t.confidence_score * 100)}%)
                </summary>
                <div style={{ marginTop: 12, fontSize: 12, fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', background: '#E9E9E5', color: '#0E0D1F', padding: 12, borderRadius: 6, border: '1px solid #C8C9C6' }}>
                  {JSON.stringify(t.context_used, null, 2)}
                  <hr style={{ borderColor: '#C8C9C6', margin: '8px 0' }} />
                  {t.raw_response}
                </div>
              </details>
            ))}
            {traces.length === 0 && <div style={{ color: '#8E9096', fontSize: 13 }}>No traces available yet.</div>}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Permit Actions Overlay */}
        <div style={{ background: '#FFFFFF', padding: 16, borderRadius: 8, border: '1px solid #C8C9C6', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, color: '#0E0D1F' }}>
            <Key size={16} color="#0D9488" /> Human-in-the-Loop Actions
          </h2>
          
          <h3 style={{ fontSize: 12, fontWeight: 600, color: '#62636A', marginBottom: 8, textTransform: 'uppercase' }}>Pending Authorizations</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {actions.pending.map(act => (
              <div key={act.action_id} style={{ background: 'rgba(217,138,58,0.1)', border: '1px solid #D98A3A', padding: 12, borderRadius: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#0E0D1F' }}>Suspend Permit {act.permit_id}</div>
                <div style={{ fontSize: 12, color: '#D98A3A', marginBottom: 8 }}>{act.reason}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleResolveAction(act.action_id, true)} style={{ flex: 1, background: '#0D9488', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Approve</button>
                  <button onClick={() => handleResolveAction(act.action_id, false)} style={{ flex: 1, background: '#C84B42', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Reject</button>
                </div>
              </div>
            ))}
            {actions.pending.length === 0 && <div style={{ fontSize: 12, color: '#8E9096' }}>No pending actions.</div>}
          </div>

          <h3 style={{ fontSize: 12, fontWeight: 600, color: '#62636A', marginBottom: 8, textTransform: 'uppercase' }}>Executed Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {actions.executed.map(act => (
              <div key={act.action_id} style={{ background: '#F7F6F2', border: '1px solid #C8C9C6', padding: 8, borderRadius: 6, fontSize: 12, color: '#0E0D1F' }}>
                <span style={{ fontWeight: 600 }}>{act.permit_id}</span> - {act.status === 'APPROVED' ? 'Suspended' : 'Rejected'}
              </div>
            ))}
          </div>
        </div>

        {/* Voice Transcript Block */}
        <div style={{ background: '#FFFFFF', padding: 16, borderRadius: 8, border: '1px solid #C8C9C6', flex: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, color: '#0E0D1F' }}>
            <Mic2 size={16} color="#0D9488" /> Voice Transcript
          </h2>
          <div style={{ fontSize: 13, color: '#8E9096' }}>
            Voice stream not active. Use the operator headset to interact.
          </div>
        </div>

      </div>
    </div>
  )
}
