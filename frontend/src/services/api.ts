/**
 * frontend/src/services/api.ts — Complete typed HTTP client for VIGIL REST API.
 */
import type {
  AuditEntry,
  AuthResult,
  Case,
  CollectionRecords,
  DemoStatus,
  RetrievalResponse,
  VoiceStatus,
  ZoneStatus,
} from '../types/api'

const BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'

// ── Core fetch helpers ───────────────────────────────────────────────────── //

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`
    try {
      const body: unknown = await res.json()
      if (
        typeof body === 'object' &&
        body !== null &&
        'detail' in body &&
        typeof (body as Record<string, unknown>).detail === 'string'
      ) {
        message = (body as Record<string, string>).detail
      }
    } catch {
      // ignore JSON parse failure
    }
    throw new Error(message)
  }

  return res.json() as Promise<T>
}

export function apiGet<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'GET' })
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// ── Case APIs ────────────────────────────────────────────────────────────── //

export function getCases(): Promise<Case[]> {
  return apiGet<Case[]>('/api/cases')
}

export function getCase(caseId: string): Promise<Case> {
  return apiGet<Case>(`/api/cases/${caseId}`)
}

export function getCaseAudit(caseId: string): Promise<AuditEntry[]> {
  return apiGet<AuditEntry[]>(`/api/cases/${caseId}/audit`)
}

export function postAuthorize(caseId: string, decision: 'yes' | 'no'): Promise<AuthResult> {
  return apiPost<AuthResult>(`/api/cases/${caseId}/authorize`, { decision })
}

export function postResolve(
  caseId: string,
  body: {
    debrief_text: string
    equipment_id?: string
    zone_id?: string
    contributing_factors?: string[]
  }
): Promise<{ case_id: string; resolved: boolean; lesson_id: string | null; ts: string }> {
  return apiPost(`/api/cases/${caseId}/resolve`, body)
}

// ── Zone / Factory APIs ──────────────────────────────────────────────────── //

export function getZones(): Promise<ZoneStatus[]> {
  return apiGet<ZoneStatus[]>('/api/factory/zones')
}

export function getFactoryState(): Promise<{
  timestamp: string
  zones: Array<{
    zone_id: string
    label: string
    risk_tier: string
    last_event: Record<string, unknown> | null
    equipment_count: number
  }>
  sensors: Array<{
    sensor_id: string
    name: string
    zone_id: string
    type: string
    value: number | null
    unit: string
    status: string
    last_reading_ts: string | null
  }>
  live_readings: Record<string, {
    gas_concentration_ppm: number
    temperature_c: number
    pressure_bar: number
    gas_trend: string
    lel_percent: number
  }>
}> {
  return apiGet('/api/factory/state')
}

export function getEquipmentStatus(): Promise<Array<{
  equipment_id: string
  name: string
  class: string
  zone_id: string
  status: string
  criticality: string
  health_pct: number
  last_serviced_days_ago: number
  overdue_maintenance: boolean
  alerts: string[]
}>> {
  return apiGet('/api/factory/equipment')
}

export function getProductionKPIs(): Promise<{
  timestamp: string
  production_rate_units_hr: number
  plant_efficiency_pct: number
  power_draw_kw: number
  active_alarms: number
  active_permits: number
  personnel_onsite: number
  personnel_by_zone: Record<string, number>
  mtbi_hours: number
  last_incident_days_ago: number
  shifts: { current: string; supervisor: string; changeover_in_min: number }
}> {
  return apiGet('/api/factory/kpis')
}

export function getActivePermits(): Promise<Array<{
  permit_id: string
  permit_type: string
  zone_id: string
  issued_to: string
  issued_at: string
  expires_at: string
  status: string
  equipment: string
}>> {
  return apiGet('/api/factory/permits')
}

// ── Memory APIs ──────────────────────────────────────────────────────────── //

export function getRetrieval(caseId: string): Promise<RetrievalResponse> {
  return apiGet<RetrievalResponse>(`/api/retrieval/${caseId}`)
}

export function getVoiceStatus(caseId: string): Promise<VoiceStatus> {
  return apiGet<VoiceStatus>(`/api/voice/${caseId}/status`)
}

export function getMemoryCollection(name: string, limit = 20): Promise<CollectionRecords> {
  return apiGet<CollectionRecords>(`/api/memory/collections/${name}?limit=${limit}`)
}

export function searchMemory(
  query: string,
  collection = 'incidents_historical',
  zone?: string
): Promise<{ collection: string; query: string; results: Record<string, unknown>[]; total: number }> {
  const params = new URLSearchParams({ q: query, collection })
  if (zone) params.set('zone', zone)
  return apiGet(`/api/memory/search?${params}`)
}

export function getLessonsLearned(): Promise<CollectionRecords> {
  return apiGet<CollectionRecords>('/api/memory/lessons')
}

export function getRetrievalTrace(caseId: string): Promise<{
  case_id: string
  traces: Array<{ collection: string; query: string; matches: unknown[]; count: number }>
}> {
  return apiGet(`/api/memory/retrieval-trace/${caseId}`)
}

export function triggerSpeak(caseId: string, text: string): Promise<{ case_id: string; queued: boolean; text: string }> {
  return apiPost('/api/voice/speak', { case_id: caseId, text })
}

export function cancelVoice(caseId: string): Promise<{ case_id: string; cancelled: boolean }> {
  return apiPost('/api/voice/cancel', { case_id: caseId })
}

// ── Demo APIs ────────────────────────────────────────────────────────────── //

export async function playScenario(scenarioId: string): Promise<void> {
  await apiPost<unknown>(`/api/demo/scenarios/${scenarioId}/play`, {})
}

export async function resetScenario(scenarioId: string): Promise<void> {
  await apiPost<unknown>(`/api/demo/scenarios/${scenarioId}/reset`, {})
}

export function getDemoStatus(): Promise<DemoStatus> {
  return apiGet<DemoStatus>('/api/demo/status')
}

export function getBenchmarkResults(): Promise<Record<string, unknown>> {
  return apiGet<Record<string, unknown>>('/api/benchmark/results')
}

// ── Explainability & Phase 3 APIs ────────────────────────────────────────── //

export function getTraces(caseId: string): Promise<any[]> {
  return apiGet(`/api/traces/${caseId}`)
}

export function getPrediction(caseId: string): Promise<any> {
  return apiGet(`/api/cases/${caseId}/prediction`)
}

export function getCounterfactual(caseId: string): Promise<any> {
  return apiGet(`/api/cases/${caseId}/counterfactual`)
}

export function getReport(caseId: string): Promise<{ report: string | null }> {
  return apiGet(`/api/cases/${caseId}/report`)
}

export function generateReport(caseId: string): Promise<{ report: string }> {
  return apiPost(`/api/cases/${caseId}/report/generate`, {})
}

export function getActions(caseId: string): Promise<{ pending: any[]; executed: any[] }> {
  return apiGet(`/api/cases/${caseId}/actions`)
}

export function proposeAction(caseId: string, permitId: string, reason: string): Promise<any> {
  return apiPost(`/api/cases/${caseId}/actions/propose?permit_id=${permitId}&reason=${reason}`, {})
}

export function resolveAction(actionId: string, approved: boolean): Promise<any> {
  return apiPost(`/api/actions/${actionId}/resolve`, { approved })
}

export function getMemoryStats(): Promise<{ incidents_historical_count: number; lessons_learned_count: number }> {
  return apiGet('/api/memory/stats')
}

export function getCurrentLearnings(): Promise<{ learnings: string }> {
  return apiGet('/api/memory/current-learnings')
}
