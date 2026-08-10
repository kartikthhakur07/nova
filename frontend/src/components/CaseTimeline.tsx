import React from 'react'

interface CaseTimelineProps {
  variant: 'compact' | 'full'
  stages: { stage: string; ts?: string; icon?: React.ReactNode }[]
  onStageClick?: (stage: string) => void
}

export function CaseTimeline({ variant, stages, onStageClick }: CaseTimelineProps) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center space-x-2 h-10 px-4 bg-nova-surface border-b border-nova-border">
        {stages.map((s, i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${s.ts ? 'bg-tier-low' : 'bg-nova-text-muted opacity-30'}`} />
        ))}
      </div>
    )
  }
  return (
    <div className="flex flex-col space-y-4">
      {stages.map((s, i) => (
        <div key={i} className="flex items-center cursor-pointer p-2 hover:bg-nova-surface-2" onClick={() => onStageClick && onStageClick(s.stage)}>
          <div className={`w-4 h-4 rounded-full mr-3 ${s.ts ? 'bg-tier-low' : 'border-2 border-nova-text-muted bg-transparent opacity-30'}`} />
          <div className={`flex-1 capitalize ${s.ts ? 'text-nova-text-primary' : 'text-nova-text-muted'}`}>{s.stage}</div>
          {s.ts && <div className="mono text-nova-text-muted text-xs">{s.ts}</div>}
        </div>
      ))}
    </div>
  )
}
