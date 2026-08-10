import React from 'react'
import { AuditEntry } from '../types/api'

export function ExportAuditButton({ caseId, logs }: { caseId: string, logs: AuditEntry[] }) {
  const handleExport = () => {
    const dataStr = JSON.stringify(logs, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nova-audit-${caseId}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <button onClick={handleExport} className="px-4 py-2 bg-nova-surface-2 border border-nova-border hover:bg-nova-border text-nova-text-primary rounded-radius text-sm font-medium transition-colors">
      Export JSON
    </button>
  )
}
