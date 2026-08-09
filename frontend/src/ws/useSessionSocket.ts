/**
 * frontend/src/ws/useSessionSocket.ts
 *
 * React hook that bridges CaseWebSocket → Zustand store.
 *
 * Lifecycle:
 *   - Mounts: connect() called; handlers registered.
 *   - Unmounts: disconnect() called.
 *   - sessionId change: old socket disconnected, new one created.
 *
 * WS message routing:
 *   risk.updated       → appendEvidence, setLatencyMark('risk_updated')
 *   case.state_changed → updateCaseStage (re-derives currentStage)
 *   connection.status  → setWsStatus('connected')
 *   [status callbacks] → setWsStatus('reconnecting' | 'disconnected')
 */
import { useEffect, useRef } from 'react'
import { CaseWebSocket } from '../services/websocket'
import { useCaseStore, deriveStage } from '../store/useCaseStore'
import type { WsStatus } from '../types/api'

export function useSessionSocket(sessionId: string, onRawMessage?: (msg: any) => void): { status: WsStatus } {
  const appendEvidence = useCaseStore((s) => s.appendEvidence)
  const setLatencyMark = useCaseStore((s) => s.setLatencyMark)
  const updateCaseStage = useCaseStore((s) => s.updateCaseStage)
  const markStageReached = useCaseStore((s) => s.markStageReached)
  const setWsStatus = useCaseStore((s) => s.setWsStatus)
  const connectionStatus = useCaseStore((s) => s.connectionStatus)

  const socketRef = useRef<CaseWebSocket | null>(null)

  useEffect(() => {
    const socket = new CaseWebSocket(sessionId)
    socketRef.current = socket

    socket.onStatus((status) => {
      setWsStatus(status)
    })

    socket.onMessage((msg) => {
      switch (msg.type) {
        case 'connection.status':
          setWsStatus('connected')
          break
        case 'risk.updated':
          appendEvidence(msg.payload.evidence)
          setLatencyMark('risk_updated', Date.now())
          break
        case 'case.state_changed': {
          updateCaseStage(msg.payload.case_id, msg.payload.new_state)
          
          // The store already re-derives currentStage, but we need to derive it here
          // to know which stage to mark as reached.
          const newStage = deriveStage(msg.payload.new_state)
          if (newStage) {
            markStageReached(newStage)
          }
          break
        }
        // Other message types (transcript.delta, audit.entry, etc.) will be
        // handled in future PRs by dedicated hooks
        default:
          break
      }
      
      if (onRawMessage) {
        onRawMessage(msg)
      }
    })

    socket.connect()

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [sessionId, appendEvidence, setLatencyMark, updateCaseStage, markStageReached, setWsStatus, onRawMessage])

  return { status: connectionStatus }
}
