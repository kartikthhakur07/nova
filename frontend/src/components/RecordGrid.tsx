import React from 'react'

export function RecordGrid({ records, filter }: { records: any[], filter: string }) {
  const filtered = records.filter(r => 
    JSON.stringify(r).toLowerCase().includes(filter.toLowerCase())
  )

  if (filtered.length === 0) {
    return <div className="p-8 text-center text-nova-text-muted">No records found.</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filtered.map((r, i) => (
        <div key={i} className="p-4 bg-nova-surface border border-nova-border rounded-radius hover:border-nova-border-strong transition-colors">
          <h4 className="font-medium text-nova-text-primary mb-2 truncate">{r.title || r.name || r.id || 'Untitled Record'}</h4>
          <div className="mono text-xs text-nova-text-muted mb-4">{r.date || r.ts || r.created_at || 'Unknown date'}</div>
          {r.similarity_score !== undefined && (
            <div className="mb-2 text-xs">
              <span className="text-nova-text-secondary">Relevance: </span>
              <span className="mono text-voice-active font-bold">{(r.similarity_score).toFixed(3)}</span>
            </div>
          )}
          <div className="text-xs text-nova-text-secondary truncate">
            {Object.entries(r).filter(([k]) => !['title','date','id','similarity_score'].includes(k)).map(([k,v]) => `${k}: ${v}`).join(' · ')}
          </div>
        </div>
      ))}
    </div>
  )
}
