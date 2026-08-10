import React from 'react'

export function DebriefCapture({ isResolving, question, answer }: { isResolving: boolean, question?: string, answer?: string }) {
  if (!isResolving) {
    return <div className="p-6 text-nova-text-muted border border-nova-border bg-nova-surface rounded-radius text-center">Debrief pending case resolution</div>
  }
  return (
    <div className="p-6 border border-tier-low/20 bg-tier-low-bg rounded-radius">
      <h3 className="font-display text-lg mb-2 text-nova-text-primary">Debrief</h3>
      <p className="text-nova-text-secondary mb-4">{question || "What went wrong?"}</p>
      <div className="p-4 bg-nova-bg rounded-radius-sm text-nova-text-primary">{answer || "Waiting for officer's response..."}</div>
    </div>
  )
}
