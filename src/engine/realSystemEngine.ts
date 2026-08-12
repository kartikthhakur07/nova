/**
 * realSystemEngine.ts — Autonomous Voice-Native AI Control Room Engine
 *
 * 1. Groq LLM (llama-3.3-70b-versatile) — Dynamic, grounded reasoning for every unique query
 * 2. Deepgram STT (Nova-3 WebSocket) — Speech recognition with sub-100ms voice barge-in
 * 3. Rime TTS (mist-v3 model, astra voice) — Natural human voice output
 * 4. High-Frequency Telemetry Stream — 1-second continuous vitals drift across all 5 plant bays
 * 5. Autonomous Action Execution — Unscripted UI camera zooming, evidence drawer, permit actions
 */

import { useSimulationStore } from '../store/useSimulationStore'
import { startDeepgramListening, stopDeepgramListening, deepgramSpeak, stopCurrentTTS } from './deepgramVoice'

let streamInterval: ReturnType<typeof setInterval> | null = null

// Groq LLM API Key (Fallback to .env default if VITE env variable not set)
const GROQ_API_KEY = (import.meta as any).env?.VITE_GROQ_API_KEY || (import.meta as any).env?.LLM_API_KEY || ''

// ─── Real-Time 1-Second Continuous Telemetry Stream ───────────────────── //

export function startLiveTelemetryStream() {
  if (streamInterval) clearInterval(streamInterval)

  const store = useSimulationStore.getState
  store().startSimulation()

  // 1-second continuous vitals loop updating all 5 bays dynamically
  streamInterval = setInterval(() => {
    const s = store()
    if (!s.isRunning) return

    const now = Date.now()
    const t = (now / 1000) % 3600

    const updatedSensors = s.sensors.map(sensor => {
      // Natural sinusoidal physics drift + micro-fluctuations
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
  }, 1000) // 1000ms = 1 SECOND TICK
}

export function stopLiveTelemetryStream() {
  if (streamInterval) {
    clearInterval(streamInterval)
    streamInterval = null
  }
  useSimulationStore.getState().stopSimulation()
}

// ─── Voice Output ─────────────────────────────────────────────────────────── //

export async function novaSpeakSimulation(text: string): Promise<void> {
  return deepgramSpeak(text)
}

// ─── Groq Voice-Native Agent ──────────────────────────────────────────────── //

const ACTION_SCHEMA = `
Available actions (return as JSON array of strings):
- "ZOOM:Bay 1" through "ZOOM:Bay 5" — camera zoom to specific bay
- "RESET_VIEW" — zoom out to plant overview
- "SHOW_EVIDENCE" — open compound risk evidence drawer
- "HIDE_EVIDENCE" — close evidence drawer
- "SHOW_TRACKS" — view Qdrant memory tracks
- "SHOW_AUDIT" — view immutable audit log
- "SHOW_SIGNALS" — view SCADA signal dashboard
- "AUTHORIZE" — execute pending safety action
- "REJECT" — reject pending safety action
- "NONE" — no UI action needed
`

export async function generateReActResponse(userQuery: string): Promise<{ spoken: string; actions: string[] }> {
  const store = useSimulationStore.getState()

  const sensorsCtx = store.sensors
    .map(s => `${s.zone} ${s.type}: ${s.value}${s.unit} [threshold ${s.threshold}${s.unit}, ${s.status.toUpperCase()}]`)
    .join('; ')

  const systemPrompt = `You are NOVA, an autonomous AI Industrial Safety Officer piloting a chemical processing plant.
You communicate with the supervisor via VOICE ONLY — plain text only, no markdown (*, _, #, \`), no bullet points.

LIVE PLANT STATE:
- Real-Time Vitals: ${sensorsCtx}
- Compound Risk Index: ${store.compoundRiskScore.toFixed(2)} (${store.riskLevel.toUpperCase()} TIER)
- Focused Zone: ${store.focusedZone || 'Plant Overview'}
- Active Permits: PTW-0441 (Hot-Work Welding Bay 3), PTW-0439 (Electrical Bay 1)
- Qdrant Memory Record: INC-2024-041 (H2S gas buildup during welding, similarity 0.88)

${ACTION_SCHEMA}

Formulate an intelligent, grounded, unique response as a real human safety officer. Return EXACT JSON:
{
  "spoken": "Your spoken answer — 1 to 3 concise, clear, speech-ready sentences.",
  "actions": ["ACTION_1", "ACTION_2"]
}

Rules:
1. "spoken" MUST be clean speech-ready plain text without markdown symbols.
2. If the user asks to zoom or look at a bay (Bay 1, Bay 2, Bay 3, Bay 4, Bay 5), include "ZOOM:Bay X" in actions!
3. Answer any question about plant status, risks, equipment, permits, or safety intelligently.`

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
        temperature: 0.3,
        max_tokens: 220,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) throw new Error(`Groq API returned HTTP ${res.status}`)

    const data = await res.json()
    const raw = data?.choices?.[0]?.message?.content?.trim() || '{}'
    const parsed = JSON.parse(raw)

    return {
      spoken: (parsed.spoken || '').replace(/[*_#~`[\]]/g, '').trim(),
      actions: Array.isArray(parsed.actions) ? parsed.actions : ['NONE'],
    }
  } catch (err) {
    console.warn('[Groq Brain] API call error, using fallback:', err)
    return fallbackReAct(userQuery, store)
  }
}

function fallbackReAct(query: string, store: any): { spoken: string; actions: string[] } {
  const lower = query.toLowerCase()
  const actions: string[] = []
  let spoken = ''

  const bayMatch = lower.match(/(?:bay|zone)\s*([1-5])/i) || lower.match(/([1-5])/i)
  if (lower.includes('bay') || lower.includes('zone') || lower.includes('zoom')) {
    if (bayMatch) {
      const bay = `Bay ${bayMatch[1]}`
      actions.push(`ZOOM:${bay}`)
      const zoneSensors = store.sensors.filter((s: any) => s.zone === bay)
      const summary = zoneSensors.map((s: any) => `${s.type} is ${s.value} ${s.unit}`).join(', ')
      spoken = `Zooming into ${bay}. Live vitals: ${summary || 'nominal parameters'}. Risk tier is ${store.riskLevel.toUpperCase()}.`
    } else if (lower.includes('overview') || lower.includes('out') || lower.includes('reset')) {
      actions.push('RESET_VIEW')
      spoken = `Resetting camera to plant overview. Current compound risk index is ${store.compoundRiskScore.toFixed(2)}.`
    }
  }

  if (!spoken) {
    if (lower.includes('overview') || lower.includes('out') || lower.includes('reset')) {
      actions.push('RESET_VIEW')
      spoken = `Resetting camera view to full plant overview. Compound risk index is ${store.compoundRiskScore.toFixed(2)}.`
    } else if (lower.includes('evidence') || lower.includes('why') || lower.includes('reason')) {
      actions.push('SHOW_EVIDENCE')
      spoken = `Opening evidence drawer. Vitals correlate gas sensor levels with active permit PTW 0441.`
    } else if (lower.includes('authorize') || lower.includes('yes') || lower.includes('confirm')) {
      actions.push('AUTHORIZE')
      spoken = `Authorization confirmed. Executing emergency response action.`
    } else if (lower.includes('reject') || lower.includes('no') || lower.includes('deny')) {
      actions.push('REJECT')
      spoken = `Action rejected by operator. Resuming continuous telemetry monitoring.`
    } else {
      actions.push('NONE')
      spoken = `Plant compound risk score is ${store.compoundRiskScore.toFixed(2)}, classified as ${store.riskLevel.toUpperCase()} tier.`
    }
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
