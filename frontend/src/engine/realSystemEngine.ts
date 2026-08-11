/**
 * realSystemEngine.ts
 *
 * Upgraded AI pipeline:
 *  1. Deepgram STT WebSocket → real-time transcription
 *  2. Groq LLM (llama-3.3-70b) with ReAct system prompt → JSON {spoken, actions[]}
 *  3. Execute UI actions from LLM (zoom, panels, authorize, etc.)
 *  4. Deepgram TTS → speak response via Web Audio
 *
 * Telemetry stream runs independently every 2s updating sensor readings.
 */

import { useSimulationStore } from '../store/useSimulationStore'
import { startDeepgramListening, stopDeepgramListening, deepgramSpeak, stopCurrentTTS } from './deepgramVoice'

let streamInterval: ReturnType<typeof setInterval> | null = null
let lastSpokenAnomalyZone: string | null = null
let isListeningActive = false

// ─── Telemetry Stream ─────────────────────────────────────────────────────── //

export function startLiveTelemetryStream() {
  if (streamInterval) clearInterval(streamInterval)

  const store = useSimulationStore.getState
  store().startSimulation()

  streamInterval = setInterval(() => {
    const s = store()
    if (!s.isRunning) return

    const updatedSensors = s.sensors.map(sensor => {
      const jitter = (Math.random() - 0.48) * (sensor.type === 'Temp' ? 1.2 : sensor.type === 'Flow' ? 5 : 0.2)
      const newVal = Math.max(0, parseFloat((sensor.value + jitter).toFixed(1)))
      let status: 'normal' | 'warning' | 'critical' = 'normal'
      if (newVal >= sensor.threshold) status = 'critical'
      else if (newVal >= sensor.threshold * 0.75) status = 'warning'
      return { ...sensor, value: newVal, status, timestamp: Date.now() }
    })

    const criticals = updatedSensors.filter(x => x.status === 'critical')
    const warnings = updatedSensors.filter(x => x.status === 'warning')
    const risk = Math.min(1.0, parseFloat((0.12 + criticals.length * 0.35 + warnings.length * 0.15).toFixed(2)))
    let tier: 'normal' | 'elevated' | 'high' | 'critical' = 'normal'
    if (risk >= 0.75) tier = 'critical'
    else if (risk >= 0.50) tier = 'high'
    else if (risk >= 0.30) tier = 'elevated'

    useSimulationStore.setState({ sensors: updatedSensors, compoundRiskScore: risk, riskLevel: tier })

    if (criticals.length > 0) {
      const top = criticals[0]
      if (lastSpokenAnomalyZone !== top.zone) {
        lastSpokenAnomalyZone = top.zone
        s.focusZone(top.zone)
        s.setEvidenceOpen(true)
        s.setAuthorizationPending(true, `Isolate gas line and suspend active operations in ${top.zone}`)
        s.addEvent({
          type: 'nova-action',
          message: `Autonomous Nova Alert: ${top.type} breach in ${top.zone} (${top.value} ${top.unit})`,
          zone: top.zone,
          risk: 'critical',
        })

        generateReActResponse(`CRITICAL ALERT: ${top.type} is at ${top.value} ${top.unit} in ${top.zone}, threshold is ${top.threshold} ${top.unit}. Issue an immediate concise 2-sentence safety alert to the supervisor. The action should be ZOOM_BAY to zoom into the affected bay.`)
          .then(result => {
            executeActions(result.actions)
            return novaSpeakSimulation(result.spoken)
          })
          .catch(() =>
            novaSpeakSimulation(`Attention: Telemetry anomaly in ${top.zone}. ${top.type} is at ${top.value} ${top.unit}. Authorization required to isolate manifold.`)
          )
      }
    } else {
      lastSpokenAnomalyZone = null
    }
  }, 2000)
}

export function stopLiveTelemetryStream() {
  if (streamInterval) {
    clearInterval(streamInterval)
    streamInterval = null
  }
  useSimulationStore.getState().stopSimulation()
}

// ─── Nova TTS (public API, used by store actions) ─────────────────────────── //

export async function novaSpeakSimulation(text: string): Promise<void> {
  return deepgramSpeak(text)
}

// ─── ReAct LLM Loop ──────────────────────────────────────────────────────── //

const GROQ_API_KEY = (import.meta as any).env?.VITE_GROQ_API_KEY || ''

const ACTION_SCHEMA = `
Available actions (return as JSON array of strings):
- "ZOOM:Bay 1" through "ZOOM:Bay 5" — zoom into a bay
- "RESET_VIEW" — zoom out to plant overview
- "SHOW_EVIDENCE" — open evidence panel
- "HIDE_EVIDENCE" — close evidence panel
- "SHOW_TRACKS" — show recent memory tracks
- "SHOW_AUDIT" — show audit trail
- "SHOW_SIGNALS" — show sensor signals view
- "AUTHORIZE" — authorize pending action
- "REJECT" — reject pending action
- "NONE" — no UI action needed
`

export async function generateReActResponse(userQuery: string): Promise<{ spoken: string; actions: string[] }> {
  const store = useSimulationStore.getState()

  if (!GROQ_API_KEY) {
    return fallbackReAct(userQuery, store)
  }

  const sensorsCtx = store.sensors
    .map(s => `${s.zone} ${s.type}: ${s.value}${s.unit} [threshold ${s.threshold}${s.unit}, ${s.status.toUpperCase()}]`)
    .join('; ')

  const systemPrompt = `You are NOVA, an autonomous AI Industrial Safety Officer for a chemical plant.
You are responding to the human supervisor via VOICE ONLY — no markdown, no bullets, no formatting.

LIVE PLANT STATE:
- Sensors: ${sensorsCtx}
- Compound Risk Score: ${store.compoundRiskScore.toFixed(2)} (${store.riskLevel.toUpperCase()})
- Focused Zone: ${store.focusedZone || 'Plant Overview'}
- Authorization Pending: ${store.authorizationPending ? store.proposedAction : 'None'}
- Active Permits: PTW-0441 (Hot-Work Bay 3, Rajesh Kumar), PTW-0439 (Electrical Bay 1, Suresh Patel)
- Qdrant Memory Match: INC-2024-041 (H2S + welding permit, similarity 0.88)

${ACTION_SCHEMA}

You MUST respond in this exact JSON format (no other text):
{
  "spoken": "Your spoken response here — 1 to 3 natural sentences, clean text only.",
  "actions": ["ACTION_1", "ACTION_2"]
}

Rules:
1. "spoken" must be clean speech-ready text. No symbols, no markdown.
2. "actions" must be an array of valid action strings from the schema above.
3. Always include at least one action (use "NONE" if no UI change needed).
4. Be authoritative and concise as a real AI safety officer.`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery },
        ],
        temperature: 0.2,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) throw new Error(`Groq HTTP ${res.status}`)

    const data = await res.json()
    const raw = data?.choices?.[0]?.message?.content?.trim() || '{}'
    const parsed = JSON.parse(raw)

    return {
      spoken: (parsed.spoken || '').replace(/[*_#~`[\]]/g, '').trim(),
      actions: Array.isArray(parsed.actions) ? parsed.actions : ['NONE'],
    }
  } catch (err) {
    console.warn('[ReAct] LLM error, using fallback:', err)
    return fallbackReAct(userQuery, store)
  }
}

function fallbackReAct(query: string, store: any): { spoken: string; actions: string[] } {
  const lower = query.toLowerCase()
  const actions: string[] = []
  let spoken = ''

  const bayMatch = lower.match(/bay\s*([1-5])/i)
  if (bayMatch) {
    const bay = `Bay ${bayMatch[1]}`
    actions.push(`ZOOM:${bay}`)
    const zoneSensors = store.sensors.filter((s: any) => s.zone === bay)
    const summary = zoneSensors.map((s: any) => `${s.type} is ${s.value} ${s.unit}`).join(', ')
    spoken = `Zooming into ${bay}. Live readings: ${summary}. Risk tier is ${store.riskLevel.toUpperCase()}.`
  } else if (lower.includes('overview') || lower.includes('zoom out') || lower.includes('reset')) {
    actions.push('RESET_VIEW')
    spoken = `Resetting to plant overview. Compound risk score is ${store.compoundRiskScore.toFixed(2)}.`
  } else if (lower.includes('evidence') || lower.includes('why')) {
    actions.push('SHOW_EVIDENCE')
    spoken = `Opening evidence panel with compound risk factors and permit correlations.`
  } else if (lower.includes('authorize') || lower.includes('approve') || lower.includes('confirm')) {
    actions.push('AUTHORIZE')
    spoken = `Authorization confirmed. Executing emergency response protocol.`
  } else if (lower.includes('reject') || lower.includes('deny')) {
    actions.push('REJECT')
    spoken = `Action rejected. Maintaining current monitoring status.`
  } else if (lower.includes('critical') || lower.includes('alert') || lower.includes('anomal')) {
    const crit = store.sensors.find((s: any) => s.status === 'critical')
    if (crit) {
      actions.push(`ZOOM:${crit.zone}`)
      spoken = `CRITICAL: ${crit.type} in ${crit.zone} is at ${crit.value} ${crit.unit}, exceeding threshold of ${crit.threshold} ${crit.unit}. Immediate action required.`
    } else {
      actions.push('NONE')
      spoken = `All sensors currently within safe operational thresholds. Compound risk is ${store.riskLevel}.`
    }
  } else {
    actions.push('NONE')
    spoken = `Facility compound risk score is ${store.compoundRiskScore.toFixed(2)}, classified as ${store.riskLevel.toUpperCase()} tier. All five bays are monitored continuously.`
  }

  return { spoken, actions }
}

// ─── Action Executor ──────────────────────────────────────────────────────── //

function executeActions(actions: string[]) {
  const store = useSimulationStore.getState()

  for (const action of actions) {
    if (action.startsWith('ZOOM:')) {
      const bay = action.replace('ZOOM:', '').trim()
      store.setOverlayView('none')
      store.focusZone(bay)
    } else if (action === 'RESET_VIEW') {
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
    } else if (action === 'AUTHORIZE') {
      if (store.authorizationPending) store.authorizeAction()
    } else if (action === 'REJECT') {
      if (store.authorizationPending) store.rejectAction()
    }
  }
}

// ─── Voice Listener ───────────────────────────────────────────────────────── //

export function startRealVoiceListener() {
  isListeningActive = true

  startDeepgramListening((text, isFinal) => {
    if (!isFinal) {
      // Show interim transcript as a caption
      useSimulationStore.getState().setNovaCaption(`🎙 ${text}`)
      return
    }

    // Final transcript → stop any current TTS → process
    stopCurrentTTS()

    const store = useSimulationStore.getState()
    store.setNovaCaption('')
    store.setNovaState('processing')
    store.addEvent({
      type: 'nova-action',
      message: `Voice: "${text}"`,
      risk: 'normal',
    })

    generateReActResponse(text)
      .then(result => {
        executeActions(result.actions)
        return novaSpeakSimulation(result.spoken)
      })
      .catch(err => {
        console.error('[Voice] Processing error:', err)
        store.setNovaState('listening')
      })
  })
}

export function stopRealVoiceListener() {
  isListeningActive = false
  stopDeepgramListening()
}
