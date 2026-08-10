/**
 * frontend/src/pages/LessonsLearned.tsx
 * Lessons learned from Qdrant — shows all resolved incidents and their debrief notes.
 */
import React, { useState, useEffect } from 'react'
import { getLessonsLearned } from '../services/api'
import { BookOpen, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'

const P = '#0F1729', S = '#5A6578', M = '#9CA3B4', BD = '#E4E8EF'
const CARD = '#FFFFFF', BG = '#F8F9FB'
const GREEN = '#16A34A', BLUE = '#2563EB', PURPLE = '#7C3AED'
const FD = "'Plus Jakarta Sans', sans-serif"
const FM = "'JetBrains Mono', monospace"

type Lesson = {
  id?: string
  case_id?: string
  zone_id?: string
  equipment_id?: string
  incident_type?: string
  contributing_factors?: string[]
  resolution?: string
  debrief?: string
  verified?: boolean
  ts?: string
  [key: string]: unknown
}

export default function LessonsLearned() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [filter, setFilter] = useState<'all' | 'verified' | 'recent'>('all')

  useEffect(() => {
    getLessonsLearned()
      .then(data => setLessons((data?.records ?? []) as Lesson[]))
      .catch(() => setLessons([]))
      .finally(() => setLoading(false))
  }, [])

  const displayed = lessons.filter(l => {
    if (filter === 'verified') return l.verified
    if (filter === 'recent') {
      const ts = l.ts ? new Date(l.ts).getTime() : 0
      return Date.now() - ts < 7 * 24 * 60 * 60 * 1000
    }
    return true
  })

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto', color: P }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${GREEN}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BookOpen size={20} color={GREEN} />
        </div>
        <div>
          <h1 style={{ fontFamily: FD, fontSize: 22, fontWeight: 800, color: P, margin: 0, letterSpacing: '-0.02em' }}>
            Lessons Learned
          </h1>
          <div style={{ fontSize: 13, color: S, marginTop: 3 }}>
            Organizational memory from resolved incidents — {lessons.length} entries in Qdrant
          </div>
        </div>
        {/* Filters */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {(['all', 'verified', 'recent'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
              border: `1px solid ${filter === f ? BLUE : BD}`,
              background: filter === f ? '#EFF6FF' : BG,
              color: filter === f ? BLUE : S, cursor: 'pointer',
              textTransform: 'capitalize' as const,
            }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          ['Total Lessons', lessons.length, BLUE, BookOpen],
          ['Verified', lessons.filter(l => l.verified).length, GREEN, CheckCircle],
          ['This Week', lessons.filter(l => l.ts && Date.now() - new Date(l.ts).getTime() < 7*86400000).length, PURPLE, Clock],
        ].map(([label, count, color, Icon]) => (
          <div key={label as string} style={{
            background: CARD, borderRadius: 12, border: `1px solid ${BD}`,
            padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
            flex: 1,
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}12`,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={15} color={color as string} />
            </div>
            <div>
              <div style={{ fontFamily: FD, fontSize: 20, fontWeight: 800, color: color as string, lineHeight: 1 }}>{count as number}</div>
              <div style={{ fontSize: 11, color: M }}>{label as string}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Lessons list */}
      {loading ? (
        <div style={{ textAlign: 'center' as const, padding: 48, color: M }}>Loading from Qdrant...</div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: 'center' as const, padding: 48, color: M, background: CARD, borderRadius: 12, border: `1px solid ${BD}` }}>
          <BookOpen size={32} color={M} style={{ margin: '0 auto 12px' }} />
          <div style={{ fontFamily: FD, fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No lessons yet</div>
          <div style={{ fontSize: 13 }}>Resolve a case with debrief to write your first lesson to Qdrant</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {displayed.map((lesson, i) => (
            <div key={i} style={{
              background: CARD, borderRadius: 14, border: `1px solid ${BD}`,
              borderLeft: `3px solid ${lesson.verified ? GREEN : M}`,
              overflow: 'hidden',
              boxShadow: expanded === i ? '0 4px 16px rgba(0,0,0,0.06)' : 'none',
            }}>
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                style={{
                  width: '100%', padding: '14px 18px', background: 'transparent', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' as const,
                }}
              >
                {lesson.verified
                  ? <CheckCircle size={16} color={GREEN} style={{ flexShrink: 0 }} />
                  : <Clock size={16} color={M} style={{ flexShrink: 0 }} />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FM, fontSize: 12, fontWeight: 700, color: BLUE, marginBottom: 2 }}>
                    {lesson.case_id ?? `LESSON-${i + 1}`}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: P, overflow: 'hidden', whiteSpace: 'nowrap' as const, textOverflow: 'ellipsis' }}>
                    {lesson.debrief ?? lesson.resolution ?? lesson.incident_type ?? 'Incident lesson'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  {lesson.zone_id && (
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5,
                      background: '#EFF6FF', color: BLUE, fontWeight: 600 }}>
                      {lesson.zone_id}
                    </span>
                  )}
                  {lesson.ts && (
                    <span style={{ fontSize: 10, color: M }}>
                      {new Date(lesson.ts as string).toLocaleDateString()}
                    </span>
                  )}
                  {expanded === i ? <ChevronUp size={13} color={M} /> : <ChevronDown size={13} color={M} />}
                </div>
              </button>

              {expanded === i && (
                <div style={{ padding: '0 18px 14px', borderTop: `1px solid ${BD}` }}>
                  <div style={{ paddingTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      ['Equipment', lesson.equipment_id],
                      ['Zone', lesson.zone_id],
                      ['Incident Type', lesson.incident_type?.replace(/_/g, ' ')],
                    ].filter(([, v]) => v).map(([k, v]) => (
                      <div key={k as string}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: M, textTransform: 'uppercase' as const, marginBottom: 2 }}>{k}</div>
                        <div style={{ fontSize: 12, color: P, fontWeight: 600 }}>{v as string}</div>
                      </div>
                    ))}
                  </div>
                  {lesson.contributing_factors && (lesson.contributing_factors as string[]).length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: M, textTransform: 'uppercase' as const, marginBottom: 6 }}>Contributing Factors</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                        {(lesson.contributing_factors as string[]).map((f, j) => (
                          <span key={j} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6,
                            background: '#FFF7ED', color: '#EA580C', border: '1px solid #EA580C22', fontWeight: 500 }}>
                            {f.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(lesson.debrief || lesson.resolution) && (
                    <div style={{ marginTop: 12, padding: 12, background: BG, borderRadius: 8, fontSize: 12, color: S, lineHeight: 1.6 }}>
                      {(lesson.debrief ?? lesson.resolution) as string}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
