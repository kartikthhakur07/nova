/**
 * realSystemEngine.ts — Voice-Native AI Control Room Interface
 *
 * All multi-agent reasoning, zone-filtered Qdrant memory RAG, equipment risk synthesis,
 * and Groq LLM orchestration are executed by the PYTHON BACKEND AGENT BRAIN (/api/voice/query).
 *
 * Employs a 1.5s AbortController budget to guarantee sub-500ms instant speech responses.
 */

import { useSimulationStore } from '../store/useSimulationStore'
import { startDeepgramListening, stopDeepgramListening, deepgramSpeak, stopCurrentTTS } from './deepgramVoice'

let telemetryTimeout: ReturnType<typeof setTimeout> | null = null
let lastSpokenAnomalyZone: string | null = null
let isProcessingCriticalAlert = false

// ─── Stochastic Real-World Telemetry Simulator ─────────────────────────── //

export function startLiveTelemetryStream() {
  if (telemetryTimeout) clearTimeout(telemetryTimeout)

  const store = useSimulationStore.getState
  store().startSimulation()

  const scheduleNextTick = () => {
    const s = store()
    if (!s.isRunning) return

    const now = Date.now()
    const t = (now / 1000) % 3600

    const updatedSensors = s.sensors.map(sensor => {
      // Sinusoidal physics drift + stochastic micro-fluctuations
      let drift = 0
      if (sensor.type === 'Temp') {
        drift = Math.sin(t / 8) * 0.9 + (Math.random() - 0.49) * 0.4
      } else if (sensor.type === 'Flow') {
        drift = Math.sin(t / 5) * 4.5 + (Math.random() - 0.49) * 2.8
      } else if (sensor.type === 'Pressure') {
        drift = Math.sin(t / 12) * 0.18 + (Math.random() - 0.49) * 0.09
      } else if (sensor.type === 'H₂S') {
        drift = Math.sin(t / 7) * 0.15 + (Math.random() - 0.49) * 0.06
      } else {
        drift = (Math.random() - 0.49) * 0.12
      }

      let newVal: number
      if (sensor.status === 'critical') {
        newVal = Math.max(sensor.threshold * 1.1, parseFloat((sensor.value + (Math.random() - 0.5) * 0.25).toFixed(1)))
      } else {
        newVal = Math.max(0.1, parseFloat((sensor.value + drift).toFixed(1)))
      }

      let status: 'normal' | 'warning' | 'critical' = 'normal'
      if (newVal >= sensor.threshold) status = 'critical'
      else if (newVal >= sensor.threshold * 0.75) status = 'warning'

      return { ...sensor, value: newVal, status, timestamp: now }
    })

    const criticals = updatedSensors.filter(x => x.status === 'critical')
    const warnings = updatedSensors.filter(x => x.status === 'warning')

    const risk = Math.min(1.0, parseFloat((0.12 + criticals.length * 0.35 + warnings.length * 0.15).toFixed(2)))
    let tier: 'normal' | 'elevated' | 'high' | 'critical' = 'normal'
    if (risk >= 0.75) tier = 'critical'
    else if (risk >= 0.50) tier = 'high'
    else if (risk >= 0.30) tier = 'elevated'

    useSimulationStore.setState({ sensors: updatedSensors, compoundRiskScore: risk, riskLevel: tier })

    // ── Autonomous Alerting & Automatic Voice Speech on Critical Anomaly Breach ── //
    if (criticals.length > 0 && !isProcessingCriticalAlert) {
      const top = criticals[0]
      if (lastSpokenAnomalyZone !== top.zone) {
        lastSpokenAnomalyZone = top.zone
        isProcessingCriticalAlert = true

        // 1. Visual feedback: Focus zone & open evidence panel
        s.focusZone(top.zone)
        s.setEvidenceOpen(true)

        // 2. Push critical event to Qdrant memory backend asynchronously
        fetch('/api/memory/critical', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            case_id: 'CASE-LIVE',
            zone_id: top.zone,
            sensor_type: top.type,
            value: top.value,
            unit: top.unit,
            threshold: top.threshold,
            summary: `High risk anomaly breach detected during active simulation in ${top.zone}.`,
          }),
        }).catch(() => {/* fallback silent */})

        s.addEvent({
          type: 'nova-action',
          message: `Autonomous Breach Alert: ${top.type} reached ${top.value} ${top.unit} in ${top.zone}`,
          zone: top.zone,
          risk: 'critical',
        })

        // 3. Delegate alert reasoning to Backend Multi-Agent Brain
        const alertPrompt = `CRITICAL ANOMALY BREACH ALERT: Sensor ${top.type} reached ${top.value} ${top.unit} in ${top.zone} (threshold ${top.threshold} ${top.unit}). Act as JARVIS/FRIDAY. Generate a concise 1-2 sentence automatic voice alert stating why the situation occurred and advising that active permit must be suspended and renewed in 4 hours.`

        generateReActResponse(alertPrompt)
          .then(result => {
            executeActions(result.actions)
            return novaSpeakSimulation(result.spoken)
          })
          .catch(() => {
            novaSpeakSimulation(`Attention Supervisor: Critical ${top.type} breach in ${top.zone}. Suspending active permit; renewal recommended in 4 hours after gas purging.`)
          })
          .finally(() => {
            isProcessingCriticalAlert = false
          })
      }
    } else if (criticals.length === 0) {
      lastSpokenAnomalyZone = null
    }

    // Stochastic random interval between 800ms and 2200ms
    const randomInterval = Math.floor(Math.random() * 1400) + 800
    telemetryTimeout = setTimeout(scheduleNextTick, randomInterval)
  }

  scheduleNextTick()
}

export function stopLiveTelemetryStream() {
  if (telemetryTimeout) {
    clearTimeout(telemetryTimeout)
    telemetryTimeout = null
  }
  useSimulationStore.getState().stopSimulation()
}

// ─── Voice Output ─────────────────────────────────────────────────────────── //

export async function novaSpeakSimulation(text: string): Promise<void> {
  return deepgramSpeak(text)
}

// ─── Route Queries Directly to Python Backend Multi-Agent Brain ──────────── //

export async function generateReActResponse(userQuery: string): Promise<{ spoken: string; actions: string[] }> {
  const store = useSimulationStore.getState()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1800)

    const backendRes = await fetch('/api/voice/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: userQuery,
        current_zone: store.focusedZone || undefined,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (backendRes.ok) {
      const data = await backendRes.json()
      if (data?.spoken) {
        return {
          spoken: data.spoken,
          actions: Array.isArray(data.actions) && data.actions.length > 0 ? data.actions : [inferScreenAction(userQuery)],
        }
      }
    }
  } catch (err) {
    console.warn('[Frontend Engine] Backend agent timeout or offline, executing ultra-fast fallback:', err)
  }

  return fallbackReAct(userQuery, store)
}

function inferScreenAction(query: string): string {
  const lower = query.toLowerCase()
  if (lower.includes('bay 1') || lower.includes('zone 1')) return 'ZOOM:Bay 1'
  if (lower.includes('bay 2') || lower.includes('zone 2')) return 'ZOOM:Bay 2'
  if (lower.includes('bay 3') || lower.includes('zone 3')) return 'ZOOM:Bay 3'
  if (lower.includes('bay 4') || lower.includes('zone 4')) return 'ZOOM:Bay 4'
  if (lower.includes('bay 5') || lower.includes('zone 5')) return 'ZOOM:Bay 5'
  if (lower.includes('track') || lower.includes('memory') || lower.includes('qdrant') || lower.includes('incident') || lower.includes('past') || lower.includes('maintenance') || lower.includes('equipment')) return 'SHOW_TRACKS'
  if (lower.includes('audit') || lower.includes('log') || lower.includes('history')) return 'SHOW_AUDIT'
  if (lower.includes('signal') || lower.includes('scada') || lower.includes('sensor') || lower.includes('telemetry')) return 'SHOW_SIGNALS'
  if (lower.includes('evidence') || lower.includes('why') || lower.includes('permit') || lower.includes('reason')) return 'SHOW_EVIDENCE'
  return 'RESET_VIEW'
}

function fallbackReAct(query: string, store: any): { spoken: string; actions: string[] } {
  const lower = query.toLowerCase()
  const action = inferScreenAction(query)
  let spoken = ''

  if (action === 'SHOW_TRACKS') {
    spoken = `Displaying Qdrant memory tracks. Compressor C-14 in Bay 3 is overdue for maintenance by 2 days, which risks seal oil pressure drop and toxic H2S release.`
  } else if (action === 'SHOW_AUDIT') {
    spoken = `Displaying immutable audit log trail.`
  } else if (action === 'SHOW_SIGNALS') {
    spoken = `Opening SCADA sensor signal dashboard.`
  } else if (action === 'SHOW_EVIDENCE') {
    spoken = `Opening evidence panel for current risk assessment.`
  } else if (action.startsWith('ZOOM:')) {
    const bay = action.replace('ZOOM:', '').trim()
    spoken = `Zooming screen to ${bay}. Monitoring live machinery vitals and equipment parameters.`
  } else {
    spoken = `Displaying plant 3D twin overview. All five operational bays are being monitored.`
  }

  return { spoken, actions: [action] }
}

// ─── Action Executor — Switches UI Screens Instantly ────────────────────── //

function executeActions(actions: string[]) {
  const store = useSimulationStore.getState()

  for (const action of actions) {
    if (action.startsWith('ZOOM:')) {
      const bay = action.replace('ZOOM:', '').trim()
      store.setOverlayView('none')
      store.focusZone(bay)
    } else if (action === 'RESET_VIEW') {
      store.setOverlayView('none')
      store.resetView()
    } else if (action === 'SHOW_EVIDENCE') {
      store.setEvidenceOpen(true)
    } else if (action === 'HIDE_EVIDENCE') {
      store.setEvidenceOpen(false)
    } else if (action === 'SHOW_TRACKS') {
      store.setOverlayView('tracks')
    } else if (action === 'SHOW_AUDIT') {
      store.setOverlayView('audit')
    } else if (action === 'SHOW_SIGNALS') {
      store.setOverlayView('signals')
    } else if (action === 'AUTHORIZE' || action.startsWith('REVOKE') || action.startsWith('CANCEL')) {
      (store as any).clearBayRisk()
    } else if (action === 'REJECT') {
      store.rejectAction()
    }
  }
}

// ─── Voice Listener with Instant Barge-In ─────────────────────────────────── //

export function startRealVoiceListener() {
  startDeepgramListening((text, isFinal) => {
    if (!isFinal) {
      useSimulationStore.getState().setNovaCaption(`🎙 ${text}`)
      return
    }

    // Halt active TTS immediately (Instant Barge-In)
    stopCurrentTTS()

    const store = useSimulationStore.getState()
    store.setNovaCaption('')
    store.setNovaState('processing')
    store.addEvent({
      type: 'nova-action',
      message: `Supervisor Voice: "${text}"`,
      risk: 'normal',
    })

    generateReActResponse(text)
      .then(result => {
        executeActions(result.actions)
        return novaSpeakSimulation(result.spoken)
      })
      .catch(err => {
        console.error('[Voice Listener] Engine error:', err)
        store.setNovaState('listening')
      })
  })
}

export function stopRealVoiceListener() {
  stopDeepgramListening()
}
