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
    <div style={{ padding: 24, display: 'flex', gap: 24, height: '100%' }}>
      
      {/* LEFT COLUMN: Memory */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ background: '#FFF', padding: 24, borderRadius: 8, border: '1px solid #E4E8EF' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={18} /> Qdrant Vector Memory
          </h2>
          {stats ? (
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1, background: '#F8F9FB', padding: 12, borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: '#5A6578' }}>Historical Incidents</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#2563EB' }}>{stats.incidents_historical_count}</div>
              </div>
              <div style={{ flex: 1, background: '#F8F9FB', padding: 12, borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: '#5A6578' }}>Lessons Learned</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#7C3AED' }}>{stats.lessons_learned_count}</div>
              </div>
            </div>
          ) : (
            <div style={{ color: '#9CA3B4', fontSize: 13 }}>Loading stats...</div>
          )}
        </div>

        <div style={{ background: '#FFF', padding: 24, borderRadius: 8, border: '1px solid #E4E8EF', flex: 1, overflowY: 'auto' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#0F1729' }}>Current Learnings (System Prompt Injection)</h2>
          <pre style={{ fontSize: 12, fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', background: '#1E293B', color: '#E2E8F0', padding: 16, borderRadius: 8 }}>
            {learnings || 'No learnings available.'}
          </pre>
        </div>
      </div>

      {/* RIGHT COLUMN: Reports */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ background: '#FFF', padding: 24, borderRadius: 8, border: '1px solid #E4E8EF', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={18} /> Incident Report
            </h2>
            <button 
              onClick={handleGenerateReport} 
              disabled={generating || !activeCase}
              style={{ background: '#0F1729', color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: 6, fontWeight: 500, fontSize: 13, cursor: 'pointer' }}
            >
              {generating ? 'Generating...' : 'Force Draft Report'}
            </button>
          </div>
          
          <div style={{ flex: 1, background: '#F8F9FB', borderRadius: 8, border: '1px solid #E4E8EF', padding: 16, overflowY: 'auto' }}>
            {report ? (
              <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {report}
              </div>
            ) : (
              <div style={{ color: '#9CA3B4', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
                No report drafted yet. Resolve the case or force a draft.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
