import React, { useState } from 'react'
import { useCaseStore } from '../store/useCaseStore'
import { getCounterfactual } from '../services/api'
import { Cpu, Play } from 'lucide-react'

export default function TabCounterfactual() {
  const activeCase = useCaseStore(s => s.activeCase)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const runCounterfactual = async () => {
    if (!activeCase) return
    setLoading(true)
    try {
      const res = await getCounterfactual(activeCase.case_id)
      setResult(res)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  if (!activeCase) {
    return <div style={{ padding: 24, color: '#5A6578' }}>No active case.</div>
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ background: '#FFF', padding: 24, borderRadius: 8, border: '1px solid #E4E8EF', maxWidth: 800 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Cpu size={18} /> Counterfactual Reasoning (What-If)
        </h2>
        
        <p style={{ fontSize: 14, color: '#5A6578', marginBottom: 24 }}>
          Run an alternative reality simulation. What if the secondary sensor was offline?
          What if the pressure was 20% higher?
        </p>

        <button 
          onClick={runCounterfactual}
          disabled={loading}
          style={{ 
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#2563EB', color: '#FFF', padding: '10px 16px', 
            borderRadius: 6, fontWeight: 600, border: 'none', cursor: 'pointer' 
          }}
        >
          {loading ? 'Simulating...' : <><Play size={16} /> Run Automated "What-If" Baseline</>}
        </button>

        {result && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Results</h3>
            <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
              <div style={{ flex: 1, padding: 16, background: '#F8F9FB', borderRadius: 8, border: '1px dashed #D0D5DE' }}>
                <div style={{ fontSize: 12, color: '#5A6578', marginBottom: 4 }}>Original Tier</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{result.original_tier}</div>
                <div style={{ fontSize: 12, color: '#5A6578', marginTop: 8 }}>Original Score: {Math.round(result.original_score * 100)}</div>
              </div>
              <div style={{ flex: 1, padding: 16, background: '#EFF6FF', borderRadius: 8, border: '1px dashed #93C5FD' }}>
                <div style={{ fontSize: 12, color: '#1D4ED8', marginBottom: 4 }}>Counterfactual Tier</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1E3A8A' }}>{result.counterfactual_tier}</div>
                <div style={{ fontSize: 12, color: '#1D4ED8', marginTop: 8 }}>Counterfactual Score: {Math.round(result.counterfactual_score * 100)}</div>
              </div>
            </div>
            
            <div style={{ fontSize: 14, background: '#F1F3F7', padding: 16, borderRadius: 8, fontStyle: 'italic', color: '#334155' }}>
              "If {result.modification} occurred, the risk would {result.counterfactual_score > result.original_score ? 'increase' : 'decrease'}."
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
