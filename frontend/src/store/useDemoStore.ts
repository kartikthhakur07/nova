import { create } from 'zustand'

export type Scene = 'landing' | 'plant-resting' | 'zone-focus' | 'evidence' | 'authorization' | 'resolved'
export type NovaState = 'idle' | 'listening' | 'processing' | 'speaking'
export type RiskLevel = 'normal' | 'elevated' | 'high' | 'critical'
export type OverlayView = 'none' | 'tracks' | 'audit' | 'signals' | 'memory'

interface SensorReading {
  id: string
  zone: string
  type: string
  value: number
  unit: string
  threshold: number
  status: 'normal' | 'warning' | 'critical'
  timestamp: number
}

interface DemoEvent {
  id: string
  timestamp: number
  type: 'sensor' | 'permit' | 'cctv' | 'maintenance' | 'nova-action' | 'authorization'
  message: string
  zone?: string
  risk?: RiskLevel
}

interface DemoStore {
  demoActive: boolean
  demoStep: number
  demoPhase: 'idle' | 'monitoring' | 'detecting' | 'analyzing' | 'alerting' | 'authorizing' | 'resolving' | 'resolved'
  startDemo: () => void
  stopDemo: () => void
  advanceDemo: () => void
  setDemoPhase: (phase: DemoStore['demoPhase']) => void

  currentScene: Scene
  focusedZone: string | null
  activeOverlayView: OverlayView
  setOverlayView: (view: OverlayView) => void
  setScene: (scene: Scene) => void
  focusZone: (zoneId: string) => void
  resetView: () => void

  novaState: NovaState
  novaMessage: string
  novaCaption: string
  setNovaState: (state: NovaState) => void
  setNovaMessage: (msg: string) => void
  setNovaCaption: (caption: string) => void

  sensors: SensorReading[]
  updateSensor: (id: string, value: number, status: SensorReading['status']) => void
  setSensors: (sensors: SensorReading[]) => void

  events: DemoEvent[]
  addEvent: (event: Omit<DemoEvent, 'id' | 'timestamp'>) => void
  clearEvents: () => void

  compoundRiskScore: number
  riskLevel: RiskLevel
  setRiskScore: (score: number) => void

  micPermissionGranted: boolean
  setMicPermission: (granted: boolean) => void

  evidenceOpen: boolean
  setEvidenceOpen: (open: boolean) => void

  authorizationPending: boolean
  proposedAction: string | null
  setAuthorizationPending: (pending: boolean, action?: string) => void
  authorizeAction: () => void
  rejectAction: () => void
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

export const useDemoStore = create<DemoStore>((set, get) => ({
  demoActive: false,
  demoStep: 0,
  demoPhase: 'idle',
  startDemo: () => set({ demoActive: true, demoStep: 0, demoPhase: 'monitoring', currentScene: 'plant-resting', activeOverlayView: 'none', events: [], sensors: INITIAL_SENSORS.map(s => ({ ...s, timestamp: Date.now() })) }),
  stopDemo: () => set({ demoActive: false, demoStep: 0, demoPhase: 'idle', currentScene: 'landing', activeOverlayView: 'none', focusedZone: null, novaState: 'idle', novaMessage: '', novaCaption: '', events: [], compoundRiskScore: 0, riskLevel: 'normal', evidenceOpen: false, authorizationPending: false, proposedAction: null }),
  advanceDemo: () => set(s => ({ demoStep: s.demoStep + 1 })),
  setDemoPhase: (phase) => set({ demoPhase: phase }),

  currentScene: 'landing',
  focusedZone: null,
  activeOverlayView: 'none',
  setOverlayView: (view) => set({ activeOverlayView: view }),
  setScene: (scene) => set({ currentScene: scene }),
  focusZone: (zoneId) => set({ focusedZone: zoneId, currentScene: 'zone-focus' }),
  resetView: () => set({ focusedZone: null, currentScene: 'plant-resting', evidenceOpen: false, activeOverlayView: 'none' }),

  novaState: 'idle',
  novaMessage: '',
  novaCaption: '',
  setNovaState: (state) => set({ novaState: state }),
  setNovaMessage: (msg) => set({ novaMessage: msg }),
  setNovaCaption: (caption) => set({ novaCaption: caption }),

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

  compoundRiskScore: 0,
  riskLevel: 'normal',
  setRiskScore: (score) => set({
    compoundRiskScore: score,
    riskLevel: score < 0.3 ? 'normal' : score < 0.5 ? 'elevated' : score < 0.75 ? 'high' : 'critical'
  }),

  micPermissionGranted: false,
  setMicPermission: (granted) => set({ micPermissionGranted: granted }),

  evidenceOpen: false,
  setEvidenceOpen: (open) => set({ evidenceOpen: open }),

  authorizationPending: false,
  proposedAction: null,
  setAuthorizationPending: (pending, action) => set({ authorizationPending: pending, proposedAction: action || null }),
  authorizeAction: () => {
    const { addEvent, proposedAction } = get()
    addEvent({ type: 'authorization', message: `Action authorized: ${proposedAction}`, risk: 'normal' })
    set({ authorizationPending: false, proposedAction: null })
  },
  rejectAction: () => {
    const { addEvent, proposedAction } = get()
    addEvent({ type: 'authorization', message: `Action rejected: ${proposedAction}`, risk: 'elevated' })
    set({ authorizationPending: false, proposedAction: null })
  },
}))
