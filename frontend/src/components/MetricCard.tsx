import React from 'react'

export function MetricCard({ name, value, subValue }: { name: string, value: string | number, subValue?: string }) {
  return (
    <div className="p-6 bg-nova-surface border border-nova-border rounded-radius flex flex-col justify-between h-32 hover:border-nova-border-strong transition-colors">
      <div className="text-sm font-medium text-nova-text-secondary capitalize">{name}</div>
      <div className="flex items-baseline space-x-2">
        <div className="mono text-3xl font-bold text-nova-text-primary">{value}</div>
        {subValue && <div className="mono text-sm text-nova-text-muted">{subValue}</div>}
      </div>
    </div>
  )
}
