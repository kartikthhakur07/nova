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
  const setLessonWritten = useCaseStore((s) => s.setLessonWritten)
  const setPendingAuth = useCaseStore((s) => s.setPendingAuth)
  const setUiFocusZone = useCaseStore((s) => s.setUiFocusZone)
  const setUiPanel = useCaseStore((s) => s.setUiPanel)
  const setUiAnnouncement = useCaseStore((s) => s.setUiAnnouncement)
  const setUiProposedEdit = useCaseStore((s) => s.setUiProposedEdit)
  const updateSensor = useCaseStore((s) => s.updateSensor)
  const addTickerItem = useCaseStore((s) => s.addTickerItem)

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
        case 'memory.write_back':
          setLessonWritten(msg.payload)
          break
        case 'authorization.requested':
          setPendingAuth({
            toolName: msg.payload.tool_name,
            actionPreview: msg.payload.action_preview
          })
          break
        case 'ui.focus_zone':
          setUiFocusZone(msg.payload.zone_id)
          break
        case 'ui.reset_view':
          setUiFocusZone(null)
          break
        case 'ui.open_panel':
          setUiPanel(msg.payload.panel, msg.payload.context)
          break
        case 'ui.close_panel':
          if (useCaseStore.getState().uiState.activePanel === msg.payload.panel) {
             setUiPanel(null)
          }
          break
        case 'ui.announce':
          setUiAnnouncement(msg.payload.text)
          break
        case 'ui.propose_edit':
          setUiProposedEdit(msg.payload)
          setUiPanel('authorization')
          break
        case 'ui.switch_screen':
          useCaseStore.getState().setNavTarget(msg.payload.screen)
          break
        case 'raw.telemetry':
          updateSensor(msg.payload)
          addTickerItem({ type: 'telemetry', data: msg.payload, ts: Date.now() })
          break
        case 'action.proposed':
        case 'action.resolved':
        case 'report.generated':
        case 'audit.entry':
          addTickerItem({ type: msg.type, data: msg.payload, ts: Date.now() })
          break
        // Other message types (transcript.delta, etc.) will be
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
    }
  }, [
    sessionId, appendEvidence, setLatencyMark, updateCaseStage, markStageReached, 
    setWsStatus, setLessonWritten, setPendingAuth, setUiFocusZone, setUiPanel, 
    setUiAnnouncement, setUiProposedEdit, updateSensor, addTickerItem, onRawMessage
  ])

  return { status: connectionStatus }
}
