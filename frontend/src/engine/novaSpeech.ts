import { useDemoStore } from '../store/useDemoStore'

let speechSynth: SpeechSynthesis | null = null
let currentUtterance: SpeechSynthesisUtterance | null = null
let recognition: any = null

export function initSpeechEngine() {
  if (typeof window !== 'undefined') {
    speechSynth = window.speechSynthesis
  }
}

export function novaSpeak(text: string, onEnd?: () => void): Promise<void> {
  return new Promise((resolve) => {
    if (!speechSynth) {
      initSpeechEngine()
    }
    if (!speechSynth) {
      resolve()
      return
    }

    speechSynth.cancel()

    const store = useDemoStore.getState()
    store.setNovaState('speaking')
    store.setNovaCaption(text)

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 0.9
    utterance.volume = 1

    const voices = speechSynth.getVoices()
    const preferred = voices.find(v =>
      v.name.includes('Google') && v.lang.startsWith('en')
    ) || voices.find(v =>
      v.lang.startsWith('en') && v.name.includes('Female')
    ) || voices.find(v =>
      v.lang.startsWith('en')
    )
    if (preferred) utterance.voice = preferred

    utterance.onend = () => {
      store.setNovaState('listening')
      store.setNovaCaption('')
      currentUtterance = null
      onEnd?.()
      resolve()
    }

    utterance.onerror = () => {
      store.setNovaState('listening')
      store.setNovaCaption('')
      currentUtterance = null
      resolve()
    }

    currentUtterance = utterance
    speechSynth.speak(utterance)
  })
}

export function novaSilence() {
  if (speechSynth) {
    speechSynth.cancel()
  }
  currentUtterance = null
  const store = useDemoStore.getState()
  store.setNovaState('listening')
  store.setNovaCaption('')
}

export async function requestMicPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach(t => t.stop())
    useDemoStore.getState().setMicPermission(true)
    return true
  } catch {
    console.warn('Mic permission denied')
    return false
  }
}

export function parseAndExecuteVoiceCommand(transcript: string) {
  const store = useDemoStore.getState()
  const lower = transcript.toLowerCase()

  if (store.novaState === 'speaking') {
    novaSilence()
  }

  store.setNovaState('processing')
  store.addEvent({ type: 'nova-action', message: `Voice command received: "${transcript}"`, risk: 'normal' })

  if (lower.includes('bay 4') || lower.includes('bay four')) {
    store.setOverlayView('none')
    store.focusZone('Bay 4')
    novaSpeak("Zooming into Bay 4. Storage tank area telemetry: Methane concentration is at 1.2% LEL, vibration reading is 2.1 mm/s. All parameters are within safe bounds.")
    return
  }

  if (lower.includes('bay 1') || lower.includes('bay one')) {
    store.setOverlayView('none')
    store.focusZone('Bay 1')
    novaSpeak("Zooming into Bay 1. Distillation Unit is operational. H2S concentration is 2.1 ppm and Methane level is 0.8% LEL. Readings are nominal.")
    return
  }

  if (lower.includes('bay 2') || lower.includes('bay two')) {
    store.setOverlayView('none')
    store.focusZone('Bay 2')
    novaSpeak("Zooming into Bay 2. Heat Exchanger system: Pressure reading is 14.2 bar, temperature is 78 degrees Celsius. Operating safely.")
    return
  }

  if (lower.includes('bay 3') || lower.includes('bay three')) {
    store.setOverlayView('none')
    store.focusZone('Bay 3')
    const s3 = store.sensors.find(s => s.zone === 'Bay 3' && s.type === 'H₂S')
    novaSpeak(`Zooming into Bay 3. Compressor C-14 zone: H2S level is currently ${s3?.value || '8.2'} ppm with active hot-work permit PTW-0441.`)
    return
  }

  if (lower.includes('bay 5') || lower.includes('bay five')) {
    store.setOverlayView('none')
    store.focusZone('Bay 5')
    novaSpeak("Zooming into Bay 5. Loading Bay operations: Temperature 65 degrees Celsius, flow rate 340 liters per minute. All readings steady.")
    return
  }

  if (lower.includes('reset') || lower.includes('zoom out') || lower.includes('show plant') || lower.includes('overview')) {
    store.resetView()
    novaSpeak("Resetting view. Displaying full plant overview across all five bays.")
    return
  }

  if (lower.includes('recent tracks') || lower.includes('tracks') || lower.includes('retrieval') || lower.includes('history')) {
    store.setOverlayView('tracks')
    novaSpeak("Switching to recent tracks view. Showing Qdrant memory retrieval traces and historical matches for active plant cases.")
    return
  }

  if (lower.includes('audit') || lower.includes('log')) {
    store.setOverlayView('audit')
    novaSpeak("Switching to audit trail view. Presenting immutable audit log with cryptographic timestamps and tool executions.")
    return
  }

  if (lower.includes('signal') || lower.includes('telemetry')) {
    store.setOverlayView('signals')
    novaSpeak("Switching to converging signals view. Displaying real-time multi-sensor correlation stream.")
    return
  }

  if (lower.includes('evidence') || lower.includes('reasoning') || lower.includes('why')) {
    store.setOverlayView('none')
    store.setEvidenceOpen(true)
    novaSpeak("Opening evidence panel. Displaying compound risk factors, permit PTW-0441, and Qdrant memory matches.")
    return
  }

  if (lower.includes('close evidence')) {
    store.setEvidenceOpen(false)
    novaSpeak("Closing evidence panel.")
    return
  }

  if (lower.includes('authorize') || lower.includes('approve') || lower.includes('confirm')) {
    if (store.authorizationPending) {
      store.authorizeAction()
      novaSpeak("Authorization confirmed. Executing permit suspension and dispatching evacuation alerts.")
    } else {
      novaSpeak("No pending action requires authorization right now.")
    }
    return
  }

  if (lower.includes('reject') || lower.includes('deny') || lower.includes('decline')) {
    if (store.authorizationPending) {
      store.rejectAction()
      novaSpeak("Action rejected. Maintaining current monitoring status.")
    } else {
      novaSpeak("No pending authorization request to reject.")
    }
    return
  }

  if (lower.includes('status') || lower.includes('risk') || lower.includes('how is the plant')) {
    novaSpeak(`Current plant compound risk score is ${store.compoundRiskScore.toFixed(2)}. ${store.riskLevel.toUpperCase()} risk tier. All 5 bays are monitored continuously.`)
    return
  }

  if (lower.includes('temperature') || lower.includes('temp')) {
    novaSpeak("Bay 2 temperature is 78 degrees Celsius. Bay 5 temperature is 65 degrees Celsius. All thermal sensors are within operational thresholds.")
    return
  }

  if (lower.includes('permit') || lower.includes('hot work')) {
    novaSpeak("Active hot-work permit PTW-0441 is currently logged in Bay 3 for welding operations.")
    return
  }

  novaSpeak(`I heard: "${transcript}". I am monitoring all plant systems in real-time. Say "zoom into bay 4", "show recent tracks", or "show audit trail" to control the control room.`)
}

export function startListening(onResult?: (transcript: string) => void) {
  if (typeof window === 'undefined') return

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SpeechRecognition) {
    console.warn('Speech recognition not available')
    return
  }

  if (recognition) {
    recognition.abort()
  }

  recognition = new SpeechRecognition()
  recognition.continuous = true
  recognition.interimResults = false
  recognition.lang = 'en-US'

  recognition.onresult = (event: any) => {
    const last = event.results[event.results.length - 1]
    if (last.isFinal) {
      const transcript = last[0].transcript.trim()
      if (transcript) {
        parseAndExecuteVoiceCommand(transcript)
        onResult?.(transcript)
      }
    }
  }

  recognition.onerror = (event: any) => {
    if (event.error !== 'no-speech' && event.error !== 'aborted') {
      console.warn('Speech recognition error:', event.error)
    }
  }

  recognition.onend = () => {
    const store = useDemoStore.getState()
    if (store.demoActive && store.micPermissionGranted) {
      try {
        recognition?.start()
      } catch {
      }
    }
  }

  try {
    recognition.start()
    useDemoStore.getState().setNovaState('listening')
  } catch {
  }
}

export function stopListening() {
  if (recognition) {
    recognition.abort()
    recognition = null
  }
  useDemoStore.getState().setNovaState('idle')
}
