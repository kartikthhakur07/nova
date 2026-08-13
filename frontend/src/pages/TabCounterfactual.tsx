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
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', height: '100%', background: '#F7F6F2' }}>
      <div style={{ background: '#FFFFFF', padding: 24, borderRadius: 8, border: '1px solid #C8C9C6', maxWidth: 800, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#0E0D1F' }}>
          <Cpu size={18} color="#0D9488" /> Counterfactual Reasoning (What-If)
        </h2>
        
        <p style={{ fontSize: 14, color: '#62636A', marginBottom: 24 }}>
          Run an alternative reality simulation. What if the secondary sensor was offline?
          What if the pressure was 20% higher?
        </p>

        <button 
          onClick={runCounterfactual}
          disabled={loading}
          style={{ 
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#0D9488', color: '#FFF', padding: '10px 16px', 
            borderRadius: 6, fontWeight: 600, border: 'none', cursor: 'pointer' 
          }}
        >
          {loading ? 'Simulating...' : <><Play size={16} /> Run Automated "What-If" Baseline</>}
        </button>

        {result && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#0E0D1F' }}>Results</h3>
            <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
              <div style={{ flex: 1, padding: 16, background: '#F7F6F2', borderRadius: 8, border: '1px dashed #C8C9C6' }}>
                <div style={{ fontSize: 12, color: '#62636A', marginBottom: 4 }}>Original Tier</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0E0D1F' }}>{result.original_tier}</div>
                <div style={{ fontSize: 12, color: '#62636A', marginTop: 8 }}>Original Score: {Math.round(result.original_score * 100)}</div>
              </div>
              <div style={{ flex: 1, padding: 16, background: '#F3DFC0', borderRadius: 8, border: '1px dashed #D98A3A' }}>
                <div style={{ fontSize: 12, color: '#D98A3A', marginBottom: 4 }}>Counterfactual Tier</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#D98A3A' }}>{result.counterfactual_tier}</div>
                <div style={{ fontSize: 12, color: '#D98A3A', marginTop: 8 }}>Counterfactual Score: {Math.round(result.counterfactual_score * 100)}</div>
              </div>
            </div>
            
            <div style={{ fontSize: 14, background: '#E9E9E5', padding: 16, borderRadius: 8, fontStyle: 'italic', color: '#0E0D1F', border: '1px solid #C8C9C6' }}>
              "If {result.modification} occurred, the risk would {result.counterfactual_score > result.original_score ? 'increase' : 'decrease'}."
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
