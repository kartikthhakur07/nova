import React, { useState, useEffect } from 'react'
import { useCaseStore } from '../store/useCaseStore'

export function SystemStatusBar() {
  const connectionStatus = useCaseStore((s) => s.connectionStatus)
  const [time, setTime] = useState(new Date().toISOString())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toISOString())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const getStatusDisplay = () => {
    switch (connectionStatus) {
      case 'connected':
        return { color: 'bg-tier-low', text: 'Connected' }
      case 'reconnecting':
        return { color: 'bg-tier-medium', text: 'Reconnecting' }
      default:
        return { color: 'bg-tier-critical', text: 'Disconnected' }
    }
  }

  const status = getStatusDisplay()

  return (
    <div className="fixed bottom-0 left-0 right-0 h-8 bg-nova-surface border-t border-nova-border flex items-center justify-between px-4 z-50">
      <div className="mono text-xs text-nova-text-muted">
        NOVA v1.0
      </div>
      
      <div className="flex items-center space-x-2 text-xs text-nova-text-secondary">
        <div className={`w-2 h-2 rounded-full ${status.color}`} />
        <span>{status.text}</span>
      </div>

      <div className="mono text-xs text-nova-text-muted">
        {time}
      </div>
    </div>
  )
}
