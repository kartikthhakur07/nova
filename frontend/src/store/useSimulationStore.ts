import { create } from 'zustand'

export type Scene = 'landing' | 'plant-resting' | 'zone-focus' | 'evidence' | 'authorization' | 'resolved'
export type NovaState = 'idle' | 'listening' | 'processing' | 'speaking'
export type RiskLevel = 'normal' | 'elevated' | 'high' | 'critical'
export type OverlayView = 'none' | 'tracks' | 'audit' | 'signals' | 'memory'

export interface SensorReading {
  id: string
  zone: string
  type: string
  value: number
  unit: string
  threshold: number
  status: 'normal' | 'warning' | 'critical'
  timestamp: number
}

export interface BriefingPayload {
  salutation: string
  summary: string
  highlights: string[]
  spoken_text: string
}

export interface DemoEvent {
  id: string
  timestamp: number
  type: 'sensor' | 'permit' | 'cctv' | 'maintenance' | 'nova-action' | 'authorization'
  message: string
  zone?: string
  risk?: RiskLevel
}

interface SimulationStore {
  isRunning: boolean
  startSimulation: () => void
  stopSimulation: () => void

  briefingActive: boolean
  briefingData: BriefingPayload | null
  isFetchingBriefing: boolean
  setBriefingActive: (active: boolean) => void
  setBriefingData: (data: BriefingPayload | null) => void
  setIsFetchingBriefing: (loading: boolean) => void

  currentScene: Scene
  focusedZone: string | null
  activeOverlayView: OverlayView
  setOverlayView: (view: OverlayView) => void
  setScene: (scene: Scene) => void
  focusZone: (zoneId: string) => void
  resetView: () => void

  novaState: NovaState
  novaCaption: string
  novaMessage: string
  novaTranscript: string
  setNovaState: (state: NovaState) => void
  setNovaCaption: (caption: string) => void
  setNovaMessage: (msg: string) => void
  setNovaTranscript: (t: string) => void

  sensors: SensorReading[]
  updateSensor: (id: string, value: number, status: SensorReading['status']) => void
  setSensors: (sensors: SensorReading[]) => void

  events: DemoEvent[]
  addEvent: (event: Omit<DemoEvent, 'id' | 'timestamp'>) => void
  clearEvents: () => void

  compoundRiskScore: number
  riskLevel: RiskLevel
  setRiskScore: (score: number) => void

  evidenceOpen: boolean
  setEvidenceOpen: (open: boolean) => void

  authorizationPending: boolean
  proposedAction: string | null
  setAuthorizationPending: (pending: boolean, action?: string) => void
  clearBayRisk: (targetZone?: string) => void
  authorizeAction: () => void
  rejectAction: () => void

  triggerAnomaly: (zone: string, type: 'gas' | 'pressure' | 'temp') => void
  resetTelemetry: () => void
}

const INITIAL_SENSORS: SensorReading[] = [
  // Bay 1 — Distillation & Feedstock
  { id: 's1_1', zone: 'Bay 1', type: 'H₂S', value: 2.1, unit: 'ppm', threshold: 10, status: 'normal', timestamp: Date.now() },
  { id: 's1_2', zone: 'Bay 1', type: 'CH₄', value: 0.8, unit: '%LEL', threshold: 20, status: 'normal', timestamp: Date.now() },
  { id: 's1_3', zone: 'Bay 1', type: 'Temp', value: 85, unit: '°C', threshold: 120, status: 'normal', timestamp: Date.now() },

  // Bay 2 — Heat Exchanger Loop
  { id: 's2_1', zone: 'Bay 2', type: 'Pressure', value: 14.2, unit: 'bar', threshold: 18, status: 'normal', timestamp: Date.now() },
  { id: 's2_2', zone: 'Bay 2', type: 'Temp', value: 78, unit: '°C', threshold: 120, status: 'normal', timestamp: Date.now() },
  { id: 's2_3', zone: 'Bay 2', type: 'H₂S', value: 1.5, unit: 'ppm', threshold: 10, status: 'normal', timestamp: Date.now() },

  // Bay 3 — Compressor & Refining
  { id: 's3_1', zone: 'Bay 3', type: 'H₂S', value: 3.4, unit: 'ppm', threshold: 10, status: 'normal', timestamp: Date.now() },
  { id: 's3_2', zone: 'Bay 3', type: 'CH₄', value: 1.1, unit: '%LEL', threshold: 20, status: 'normal', timestamp: Date.now() },
  { id: 's3_3', zone: 'Bay 3', type: 'Pressure', value: 12.8, unit: 'bar', threshold: 18, status: 'normal', timestamp: Date.now() },

  // Bay 4 — Storage Spheres & Recovery
  { id: 's4_1', zone: 'Bay 4', type: 'CH₄', value: 1.2, unit: '%LEL', threshold: 20, status: 'normal', timestamp: Date.now() },
  { id: 's4_2', zone: 'Bay 4', type: 'Pressure', value: 15.1, unit: 'bar', threshold: 18, status: 'normal', timestamp: Date.now() },
  { id: 's4_3', zone: 'Bay 4', type: 'Temp', value: 55, unit: '°C', threshold: 120, status: 'normal', timestamp: Date.now() },

  // Bay 5 — Loading Dock & Finishing
  { id: 's5_1', zone: 'Bay 5', type: 'Temp', value: 65, unit: '°C', threshold: 120, status: 'normal', timestamp: Date.now() },
  { id: 's5_2', zone: 'Bay 5', type: 'Flow', value: 340, unit: 'L/min', threshold: 500, status: 'normal', timestamp: Date.now() },
  { id: 's5_3', zone: 'Bay 5', type: 'Pressure', value: 11.4, unit: 'bar', threshold: 18, status: 'normal', timestamp: Date.now() },
]

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  isRunning: false,
  startSimulation: () => set({
    isRunning: true,
    currentScene: 'plant-resting',
    activeOverlayView: 'none',
    focusedZone: null,
    novaState: 'listening',
    novaCaption: '',
    events: [],
    compoundRiskScore: 0.12,
    riskLevel: 'normal',
    evidenceOpen: false,
    authorizationPending: false,
    proposedAction: null,
    sensors: INITIAL_SENSORS.map(s => ({ ...s, timestamp: Date.now() })),
  }),
  stopSimulation: () => set({ isRunning: false, novaState: 'idle' }),
  briefingActive: true,
  briefingData: null,
  isFetchingBriefing: false,
  setBriefingActive: (active) => set({ briefingActive: active }),
  setBriefingData: (data) => set({ briefingData: data }),
  setIsFetchingBriefing: (loading) => set({ isFetchingBriefing: loading }),

  currentScene: 'plant-resting',
  focusedZone: null,
  activeOverlayView: 'none',
  setOverlayView: (view) => set({ activeOverlayView: view }),
  setScene: (scene) => set({ currentScene: scene }),
  focusZone: (zoneId) => set({ focusedZone: zoneId, currentScene: 'zone-focus' }),
  resetView: () => set({ focusedZone: null, currentScene: 'plant-resting', evidenceOpen: false, activeOverlayView: 'none' }),

  novaState: 'idle',
  novaCaption: '',
  novaMessage: '',
  novaTranscript: '',
  setNovaState: (state) => set({ novaState: state }),
  setNovaCaption: (caption) => set({ novaCaption: caption }),
  setNovaMessage: (msg) => set({ novaMessage: msg }),
  setNovaTranscript: (t) => set({ novaTranscript: t }),

  sensors: [...INITIAL_SENSORS],
  updateSensor: (id, value, status) => set(s => ({
    sensors: s.sensors.map(sensor =>
      sensor.id === id ? { ...sensor, value, status, timestamp: Date.now() } : sensor
    )
  })),
  setSensors: (sensors) => set({ sensors }),

  events: [],
  addEvent: (event) => set(s => ({
    events: [{ ...event, id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, timestamp: Date.now() }, ...s.events].slice(0, 50)
  })),
  clearEvents: () => set({ events: [] }),

  compoundRiskScore: 0.12,
  riskLevel: 'normal',
  setRiskScore: (score) => set({
    compoundRiskScore: score,
    riskLevel: score < 0.3 ? 'normal' : score < 0.5 ? 'elevated' : score < 0.75 ? 'high' : 'critical'
  }),

  evidenceOpen: false,
  setEvidenceOpen: (open) => set({ evidenceOpen: open }),

  authorizationPending: false,
  proposedAction: null,
  setAuthorizationPending: (pending, action) => set({ authorizationPending: pending, proposedAction: action || null }),

  clearBayRisk: (targetZone) => {
    const { sensors, addEvent } = get()
    const resetSensors = sensors.map(s => {
      if (!targetZone || s.zone === targetZone) {
        return {
          ...s,
          status: 'normal' as const,
          value: s.type === 'H₂S' ? 2.1 : s.type === 'CH₄' ? 0.8 : s.type === 'Pressure' ? 14.2 : s.type === 'Temp' ? 65 : s.type === 'Flow' ? 340 : 2.1
        }
      }
      return s
    })
    set({
      sensors: resetSensors,
      compoundRiskScore: 0.12,
      riskLevel: 'normal',
      evidenceOpen: false,
      authorizationPending: false,
      proposedAction: null
    })
    addEvent({ type: 'permit', message: `Permit revoked & risks cleared for ${targetZone || 'all bays'}. Telemetry returned to normal.`, risk: 'normal' })
  },

  authorizeAction: () => {
    const { addEvent, proposedAction, clearBayRisk } = get()
    addEvent({ type: 'authorization', message: `Action authorized by supervisor: ${proposedAction || 'Isolate line & revoke permit'}`, risk: 'normal' })
    clearBayRisk()
    import('../engine/realSystemEngine').then(m => {
      m.novaSpeakSimulation("Authorization confirmed. Emergency isolation executed and hot work permit suspended. Telemetry risk cleared.")
    })
  },

  rejectAction: () => {
    const { addEvent, proposedAction } = get()
    addEvent({ type: 'authorization', message: `Action rejected: ${proposedAction}`, risk: 'elevated' })
    set({ authorizationPending: false, proposedAction: null })
    import('../engine/realSystemEngine').then(m => {
      m.novaSpeakSimulation("Authorization rejected by operator. Resuming continuous telemetry monitoring.")
    })
  },

  triggerAnomaly: (zone, type) => {
    const { updateSensor, addEvent, setRiskScore, focusZone, setEvidenceOpen, setAuthorizationPending } = get()
    const targetType = type === 'gas' ? 'H₂S' : type === 'pressure' ? 'Pressure' : 'Temp'
    const targetValue = type === 'gas' ? 14.8 : type === 'pressure' ? 22.4 : 138.5

    const sensor = get().sensors.find(s => s.zone === zone && s.type === targetType)
    if (sensor) {
      updateSensor(sensor.id, targetValue, 'critical')
    }

    addEvent({ type: 'sensor', message: `Critical telemetry spike: ${targetType} at ${targetValue} in ${zone}`, zone, risk: 'critical' })
    setRiskScore(0.85)
    focusZone(zone)
    setEvidenceOpen(true)
    setAuthorizationPending(true, `Isolate ${zone} manifold and suspend active permits`)
  },

  resetTelemetry: () => {
    set({
      sensors: INITIAL_SENSORS.map(s => ({ ...s, timestamp: Date.now() })),
      compoundRiskScore: 0.12,
      riskLevel: 'normal',
      focusedZone: null,
      currentScene: 'plant-resting',
      evidenceOpen: false,
      authorizationPending: false,
      proposedAction: null,
    })
    import('../engine/realSystemEngine').then(m => {
      m.novaSpeakSimulation("All telemetry parameters reset to nominal baseline.")
    })
  },
}))
