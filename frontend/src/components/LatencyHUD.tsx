/**
 * frontend/src/components/LatencyHUD.tsx
 * Real-time latency monitor: shows the event→voice pipeline timing.
 */
import React, { useEffect, useState } from 'react'
import { getVoiceStatus } from '../services/api'
import { useCaseStore } from '../store/useCaseStore'

const P = '#0F1729', M = '#9CA3B4', BD = '#E4E8EF', CARD = '#FFFFFF'
const BLUE = '#2563EB', TEAL = '#0D9488', GREEN = '#16A34A', PURPLE = '#7C3AED', AMBER = '#D97706'

interface LatencyEntry {
  label: string
  key: string
  color: string
  description: string
}

const LATENCY_PIPELINE: LatencyEntry[] = [
  { label: 'Event Detected', key: 'event_detected', color: BLUE, description: 'Sensor → Backend' },
  { label: 'Risk Assessed', key: 'risk_assessed', color: PURPLE, description: 'LLM + Qdrant' },
  { label: 'Rime TTFB', key: 'rime_ttfb_ms', color: TEAL, description: 'First audio byte' },
  { label: 'Barge-in', key: 'rime_barge_in_ms', color: AMBER, description: 'Cancel latency' },
]

function LatencyBar({ ms, maxMs = 2000 }: { ms: number | null; maxMs?: number }) {
  const pct = ms != null ? Math.min((ms / maxMs) * 100, 100) : 0
  const color = ms == null ? M : ms < 500 ? GREEN : ms < 1000 ? TEAL : ms < 1500 ? AMBER : '#DC2626'
  return (
    <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#F1F3F7', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.3s ease' }} />
    </div>
  )
}

export default function LatencyHUD({ caseId }: { caseId?: string }) {
  const latencyMarks = useCaseStore(s => s.latencyMarks)
  const [voiceLatency, setVoiceLatency] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!caseId) return
    const fetch = async () => {
      try {
        const status = await getVoiceStatus(caseId)
        setVoiceLatency(status.latency_marks)
      } catch {}
    }
    fetch()
    const id = setInterval(fetch, 2000)
    return () => clearInterval(id)
  }, [caseId])

  const allLatency = { ...latencyMarks, ...voiceLatency }

  const getMs = (key: string): number | null => {
    const v = allLatency[key]
    return typeof v === 'number' ? v : null
  }

  return (
    <div style={{ background: CARD, borderRadius: 12, border: `1px solid ${BD}`, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${BD}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN,
          boxShadow: `0 0 6px ${GREEN}` }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: P, fontFamily: "'Plus Jakarta Sans', sans-serif",
          letterSpacing: '-0.01em' }}>
          Latency Monitor
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: M, fontFamily: "'JetBrains Mono', monospace" }}>
          LIVE
        </span>
      </div>

      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {LATENCY_PIPELINE.map(entry => {
          const ms = getMs(entry.key)
          return (
            <div key={entry.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: entry.color, flexShrink: 0 }} />
              <div style={{ width: 100, flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: P }}>{entry.label}</div>
                <div style={{ fontSize: 10, color: M }}>{entry.description}</div>
              </div>
              <LatencyBar ms={ms} />
              <div style={{
                width: 64, flexShrink: 0, textAlign: 'right' as const,
                fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
                color: ms != null ? entry.color : M,
              }}>
                {ms != null ? `${ms}ms` : '—'}
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary row */}
      <div style={{ padding: '8px 14px 10px', borderTop: `1px solid ${BD}`, display: 'flex', gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: M }}>Event → Voice</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: TEAL }}>
            {(() => {
              const e = getMs('event_detected')
              const r = getMs('rime_ttfb_ms')
              if (e != null && r != null) return `${Math.round(e + r)}ms`
              return '—'
            })()}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: M }}>Barge-in Cancel</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: AMBER }}>
            {getMs('rime_barge_in_ms') != null ? `${getMs('rime_barge_in_ms')}ms` : '—'}
          </div>
        </div>
      </div>
    </div>
  )
}
