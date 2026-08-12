/**
 * frontend/src/pages/MemoryBrowser.tsx
 * Qdrant collection browser with hybrid search.
 */
import React, { useState, useEffect } from 'react'
import { getMemoryCollection, searchMemory } from '../services/api'
import { Database, Search, ChevronRight, Loader } from 'lucide-react'

const P = '#0F1729', S = '#5A6578', M = '#9CA3B4', BD = '#E4E8EF'
const CARD = '#FFFFFF', BG = '#F8F9FB'
const BLUE = '#2563EB', PURPLE = '#7C3AED'
const FD = "'Plus Jakarta Sans', sans-serif"
const FM = "'JetBrains Mono', monospace"

const COLLECTIONS = [
  { id: 'incidents_historical', label: 'Historical Incidents', color: PURPLE },
  { id: 'near_misses', label: 'Near Misses', color: '#EA580C' },
  { id: 'risk_patterns', label: 'Risk Patterns', color: '#D97706' },
  { id: 'safety_procedures', label: 'Safety Procedures', color: '#0D9488' },
  { id: 'maintenance_history', label: 'Maintenance History', color: BLUE },
  { id: 'equipment_registry', label: 'Equipment Registry', color: '#16A34A' },
  { id: 'lessons_learned', label: 'Lessons Learned', color: '#DC2626' },
  { id: 'active_case_memory', label: 'Active Case Memory', color: '#5A6578' },
]

export default function MemoryBrowser() {
  const [activeCollection, setActiveCollection] = useState('incidents_historical')
  const [records, setRecords] = useState<Record<string, unknown>[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Record<string, unknown>[] | null>(null)
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    setSearchResults(null)
    setQuery('')
    getMemoryCollection(activeCollection)
      .then(data => { setRecords(data?.records ?? []); setTotal(data?.total ?? 0) })
      .catch(() => { setRecords([]); setTotal(0) })
      .finally(() => setLoading(false))
  }, [activeCollection])

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await searchMemory(query, activeCollection)
      setSearchResults(res.results)
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const displayed = searchResults ?? records
  const activeCol = COLLECTIONS.find(c => c.id === activeCollection)

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden', background: BG }}>
      {/* Collection sidebar */}
      <aside style={{ width: 220, flexShrink: 0, background: CARD, borderRight: `1px solid ${BD}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: `1px solid ${BD}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Database size={14} color={PURPLE} />
            <span style={{ fontFamily: FD, fontSize: 13, fontWeight: 700, color: P }}>Qdrant Memory</span>
          </div>
          <div style={{ fontSize: 11, color: M, marginTop: 3 }}>{COLLECTIONS.length} collections</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
          {COLLECTIONS.map(col => (
            <button
              key={col.id}
              onClick={() => setActiveCollection(col.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', borderRadius: 8, marginBottom: 2,
                background: activeCollection === col.id ? `${col.color}0D` : 'transparent',
                border: `1px solid ${activeCollection === col.id ? col.color + '30' : 'transparent'}`,
                color: activeCollection === col.id ? col.color : S,
                cursor: 'pointer', textAlign: 'left' as const,
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: activeCollection === col.id ? 600 : 500, flex: 1 }}>
                {col.label}
              </span>
              {activeCollection === col.id && <ChevronRight size={11} />}
            </button>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '12px 20px', background: CARD, borderBottom: `1px solid ${BD}`,
          display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FD, fontSize: 14, fontWeight: 700, color: P }}>
              {activeCol?.label ?? activeCollection}
            </div>
            <div style={{ fontSize: 11, color: M, marginTop: 1 }}>
              {searchResults ? `${searchResults.length} search results` : `${total} records`}
            </div>
          </div>
          {/* Search */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ position: 'relative' as const }}>
              <Search size={12} color={M} style={{ position: 'absolute', top: '50%', left: 10, transform: 'translateY(-50%)' }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Hybrid semantic search..."
                style={{
                  padding: '7px 12px 7px 30px', borderRadius: 8, border: `1px solid ${BD}`,
                  background: BG, fontSize: 12, color: P, width: 240, outline: 'none',
                }}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              style={{
                padding: '7px 14px', borderRadius: 8, border: 'none',
                background: BLUE, color: '#fff', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              {searching ? <Loader size={12} /> : <Search size={12} />}
              Search
            </button>
            {searchResults && (
              <button onClick={() => { setSearchResults(null); setQuery('') }} style={{
                padding: '7px 12px', borderRadius: 8, border: `1px solid ${BD}`,
                background: 'transparent', color: S, fontSize: 12, cursor: 'pointer',
              }}>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Records grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <Loader size={20} color={M} />
            </div>
          ) : displayed.length === 0 ? (
            <div style={{ textAlign: 'center' as const, color: M, padding: 48, fontSize: 14 }}>
              {searchResults ? 'No results found' : 'Collection is empty — run seed_qdrant.py to populate'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {displayed.map((record, i) => (
                <div
                  key={i}
                  onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                  style={{
                    background: CARD, borderRadius: 12, border: `1px solid ${BD}`,
                    padding: 14, cursor: 'pointer',
                    borderLeft: `3px solid ${activeCol?.color ?? PURPLE}`,
                    boxShadow: expandedRow === i ? '0 4px 16px rgba(0,0,0,0.08)' : 'none',
                    transition: 'box-shadow 0.2s',
                  }}
                >
                  {/* Key fields */}
                  {Object.entries(record).slice(0, expandedRow === i ? undefined : 3).map(([k, v]) => (
                    k !== 'id' && (
                      <div key={k} style={{ marginBottom: 5 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: M, textTransform: 'uppercase' as const,
                          letterSpacing: '0.06em', fontFamily: FM }}>{k}: </span>
                        <span style={{ fontSize: 11, color: P }}>
                          {typeof v === 'string' ? (v.length > 80 && expandedRow !== i ? v.slice(0, 80) + '…' : v) : JSON.stringify(v)}
                        </span>
                      </div>
                    )
                  ))}
                  {expandedRow !== i && Object.keys(record).length > 3 && (
                    <div style={{ fontSize: 10, color: M, marginTop: 4 }}>+{Object.keys(record).length - 3} more fields</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
