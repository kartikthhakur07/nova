import React, { useState } from 'react'
import { AuditEntry } from '../types/api'

export function AuditLogTable({ logs }: { logs: AuditEntry[] }) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  
  return (
    <div className="w-full text-left">
      {logs.map((log) => {
        const isAuth = log.action.includes('authoriz') || log.action.includes('auth')
        const isAuthYes = log.decision === 'yes' || (log.payload as any)?.decision === 'yes' || log.action.includes('approved')
        const isTool = log.action.includes('tool.executed')
        const borderClass = isAuth ? (isAuthYes ? 'border-l-tier-low' : 'border-l-tier-critical') : (isTool ? 'border-l-tier-high' : 'border-l-transparent')
        
        return (
          <div key={log.id} className={`border-b border-nova-border bg-nova-surface hover:bg-nova-surface-2 transition-colors cursor-pointer border-l-4 ${borderClass}`} onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}>
            <div className="flex items-center p-3">
              <div className="w-48 mono text-nova-text-muted text-sm">{log.ts}</div>
              <div className="flex-1 font-semibold text-nova-text-primary text-sm">{log.action}</div>
              <div className="flex-1 text-nova-text-secondary text-sm truncate">{JSON.stringify(log.payload)}</div>
            </div>
            {expandedRow === log.id && (
              <div className="p-4 bg-nova-bg border-t border-nova-border">
                <pre className="mono text-xs text-nova-text-primary whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(log.payload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
