/**
 * deepgramVoice.ts
 * 
 * Unified Voice Engine with Production-Grade Deepgram Nova STT & Instant WebSpeech Fallback:
 *  - STT: Deepgram Nova-2 WebSocket with KeepAlive & Seamless Auto-Fallback
 *  - Audio Buffering during Reconnections
 *  - Instant Sub-100ms Voice Barge-In
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

let keepAliveInterval: ReturnType<typeof setInterval> | null = null
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
let audioBufferQueue: Blob[] = []
let consecutiveFails = 0
const MAX_CONSECUTIVE_FAILS = 3

// ─── STT (Deepgram Nova-2) ─────────────────────────────────────────────────── //

export async function startDeepgramListening(
  onTranscript: (text: string, isFinal: boolean) => void
): Promise<void> {
  onTranscriptCallback = onTranscript
  isListening = true

  if (!audioStream) {
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
      console.warn('[Voice Engine] Mic access unavailable, using browser SpeechRecognition fallback:', err)
      startWebSpeechFallback(onTranscript)
      return
    }
  }

  if (!DEEPGRAM_API_KEY) {
    console.warn('[Deepgram STT] Key missing, using browser speech fallback')
    startWebSpeechFallback(onTranscript)
    return
  }

  const wsUrl =
    `wss://api.deepgram.com/v1/listen?` +
    `model=nova-2&language=en-US&smart_format=true&numerals=true&punctuate=true` +
    `&interim_results=true&endpointing=500&utterance_end_ms=1200&vad_events=true`

  try {
    const timestamp = new Date().toISOString()
    console.log(`[Deepgram STT ${timestamp}] Opening WebSocket connection to Deepgram...`)

    dgSocket = new WebSocket(wsUrl, ['token', DEEPGRAM_API_KEY])
    dgSocket.binaryType = 'arraybuffer'

    dgSocket.onopen = () => {
      const openTime = new Date().toISOString()
      console.log(`[Deepgram STT ${openTime}] Live WebSocket Connected`)
      consecutiveFails = 0
      useSimulationStore.getState().setNovaState('listening')

      // Flush buffered audio chunks accumulated during reconnect
      if (audioBufferQueue.length > 0) {
        while (audioBufferQueue.length > 0) {
          const chunk = audioBufferQueue.shift()
          if (chunk && dgSocket?.readyState === WebSocket.OPEN) {
            dgSocket.send(chunk)
          }
        }
      }

      // Send KeepAlive frame every 5 seconds to prevent idle timeout
      if (keepAliveInterval) clearInterval(keepAliveInterval)
      keepAliveInterval = setInterval(() => {
        if (dgSocket?.readyState === WebSocket.OPEN) {
          dgSocket.send(JSON.stringify({ type: 'KeepAlive' }))
        }
      }, 5000)

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
            // Instant Sub-100ms Voice Barge-In: Stop active TTS when speech is heard
            if (isSpeaking) {
              stopCurrentTTS()
            }
            useSimulationStore.getState().setNovaCaption(isFinal ? '' : `🎙 ${text}`)
            if (onTranscriptCallback) {
              onTranscriptCallback(text, isFinal)
            }
          }
        } else if (msg.type === 'UtteranceEnd') {
          useSimulationStore.getState().setNovaCaption('')
        }
      } catch {}
    }

    dgSocket.onerror = (err) => {
      console.warn('[Deepgram STT] Connection error event fired:', err)
    }

    dgSocket.onclose = (ev) => {
      console.warn(`[Deepgram STT] Socket closed — Code: ${ev.code}, Reason: "${ev.reason || 'None'}"`)

      if (keepAliveInterval) {
        clearInterval(keepAliveInterval)
        keepAliveInterval = null
      }

      if (isListening) {
        consecutiveFails++
        if (consecutiveFails >= MAX_CONSECUTIVE_FAILS) {
          console.warn('[Deepgram STT] Max retries reached — switching to Browser WebSpeech fallback')
          startWebSpeechFallback(onTranscriptCallback!)
          return
        }

        console.log(`[Deepgram STT] Retrying connection (attempt ${consecutiveFails}/${MAX_CONSECUTIVE_FAILS})...`)
        if (reconnectTimeout) clearTimeout(reconnectTimeout)
        reconnectTimeout = setTimeout(() => {
          if (isListening && onTranscriptCallback) {
            startDeepgramListening(onTranscriptCallback)
          }
        }, 1000)
      }
    }
  } catch (exc) {
    console.error('[Deepgram STT] Exception connecting:', exc)
    startWebSpeechFallback(onTranscript)
  }
}

function startStreamingAudio() {
  if (!audioStream) return
  if (mediaRecorder && mediaRecorder.state === 'recording') return

  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : 'audio/webm'

  try {
    mediaRecorder = new MediaRecorder(audioStream, { mimeType, audioBitsPerSecond: 64000 })

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        if (dgSocket?.readyState === WebSocket.OPEN) {
          dgSocket.send(e.data)
        } else if (isListening) {
          if (audioBufferQueue.length >= 15) {
            audioBufferQueue.shift()
          }
          audioBufferQueue.push(e.data)
        }
      }
    }

    mediaRecorder.start(100)
  } catch (err) {
    console.warn('[Deepgram STT] MediaRecorder start error:', err)
  }
}

export function stopDeepgramListening() {
  isListening = false
  onTranscriptCallback = null
  consecutiveFails = 0

  if (keepAliveInterval) {
    clearInterval(keepAliveInterval)
    keepAliveInterval = null
  }

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }

  audioBufferQueue = []

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try { mediaRecorder.stop() } catch {}
    mediaRecorder = null
  }

  if (audioStream) {
    audioStream.getTracks().forEach(t => t.stop())
    audioStream = null
  }

  if (dgSocket) {
    try { dgSocket.close(1000, 'User stopped listening') } catch {}
    dgSocket = null
  }

  if (fallbackRecognition) {
    try { fallbackRecognition.stop() } catch {}
    fallbackRecognition = null
  }

  useSimulationStore.getState().setNovaState('idle')
}

// ─── Browser WebSpeech Fallback ───────────────────────────────────────────── //
let fallbackRecognition: any = null

function startWebSpeechFallback(onTranscript: (text: string, isFinal: boolean) => void) {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SpeechRecognition) {
    console.warn('[SpeechFallback] WebSpeech API not supported in this browser environment.')
    return
  }

  try {
    if (fallbackRecognition) {
      try { fallbackRecognition.stop() } catch {}
    }

    fallbackRecognition = new SpeechRecognition()
    fallbackRecognition.continuous = true
    fallbackRecognition.interimResults = true
    fallbackRecognition.lang = 'en-US'

    fallbackRecognition.onstart = () => {
      console.log('[SpeechFallback] Browser WebSpeech Recognition ACTIVE')
      useSimulationStore.getState().setNovaState('listening')
    }

    fallbackRecognition.onresult = (event: any) => {
      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript
        } else {
          interim += transcript
        }
      }

      if (final.trim()) {
        useSimulationStore.getState().setNovaCaption('')
        onTranscript(final.trim(), true)
      } else if (interim.trim()) {
        useSimulationStore.getState().setNovaCaption(`🎙 ${interim.trim()}`)
        onTranscript(interim.trim(), false)
      }
    }

    fallbackRecognition.onerror = (err: any) => {
      console.warn('[SpeechFallback] Recognition error:', err)
    }

    fallbackRecognition.onend = () => {
      if (isListening) {
        try { fallbackRecognition.start() } catch {}
      }
    }

    fallbackRecognition.start()
  } catch (err) {
    console.warn('[SpeechFallback] Failed to start WebSpeech:', err)
  }
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
        await playAudioBuffer(arrayBuffer)
        return
      }
    } catch (err) {
      console.warn('[Rime TTS] API failed, falling back to Web Speech Synthesis:', err)
    }
  }

  speakWebSpeechFallback(text)
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

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }

  const store = useSimulationStore.getState()
  if (store.novaState === 'speaking') {
    store.setNovaState('listening')
  }
}

async function playAudioBuffer(arrayBuffer: ArrayBuffer): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      if (audioCtx.state === 'suspended') {
        audioCtx.resume()
      }

      audioCtx.decodeAudioData(
        arrayBuffer,
        (buffer) => {
          if (!audioCtx || !isListening) {
            resolve()
            return
          }

          stopCurrentTTS()
          isSpeaking = true

          const source = audioCtx.createBufferSource()
          source.buffer = buffer
          source.connect(audioCtx.destination)
          currentTTSSource = source

          source.onended = () => {
            currentTTSSource = null
            isSpeaking = false
            useSimulationStore.getState().setNovaState('listening')
            resolve()
          }

          source.start(0)
        },
        () => {
          speakWebSpeechFallback(useSimulationStore.getState().novaCaption)
          resolve()
        }
      )
    } catch {
      resolve()
    }
  })
}

function speakWebSpeechFallback(text: string) {
  if (!('speechSynthesis' in window)) return

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 1.05
  utterance.pitch = 1.0

  utterance.onend = () => {
    isSpeaking = false
    useSimulationStore.getState().setNovaState('listening')
  }

  isSpeaking = true
  window.speechSynthesis.speak(utterance)
}
