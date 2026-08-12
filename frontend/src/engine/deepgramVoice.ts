/**
 * deepgramVoice.ts
 * 
 * Unified Voice Engine:
 *  - STT: Deepgram Nova-3 WebSocket (or SpeechRecognition fallback)
 *  - Brain: Groq LLM (llama-3.3-70b-versatile)
 *  - TTS: Rime TTS (mist-v3 model, astra voice) → Web Audio playback
 */

import { useSimulationStore } from '../store/useSimulationStore'

const DEEPGRAM_API_KEY = (import.meta as any).env?.VITE_DEEPGRAM_API_KEY || 'a7d2b404d9c72e2cf5e1e1a539bc27a1c5d944e2'
const RIME_API_KEY = (import.meta as any).env?.VITE_RIME_API_KEY || 'ReIWMYpgRfMKnYxSFmTbjhad-zhYe4mIGfbkRH29YWc'

// ─── State ────────────────────────────────────────────────────────────────── //
let dgSocket: WebSocket | null = null
let mediaRecorder: MediaRecorder | null = null
let audioStream: MediaStream | null = null
let audioCtx: AudioContext | null = null
let currentTTSSource: AudioBufferSourceNode | null = null
let isListening = false
let isSpeaking = false
let onTranscriptCallback: ((text: string, isFinal: boolean) => void) | null = null

const MAX_RETRIES = 2
let retryCount = 0
// ─── STT (Deepgram Nova-3) ────────────────────────────────────────────────── //

export async function startDeepgramListening(
  onTranscript: (text: string, isFinal: boolean) => void
): Promise<void> {
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
    console.warn('[Voice Engine] Mic access unavailable, initiating browser speech recognition fallback:', err)
    startWebSpeechFallback(onTranscript)
    return
  }

  if (!DEEPGRAM_API_KEY) {
    console.warn('[Deepgram STT] Key missing, using browser speech fallback')
    startWebSpeechFallback(onTranscript)
    return
  }

  const wsUrl =
    `wss://api.deepgram.com/v1/listen?` +
    `model=nova-2&language=en-US&smart_format=true&interim_results=true` +
    `&endpointing=500&utterance_end_ms=1200&vad_events=true`

  try {
    dgSocket = new WebSocket(wsUrl, ['token', DEEPGRAM_API_KEY])
    dgSocket.binaryType = 'arraybuffer'

    dgSocket.onopen = () => {
      console.log('[Deepgram STT] Live WebSocket connected')
      retryCount = 0 // reset on successful connection
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
            // Instant Sub-100ms Voice Barge-In: Halt TTS if Nova is currently speaking
            if (isSpeaking) {
              stopCurrentTTS()
            }
            useSimulationStore.getState().setNovaCaption(isFinal ? '' : `🎙 ${text}`)
            if (onTranscriptCallback) {
              onTranscriptCallback(text, isFinal)
            }
          }
        }

        if (msg.type === 'UtteranceEnd') {
          useSimulationStore.getState().setNovaCaption('')
        }
      } catch {}
    }

    dgSocket.onerror = () => {
      console.warn('[Deepgram STT] Error — will retry on close event, not here')
    }

    dgSocket.onclose = (ev) => {
      if (isListening && ev.code !== 1000) {
        if (retryCount >= MAX_RETRIES) {
          console.warn('[Deepgram STT] Max retries reached — STT unavailable.')
          startWebSpeechFallback(onTranscript)
          return
        }
        
        retryCount++
        console.warn(`[Deepgram STT] Closed (${ev.code}), retry ${retryCount}/${MAX_RETRIES}`)
        setTimeout(() => {
          if (isListening && onTranscriptCallback) {
            startDeepgramListening(onTranscriptCallback)
          }
        }, 2000 * retryCount)
      }
    }
  } catch {
    startWebSpeechFallback(onTranscript)
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

  if (fallbackRecognition) {
    try { fallbackRecognition.stop() } catch {}
    fallbackRecognition = null
  }

  useSimulationStore.getState().setNovaState('idle')
}

// ─── TTS (Rime Voice Synthesis) ───────────────────────────────────────────── //

export async function rimeSpeak(text: string): Promise<void> {
  if (!text.trim()) return

  const store = useSimulationStore.getState()
  stopCurrentTTS()

  store.setNovaState('speaking')
  store.setNovaCaption(text)
  store.setNovaMessage(text)
  isSpeaking = true

  // 1. Attempt Rime TTS API Call
  if (RIME_API_KEY) {
    try {
      const res = await fetch('https://users.rime.ai/v1/rime-tts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RIME_API_KEY}`,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: text,
          speaker: 'astra',
          modelId: 'mist-v3',
          lang: 'en',
        }),
      })

      if (res.ok) {
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
      }
    } catch (err) {
      console.warn('[Rime TTS] API call failed, attempting fallback TTS:', err)
    }
  }

  // 2. Fallback to Web Speech API
  return webSpeechFallbackSpeak(text)
}

export function deepgramSpeak(text: string): Promise<void> {
  return rimeSpeak(text)
}

export function stopCurrentTTS() {
  isSpeaking = false
  if (currentTTSSource) {
    try { currentTTSSource.stop() } catch {}
    currentTTSSource = null
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
  const store = useSimulationStore.getState()
  store.setNovaCaption('')
}

// ─── Web Speech Fallback ─────────────────────────────────────────────────── //

let fallbackRecognition: any = null

function startWebSpeechFallback(onTranscript: (text: string, isFinal: boolean) => void) {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SR) {
    console.warn('[Fallback] Web Speech API not supported')
    return
  }

  if (fallbackRecognition) return

  fallbackRecognition = new SR()
  fallbackRecognition.continuous = true
  fallbackRecognition.interimResults = true
  fallbackRecognition.lang = 'en-US'

  fallbackRecognition.onresult = (e: any) => {
    const last = e.results[e.results.length - 1]
    const text = last[0].transcript.trim()
    if (text) {
      if (isSpeaking) {
        stopCurrentTTS()
      }
      onTranscript(text, last.isFinal)
    }
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
    utt.pitch = 0.95

    const voices = window.speechSynthesis.getVoices()
    const v = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural')))
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
