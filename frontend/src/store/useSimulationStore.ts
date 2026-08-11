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
  authorizeAction: () => void
  rejectAction: () => void

  triggerAnomaly: (zone: string, type: 'gas' | 'pressure' | 'temp') => void
  resetTelemetry: () => void
}

const INITIAL_SENSORS: SensorReading[] = [
  { id: 's1', zone: 'Bay 1', type: 'H₂S', value: 2.1, unit: 'ppm', threshold: 10, status: 'normal', timestamp: Date.now() },
  { id: 's2', zone: 'Bay 1', type: 'CH₄', value: 0.8, unit: '%LEL', threshold: 20, status: 'normal', timestamp: Date.now() },
  { id: 's3', zone: 'Bay 2', type: 'Pressure', value: 14.2, unit: 'bar', threshold: 18, status: 'normal', timestamp: Date.now() },
  { id: 's4', zone: 'Bay 2', type: 'Temp', value: 78, unit: '°C', threshold: 120, status: 'normal', timestamp: Date.now() },
  { id: 's5', zone: 'Bay 3', type: 'H₂S', value: 3.4, unit: 'ppm', threshold: 10, status: 'normal', timestamp: Date.now() },
  { id: 's6', zone: 'Bay 3', type: 'O₂', value: 20.8, unit: '%', threshold: 19.5, status: 'normal', timestamp: Date.now() },
  { id: 's7', zone: 'Bay 4', type: 'CH₄', value: 1.2, unit: '%LEL', threshold: 20, status: 'normal', timestamp: Date.now() },
  { id: 's8', zone: 'Bay 4', type: 'Vibration', value: 2.1, unit: 'mm/s', threshold: 7, status: 'normal', timestamp: Date.now() },
  { id: 's9', zone: 'Bay 5', type: 'Temp', value: 65, unit: '°C', threshold: 120, status: 'normal', timestamp: Date.now() },
  { id: 's10', zone: 'Bay 5', type: 'Flow', value: 340, unit: 'L/min', threshold: 500, status: 'normal', timestamp: Date.now() },
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

  authorizeAction: () => {
    const { addEvent, proposedAction } = get()
    addEvent({ type: 'authorization', message: `Action authorized by supervisor: ${proposedAction}`, risk: 'normal' })
    set({ authorizationPending: false, proposedAction: null, evidenceOpen: false, compoundRiskScore: 0.22, riskLevel: 'normal' })
    import('../engine/realSystemEngine').then(m => {
      m.novaSpeakSimulation("Authorization confirmed. Executing emergency response protocol and isolating gas manifold line.")
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
