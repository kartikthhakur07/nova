import { useState, useEffect, useRef, useCallback } from 'react'
import { useSessionSocket } from '../ws/useSessionSocket'
import { apiGet, apiPost } from '../services/api'

interface DemoStatus {
  runner_active: boolean
  current_case_id: string | null
  current_step: number
  total_steps: number
}

export default function DemoControl() {
  const [status, setStatus] = useState<DemoStatus | null>(null)
  const [apiHealth, setApiHealth] = useState<'checking' | 'ok' | 'error'>('checking')
  const [wsEvents, setWsEvents] = useState<any[]>([])

  // Use a fixed session ID for the demo page as specified
  const { status: wsStatus } = useSessionSocket('demo-session', useCallback((msg) => {
    setWsEvents((prev) => {
      const updated = [msg, ...prev]
      return updated.slice(0, 20) // Keep last 20
    })
  }, []))

  const fetchStatus = useCallback(async () => {
    try {
      const data = await apiGet('/demo/status')
      setStatus(data as DemoStatus)
      setApiHealth('ok')
    } catch (err) {
      console.error('Failed to fetch demo status', err)
      setApiHealth('error')
    }
  }, [])

  // Poll every 2s
  useEffect(() => {
    fetchStatus()
    const id = setInterval(fetchStatus, 2000)
    return () => clearInterval(id)
  }, [fetchStatus])

  const handlePlay = async () => {
    try {
      await apiPost('/demo/play')
      fetchStatus()
    } catch (err) {
      console.error('Failed to play demo', err)
    }
  }

  const handleReset = async () => {
    try {
      await apiPost('/demo/reset')
      fetchStatus()
    } catch (err) {
      console.error('Failed to reset demo', err)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-gray-900 p-4 rounded shadow-lg border border-gray-800">
        <div>
          <h1 className="text-xl font-bold text-gray-100">VIGIL Demo Control</h1>
          <div className="flex gap-4 mt-2 text-sm">
            <span className={apiHealth === 'ok' ? 'text-green-400' : 'text-red-400'}>
              API: {apiHealth.toUpperCase()}
            </span>
            <span className={wsStatus === 'connected' ? 'text-green-400' : 'text-yellow-400'}>
              WS: {wsStatus.toUpperCase()}
            </span>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={handlePlay}
            disabled={status?.runner_active}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded disabled:opacity-50"
          >
            Play Scenario
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded"
          >
            Reset
          </button>
        </div>
      </div>

      {status && (
        <div className="bg-gray-800 p-4 rounded shadow">
          <h2 className="text-gray-300 font-medium mb-2">Runner Status</h2>
          <div className="grid grid-cols-2 gap-4 text-sm font-mono">
            <div>Active: <span className={status.runner_active ? 'text-green-400' : 'text-gray-400'}>{status.runner_active ? 'YES' : 'NO'}</span></div>
            <div>Case ID: <span className="text-blue-300">{status.current_case_id || 'none'}</span></div>
            <div>Step: <span className="text-yellow-300">{status.current_step} / {status.total_steps}</span></div>
          </div>
        </div>
      )}

      <div className="bg-gray-950 p-4 rounded shadow border border-gray-800 h-[500px] flex flex-col">
        <h2 className="text-gray-400 font-medium mb-4 flex justify-between">
          <span>WebSocket Event Log (last 20)</span>
          <span className="text-xs text-gray-600">Session: demo-session</span>
        </h2>
        <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs">
          {wsEvents.length === 0 ? (
            <div className="text-gray-600 italic">No events received yet...</div>
          ) : (
            wsEvents.map((ev, i) => (
              <div key={i} className="bg-gray-900 p-2 rounded border border-gray-800 overflow-x-auto text-gray-300">
                <span className="text-blue-400 font-bold">[{ev.type}]</span>{' '}
                <span className="text-gray-500">{JSON.stringify(ev.payload)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
