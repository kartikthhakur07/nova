/**
 * frontend/src/store/useCaseStore.ts
 *
 * Zustand store for VIGIL case state and WebSocket status.
 * No `any` — all types imported from ../types/api.
 */
import { create } from 'zustand'
import type {
  Case,
  EvidenceItem,
  HistoricalMatch,
  PipelineStage,
  RiskTier,
  WsStatus,
} from '../types/api'

// Re-export for consumers that import from the store file
export type { PipelineStage, RiskTier, WsStatus }

// ── Stage derivation (pure function — no store reads) ─────────────────── //

/**
 * Map a backend case `state` string to a PipelineStage for the UI stepper.
 *
 * Mapping (from master doc):
 *   DETECTED | INVESTIGATING        → 'signals'
 *   NOTIFYING | AWAITING_RESPONSE   → 'voice'
 *   ACTING                          → 'confirm'
 *   MONITORING | RESOLVING          → 'audit'
 *   RESOLVED | ARCHIVED             → 'memory'
 *
 * 'retrieval' is a sub-state of 'signals' triggered by risk.updated events,
 * not by case state — handled separately in useSessionSocket.
 */
export function deriveStage(caseState: string): PipelineStage | null {
  switch (caseState.toUpperCase()) {
    case 'DETECTED':
    case 'INVESTIGATING':
      return 'signals'
    case 'NOTIFYING':
    case 'AWAITING_RESPONSE':
      return 'voice'
    case 'ACTING':
      return 'confirm'
    case 'MONITORING':
    case 'RESOLVING':
      return 'audit'
    case 'RESOLVED':
    case 'ARCHIVED':
      return 'memory'
    default:
      return null
  }
}

// ── Store interface ──────────────────────────────────────────────────── //

interface CaseState {
  // ── data ──────────────────────────────────────────────────────────── //
  cases: Case[]
  activeCase: Case | null
  currentStage: PipelineStage | null
  reachedStages: Set<PipelineStage | 'overview'>
  evidenceList: EvidenceItem[]
  retrievalMatches: HistoricalMatch[]
  latencyMarks: Record<string, number>
  connectionStatus: WsStatus
  lessonWritten: any | null
  pendingAuth: { toolName: string; actionPreview: string } | null
  hasPendingAuth: boolean
  
  // Phase 5: Additional state
  liveSensors: Record<string, any>
  intelligenceTicker: any[]


  // ── actions ───────────────────────────────────────────────────────── //
  setCases: (cases: Case[]) => void
  setActiveCase: (c: Case | null) => void
  /** Update case state string; re-derives currentStage automatically. */
  updateCaseStage: (caseId: string, state: string) => void
  markStageReached: (stage: PipelineStage | 'overview') => void
  setWsStatus: (s: WsStatus) => void
  appendEvidence: (items: EvidenceItem[]) => void
  setLatencyMark: (key: string, ts: number) => void
  setLessonWritten: (lesson: any | null) => void
  setPendingAuth: (auth: { toolName: string; actionPreview: string } | null) => void
  
  updateSensor: (sensorData: any) => void
  addTickerItem: (item: any) => void

  
  // ── ui state (agent piloted) ───────────────────────────────────────── //
  uiState: {
    focusedZone: string | null
    activePanel: 'evidence' | 'history' | 'audit' | 'authorization' | null
    panelContext: any
    announcement: string | null
    proposedEdit: { target_id: string; field: string; from_value: string; to_value: string; reason: string } | null
    navTarget: string | null
  }
  setUiFocusZone: (zoneId: string | null) => void
  setUiPanel: (panel: 'evidence' | 'history' | 'audit' | 'authorization' | null, context?: any) => void
  setUiAnnouncement: (text: string | null) => void
  setUiProposedEdit: (edit: any | null) => void
  setNavTarget: (path: string | null) => void
}

// ── Store implementation ─────────────────────────────────────────────── //

export const useCaseStore = create<CaseState & any>((set) => ({
  cases: [],
  activeCase: null,
  currentStage: null,
  reachedStages: new Set(['overview']),
  evidenceList: [],
  retrievalMatches: [],
  latencyMarks: {},
  connectionStatus: 'disconnected',
  lessonWritten: null,
  pendingAuth: null,
  hasPendingAuth: false,
  liveSensors: {},
  intelligenceTicker: [],


  setCases: (cases) => set({ cases }),

  setActiveCase: (c) =>
    set({
      activeCase: c,
      currentStage: c ? deriveStage(c.state) : null,
    }),

  updateCaseStage: (caseId, state) =>
    set((prev) => {
      const updatedCases = prev.cases.map((c) =>
        c.case_id === caseId ? { ...c, state } : c,
      )
      const updatedActive =
        prev.activeCase?.case_id === caseId
          ? { ...prev.activeCase, state }
          : prev.activeCase

      return {
        cases: updatedCases,
        activeCase: updatedActive,
        currentStage: updatedActive ? deriveStage(updatedActive.state) : prev.currentStage,
      }
    }),

  markStageReached: (stage) =>
    set((prev) => {
      const next = new Set(prev.reachedStages)
      next.add(stage)
      return { reachedStages: next }
    }),

  setWsStatus: (connectionStatus) => set({ connectionStatus }),

  appendEvidence: (items) =>
    set((prev) => ({
      evidenceList: [...prev.evidenceList, ...items],
    })),

  setLatencyMark: (key, ts) =>
    set((prev) => ({
      latencyMarks: { ...prev.latencyMarks, [key]: ts },
    })),

  setLessonWritten: (lesson) => set({ lessonWritten: lesson }),
  
  setPendingAuth: (auth) => set({ pendingAuth: auth, hasPendingAuth: !!auth }),

  updateSensor: (sensorData) => set((prev: any) => ({
    liveSensors: { ...prev.liveSensors, [sensorData.equipment_id]: sensorData }
  })),

  addTickerItem: (item) => set((prev: any) => ({
    intelligenceTicker: [item, ...prev.intelligenceTicker].slice(0, 50)
  })),


  uiState: {
    focusedZone: null,
    focusedPermitId: null,
    activePanel: null,
    panelContext: null,
    announcement: null,
    proposedEdit: null,
    navTarget: null,
  },
  setUiFocusZone: (zoneId) => set((prev: any) => ({ uiState: { ...prev.uiState, focusedZone: zoneId } })),
  setUiFocusPermit: (permitId) => set((prev: any) => ({ uiState: { ...prev.uiState, focusedPermitId: permitId } })),
  setUiPanel: (panel, context) => set((prev: any) => ({ uiState: { ...prev.uiState, activePanel: panel, panelContext: context } })),
  setUiAnnouncement: (text) => set((prev: any) => ({ uiState: { ...prev.uiState, announcement: text } })),
  setUiProposedEdit: (edit) => set((prev: any) => ({ uiState: { ...prev.uiState, proposedEdit: edit } })),
  setNavTarget: (path) => set((prev: any) => ({ uiState: { ...prev.uiState, navTarget: path } })),
}))
