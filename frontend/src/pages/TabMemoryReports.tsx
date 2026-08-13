import React, { useEffect, useState } from 'react'
import { getMemoryStats, getCurrentLearnings, getReport, generateReport } from '../services/api'
import { useCaseStore } from '../store/useCaseStore'
import { Database, FileText } from 'lucide-react'

export default function TabMemoryReports() {
  const activeCase = useCaseStore(s => s.activeCase)
  const [stats, setStats] = useState<any>(null)
  const [learnings, setLearnings] = useState<string>('')
  const [report, setReport] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    getMemoryStats().then(setStats).catch(console.error)
    getCurrentLearnings().then(res => setLearnings(res.learnings)).catch(console.error)
  }, [])

  useEffect(() => {
    if (activeCase) {
      getReport(activeCase.case_id).then(res => setReport(res.report)).catch(console.error)
    }
  }, [activeCase])

  const handleGenerateReport = async () => {
    if (!activeCase) return
    setGenerating(true)
    try {
      const res = await generateReport(activeCase.case_id)
      setReport(res.report)
    } catch (err) {
      console.error(err)
    }
    setGenerating(false)
  }

  return (
    <div style={{ padding: 24, display: 'flex', gap: 24, height: '100%', background: '#F7F6F2' }}>
      
      {/* LEFT COLUMN: Memory */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ background: '#FFFFFF', padding: 24, borderRadius: 8, border: '1px solid #C8C9C6', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#0E0D1F' }}>
            <Database size={18} color="#0D9488" /> Qdrant Vector Memory
          </h2>
          {stats ? (
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1, background: '#F7F6F2', padding: 12, borderRadius: 6, border: '1px solid #E9E9E5' }}>
                <div style={{ fontSize: 11, color: '#62636A' }}>Historical Incidents</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#0D9488' }}>{stats.incidents_historical_count}</div>
              </div>
              <div style={{ flex: 1, background: '#F7F6F2', padding: 12, borderRadius: 6, border: '1px solid #E9E9E5' }}>
                <div style={{ fontSize: 11, color: '#62636A' }}>Lessons Learned</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#7C3AED' }}>{stats.lessons_learned_count}</div>
              </div>
            </div>
          ) : (
            <div style={{ color: '#8E9096', fontSize: 13 }}>Loading stats...</div>
          )}
        </div>

        <div style={{ background: '#FFFFFF', padding: 24, borderRadius: 8, border: '1px solid #C8C9C6', flex: 1, overflowY: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#0E0D1F' }}>Current Learnings (System Prompt Injection)</h2>
          <pre style={{ fontSize: 12, fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', background: '#E9E9E5', color: '#0E0D1F', padding: 16, borderRadius: 8, border: '1px solid #C8C9C6' }}>
            {learnings || 'No learnings available.'}
          </pre>
        </div>
      </div>

      {/* RIGHT COLUMN: Reports */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ background: '#FFFFFF', padding: 24, borderRadius: 8, border: '1px solid #C8C9C6', flex: 1, display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: '#0E0D1F' }}>
              <FileText size={18} color="#0D9488" /> Incident Report
            </h2>
            <button 
              onClick={handleGenerateReport} 
              disabled={generating || !activeCase}
              style={{ background: '#0D9488', color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: 6, fontWeight: 500, fontSize: 13, cursor: 'pointer' }}
            >
              {generating ? 'Generating...' : 'Force Draft Report'}
            </button>
          </div>
          
          <div style={{ flex: 1, background: '#F7F6F2', borderRadius: 8, border: '1px solid #C8C9C6', padding: 16, overflowY: 'auto' }}>
            {report ? (
              <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: '#0E0D1F' }}>
                {report}
              </div>
            ) : (
              <div style={{ color: '#8E9096', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
                No report drafted yet. Resolve the case or force a draft.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
