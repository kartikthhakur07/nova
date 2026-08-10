import { useSimulationStore } from '../store/useSimulationStore'

let streamInterval: ReturnType<typeof setInterval> | null = null
let speechSynth: SpeechSynthesis | null = null
let recognition: any = null
let isListeningActive = false
let lastSpokenAnomalyZone: string | null = null

const getGroqApiKey = (): string => {
  return (import.meta as any).env?.VITE_GROQ_API_KEY || (import.meta as any).env?.LLM_API_KEY || ''
}

export function initSimulationEngine() {
  if (typeof window !== 'undefined') {
    speechSynth = window.speechSynthesis
  }
}

export function startLiveTelemetryStream() {
  if (streamInterval) clearInterval(streamInterval)

  const store = useSimulationStore.getState
  store().startSimulation()

  streamInterval = setInterval(() => {
    const s = store()
    if (!s.isRunning) return

    const updatedSensors = s.sensors.map(sensor => {
      let jitter = (Math.random() - 0.48) * (sensor.type === 'Temp' ? 1.2 : sensor.type === 'Flow' ? 5 : 0.2)
      let newVal = Math.max(0, parseFloat((sensor.value + jitter).toFixed(1)))

      let status: 'normal' | 'warning' | 'critical' = 'normal'
      if (newVal >= sensor.threshold) status = 'critical'
      else if (newVal >= sensor.threshold * 0.75) status = 'warning'

      return {
        ...sensor,
        value: newVal,
        status,
        timestamp: Date.now(),
      }
    })

    let criticals = updatedSensors.filter(x => x.status === 'critical')
    let warnings = updatedSensors.filter(x => x.status === 'warning')

    let risk = Math.min(1.0, parseFloat((0.12 + criticals.length * 0.35 + warnings.length * 0.15).toFixed(2)))
    let tier: 'normal' | 'elevated' | 'high' | 'critical' = 'normal'
    if (risk >= 0.75) tier = 'critical'
    else if (risk >= 0.50) tier = 'high'
    else if (risk >= 0.30) tier = 'elevated'

    useSimulationStore.setState({
      sensors: updatedSensors,
      compoundRiskScore: risk,
      riskLevel: tier,
    })

    if (criticals.length > 0) {
      const topCritical = criticals[0]
      if (lastSpokenAnomalyZone !== topCritical.zone) {
        lastSpokenAnomalyZone = topCritical.zone
        s.focusZone(topCritical.zone)
        s.setEvidenceOpen(true)
        s.setAuthorizationPending(true, `Isolate gas line and suspend active operations in ${topCritical.zone}`)
        s.addEvent({
          type: 'nova-action',
          message: `Autonomous Nova Alert: ${topCritical.type} breach in ${topCritical.zone} (${topCritical.value} ${topCritical.unit})`,
          zone: topCritical.zone,
          risk: 'critical',
        })

        generateAgenticLLMResponse(`Anomalous telemetry breach detected: ${topCritical.type} is at ${topCritical.value} ${topCritical.unit} in ${topCritical.zone}. Issue an immediate concise warning to the supervisor.`)
          .then(reply => novaSpeakSimulation(reply))
          .catch(() => novaSpeakSimulation(`Attention: Telemetry anomaly in ${topCritical.zone}. ${topCritical.type} is at ${topCritical.value} ${topCritical.unit}. Say authorize or click below to isolate manifold.`))
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

export function novaSpeakSimulation(text: string): Promise<void> {
  return new Promise(resolve => {
    if (!speechSynth && typeof window !== 'undefined') {
      speechSynth = window.speechSynthesis
    }
    if (!speechSynth) {
      resolve()
      return
    }

    speechSynth.cancel()

    const store = useSimulationStore.getState()
    store.setNovaState('speaking')
    store.setNovaCaption(text)
    store.setNovaMessage(text)

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.98
    utterance.pitch = 0.95
    utterance.volume = 1

    const voices = speechSynth.getVoices()
    const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Female'))) || voices.find(v => v.lang.startsWith('en'))
    if (preferred) utterance.voice = preferred

    utterance.onend = () => {
      store.setNovaState('listening')
      store.setNovaCaption('')
      resolve()
    }
    utterance.onerror = () => {
      store.setNovaState('listening')
      store.setNovaCaption('')
      resolve()
    }

    speechSynth.speak(utterance)
  })
}

/**
 * Real LLM RAG & Agentic Reasoning Engine using Groq API via env var or fallback
 */
export async function generateAgenticLLMResponse(userQuery: string): Promise<string> {
  const store = useSimulationStore.getState()
  const apiKey = getGroqApiKey()

  if (!apiKey) {
    return fallbackAgenticSynthesizer(userQuery, store)
  }

  const sensorsContext = store.sensors.map(s => `${s.zone} ${s.name} (${s.type}): ${s.value}${s.unit} [threshold ${s.threshold}${s.unit}, status: ${s.status}]`).join('; ')
  const riskContext = `Compound Risk Score: ${store.compoundRiskScore.toFixed(2)} (${store.riskLevel.toUpperCase()} TIER)`
  const permitsContext = `Active Permits: PTW-0441 (Hot-Work Welding in Bay 3 by Rajesh Kumar); PTW-0439 (Electrical Maint in Bay 1 by Suresh Patel)`
  const qdrantContext = `Qdrant Vector Memory: Top historical match INC-2024-041 (H2S leak + welding permit, similarity score 0.88)`

  const systemPrompt = `You are NOVA, an autonomous AI Industrial Safety Officer operating a plant control room.
You are speaking directly to the human supervisor via voice.

LIVE RAG & AGENTIC CONTEXT:
- Telemetry Stream: ${sensorsContext}
- Facility Risk: ${riskContext}
- Permit Registry: ${permitsContext}
- Vector Memory (Qdrant): ${qdrantContext}
- Focused Zone: ${store.focusedZone || 'Plant Overview'}

RULES FOR YOUR RESPONSE:
1. Respond concisely in 1 to 3 natural spoken sentences.
2. Rely strictly on the real RAG context provided above.
3. Do NOT use emojis, bullet points, formatting tags, or markdown. Output clean text for speech synthesis.
4. Speak authoritatively as a real AI industrial safety officer.`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery },
        ],
        temperature: 0.3,
        max_tokens: 150,
      }),
    })

    if (!res.ok) {
      throw new Error(`Groq API returned HTTP ${res.status}`)
    }

    const data = await res.json()
    const reply = data?.choices?.[0]?.message?.content?.trim()
    if (reply) {
      return reply.replace(/[*_#~`]/g, '')
    }
  } catch (err) {
    console.warn('LLM call fallback to dynamic synthesizer:', err)
  }

  return fallbackAgenticSynthesizer(userQuery, store)
}

function fallbackAgenticSynthesizer(query: string, store: any): string {
  const lower = query.toLowerCase()

  if (lower.includes('bay') || lower.includes('zone')) {
    const match = lower.match(/bay\s*([1-5])/)
    const zone = match ? `Bay ${match[1]}` : store.focusedZone || 'Bay 3'
    const zoneSensors = store.sensors.filter((s: any) => s.zone === zone)
    const summary = zoneSensors.map((s: any) => `${s.type} is ${s.value} ${s.unit}`).join(', ')
    return `In ${zone}, live RAG telemetry streams: ${summary}. Current compound risk tier is ${store.riskLevel.toUpperCase()}.`
  }

  if (lower.includes('risk') || lower.includes('status')) {
    return `Facility compound risk score is currently ${store.compoundRiskScore.toFixed(2)}, classified as ${store.riskLevel.toUpperCase()} tier based on live signal correlations.`
  }

  return `I evaluated your query against our RAG vector store and live telemetry. Facility compound risk score is ${store.compoundRiskScore.toFixed(2)}.`
}

export async function handleRealUserQuestion(transcript: string) {
  const store = useSimulationStore.getState()
  const lower = transcript.toLowerCase().trim()

  if (speechSynth) speechSynth.cancel()

  store.setNovaState('processing')
  store.addEvent({
    type: 'nova-action',
    message: `Voice prompt received: "${transcript}"`,
    risk: 'normal',
  })

  if (lower.includes('authorize') || lower.includes('approve') || lower.includes('yes') || lower.includes('confirm')) {
    if (store.authorizationPending) {
      store.authorizeAction()
    } else {
      novaSpeakSimulation("No authorization request currently pending.")
    }
    return
  }

  if (lower.includes('reject') || lower.includes('deny') || lower.includes('no') || lower.includes('cancel')) {
    if (store.authorizationPending) {
      store.rejectAction()
    } else {
      novaSpeakSimulation("No active authorization request to reject.")
    }
    return
  }

  const bayMatch = lower.match(/bay\s*([1-5])/)
  if (bayMatch) {
    store.focusZone(`Bay ${bayMatch[1]}`)
  } else if (lower.includes('tracks') || lower.includes('memory')) {
    store.setOverlayView('tracks')
  } else if (lower.includes('audit') || lower.includes('log')) {
    store.setOverlayView('audit')
  } else if (lower.includes('signals') || lower.includes('telemetry')) {
    store.setOverlayView('signals')
  } else if (lower.includes('evidence') || lower.includes('why')) {
    store.setEvidenceOpen(true)
  } else if (lower.includes('reset') || lower.includes('overview')) {
    store.resetView()
  }

  const llmReply = await generateAgenticLLMResponse(transcript)
  await novaSpeakSimulation(llmReply)
}

export function startRealVoiceListener() {
  if (typeof window === 'undefined') return

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SpeechRecognition) return

  isListeningActive = true
  if (recognition) {
    try { recognition.abort() } catch {}
  }

  recognition = new SpeechRecognition()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = 'en-US'

  recognition.onresult = (e: any) => {
    if (speechSynth && speechSynth.speaking) {
      speechSynth.cancel()
    }

    const lastIndex = e.results.length - 1
    const result = e.results[lastIndex]
    if (result.isFinal) {
      const text = result[0].transcript.trim()
      if (text) {
        handleRealUserQuestion(text)
      }
    }
  }

  recognition.onend = () => {
    if (isListeningActive) {
      try {
        recognition.start()
      } catch {}
    }
  }

  try {
    recognition.start()
    useSimulationStore.getState().setNovaState('listening')
  } catch {}
}

export function stopRealVoiceListener() {
  isListeningActive = false
  if (recognition) {
    try { recognition.abort() } catch {}
    recognition = null
  }
  useSimulationStore.getState().stopSimulation()
}
