/**
 * deepgramVoice.ts
 * 
 * Real-time voice engine powered by Deepgram:
 *  - STT: WebSocket streaming from MediaRecorder → Deepgram Nova-3
 *  - TTS: REST API → Deepgram Aura-2 → Web Audio playback
 * 
 * Pipeline: mic → PCM → Deepgram WS → transcript → callback
 *           text → Deepgram TTS → ArrayBuffer → AudioContext → speakers
 */

import { useSimulationStore } from '../store/useSimulationStore'

const DEEPGRAM_API_KEY = (import.meta as any).env?.VITE_DEEPGRAM_API_KEY || ''

// ─── State ────────────────────────────────────────────────────────────────── //
let dgSocket: WebSocket | null = null
let mediaRecorder: MediaRecorder | null = null
let audioStream: MediaStream | null = null
let audioCtx: AudioContext | null = null
let currentTTSSource: AudioBufferSourceNode | null = null
let isListening = false
let isSpeaking = false
let onTranscriptCallback: ((text: string, isFinal: boolean) => void) | null = null

// ─── STT ──────────────────────────────────────────────────────────────────── //

export async function startDeepgramListening(
  onTranscript: (text: string, isFinal: boolean) => void
): Promise<void> {
  if (!DEEPGRAM_API_KEY) {
    console.warn('[Deepgram] No API key found in VITE_DEEPGRAM_API_KEY, falling back to Web Speech')
    startWebSpeechFallback(onTranscript)
    return
  }

  onTranscriptCallback = onTranscript
  isListening = true

  try {
    audioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
      },
    })
  } catch (err) {
    console.error('[Deepgram] Mic access denied:', err)
    return
  }

  const wsUrl =
    `wss://api.deepgram.com/v1/listen?` +
    `model=nova-3&language=en-US&smart_format=true&interim_results=true` +
    `&endpointing=500&utterance_end_ms=1200&vad_events=true`

  dgSocket = new WebSocket(wsUrl, ['token', DEEPGRAM_API_KEY])
  dgSocket.binaryType = 'arraybuffer'

  dgSocket.onopen = () => {
    console.log('[Deepgram] STT WebSocket open')
    useSimulationStore.getState().setNovaState('listening')
    startStreamingAudio()
  }

  dgSocket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data as string)

      if (msg.type === 'Results') {
        const alt = msg.channel?.alternatives?.[0]
        const text: string = alt?.transcript?.trim() || ''
        const isFinal: boolean = msg.is_final === true

        if (text && text.length > 0) {
          // Show interim in store caption
          useSimulationStore.getState().setNovaCaption(isFinal ? '' : `🎙 ${text}`)
          if (onTranscriptCallback) {
            onTranscriptCallback(text, isFinal)
          }
        }
      }

      if (msg.type === 'UtteranceEnd') {
        // Deepgram signals end of speech — flush if needed
        useSimulationStore.getState().setNovaCaption('')
      }
    } catch {
      // non-JSON binary frame, ignore
    }
  }

  dgSocket.onerror = (err) => {
    console.error('[Deepgram] WebSocket error:', err)
  }

  dgSocket.onclose = (ev) => {
    console.log('[Deepgram] STT WebSocket closed:', ev.code, ev.reason)
    if (isListening && ev.code !== 1000) {
      // Auto-reconnect after 2s if not intentionally stopped
      setTimeout(() => {
        if (isListening && onTranscriptCallback) {
          startDeepgramListening(onTranscriptCallback)
        }
      }, 2000)
    }
  }
}

function startStreamingAudio() {
  if (!audioStream || !dgSocket) return

  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : 'audio/webm'

  mediaRecorder = new MediaRecorder(audioStream, { mimeType, audioBitsPerSecond: 64000 })

  mediaRecorder.ondataavailable = (e) => {
    if (dgSocket?.readyState === WebSocket.OPEN && e.data.size > 0) {
      dgSocket.send(e.data)
    }
  }

  mediaRecorder.start(100) // send chunks every 100ms
}

export function stopDeepgramListening() {
  isListening = false
  onTranscriptCallback = null

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
    mediaRecorder = null
  }

  if (audioStream) {
    audioStream.getTracks().forEach(t => t.stop())
    audioStream = null
  }

  if (dgSocket) {
    dgSocket.close(1000, 'User stopped listening')
    dgSocket = null
  }

  useSimulationStore.getState().setNovaState('idle')
}

// ─── TTS ──────────────────────────────────────────────────────────────────── //

export async function deepgramSpeak(text: string): Promise<void> {
  if (!text.trim()) return

  const store = useSimulationStore.getState()

  // Cancel any current TTS
  stopCurrentTTS()

  store.setNovaState('speaking')
  store.setNovaCaption(text)
  store.setNovaMessage(text)
  isSpeaking = true

  if (!DEEPGRAM_API_KEY) {
    // Fallback to Web Speech API
    return webSpeechFallbackSpeak(text)
  }

  try {
    const res = await fetch('https://api.deepgram.com/v1/speak?model=aura-2-theia-en', {
      method: 'POST',
      headers: {
        Authorization: `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })

    if (!res.ok) {
      throw new Error(`Deepgram TTS HTTP ${res.status}`)
    }

    const arrayBuffer = await res.arrayBuffer()

    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContext()
    }
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume()
    }

    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
    const source = audioCtx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(audioCtx.destination)
    currentTTSSource = source

    return new Promise((resolve) => {
      source.onended = () => {
        isSpeaking = false
        currentTTSSource = null
        store.setNovaState('listening')
        store.setNovaCaption('')
        resolve()
      }
      source.start()
    })
  } catch (err) {
    console.warn('[Deepgram TTS] Error, falling back to Web Speech:', err)
    return webSpeechFallbackSpeak(text)
  }
}

export function stopCurrentTTS() {
  isSpeaking = false
  if (currentTTSSource) {
    try { currentTTSSource.stop() } catch {}
    currentTTSSource = null
  }
  // Also silence browser TTS fallback
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
  const store = useSimulationStore.getState()
  store.setNovaCaption('')
}

// ─── Fallbacks ────────────────────────────────────────────────────────────── //

let fallbackRecognition: any = null

function startWebSpeechFallback(onTranscript: (text: string, isFinal: boolean) => void) {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SR) {
    console.warn('[Fallback] Web Speech API not available')
    return
  }

  fallbackRecognition = new SR()
  fallbackRecognition.continuous = true
  fallbackRecognition.interimResults = true
  fallbackRecognition.lang = 'en-US'

  fallbackRecognition.onresult = (e: any) => {
    const last = e.results[e.results.length - 1]
    const text = last[0].transcript.trim()
    if (text) onTranscript(text, last.isFinal)
  }

  fallbackRecognition.onend = () => {
    if (isListening) {
      try { fallbackRecognition.start() } catch {}
    }
  }

  try {
    fallbackRecognition.start()
    useSimulationStore.getState().setNovaState('listening')
  } catch {}
}

function webSpeechFallbackSpeak(text: string): Promise<void> {
  return new Promise(resolve => {
    const store = useSimulationStore.getState()
    if (!window.speechSynthesis) {
      store.setNovaState('listening')
      store.setNovaCaption('')
      resolve()
      return
    }

    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.rate = 0.95
    utt.pitch = 0.9

    const voices = window.speechSynthesis.getVoices()
    const v = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'))
      || voices.find(v => v.lang.startsWith('en'))
    if (v) utt.voice = v

    utt.onend = () => {
      isSpeaking = false
      store.setNovaState('listening')
      store.setNovaCaption('')
      resolve()
    }
    utt.onerror = () => {
      isSpeaking = false
      store.setNovaState('listening')
      store.setNovaCaption('')
      resolve()
    }

    window.speechSynthesis.speak(utt)
  })
}

export { isSpeaking }
