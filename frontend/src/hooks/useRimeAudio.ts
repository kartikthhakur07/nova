/**
 * frontend/src/hooks/useRimeAudio.ts
 *
 * Connects to WS /ws/audio/{case_id} and plays binary audio chunks.
 * Handles barge-in: when speaking and mic detects audio → call POST /api/voice/cancel.
 *
 * Usage:
 *   const { isPlaying, bargeIn } = useRimeAudio(caseId)
 */
import { useEffect, useRef, useState, useCallback } from 'react'

const WS_BASE = (import.meta.env.VITE_WS_URL as string | undefined)
  ?? 'ws://localhost:8000'

interface UseRimeAudioReturn {
  isPlaying: boolean
  bargeIn: () => Promise<void>
}

export function useRimeAudio(caseId: string | null): UseRimeAudioReturn {
  const [isPlaying, setIsPlaying] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourceQueueRef = useRef<AudioBuffer[]>([])
  const playingRef = useRef(false)
  const scheduledAtRef = useRef(0)

  // Get/init AudioContext
  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext({ sampleRate: 22050 })
    }
    return audioCtxRef.current
  }, [])

  // Decode and schedule a chunk
  const scheduleChunk = useCallback(async (data: ArrayBuffer) => {
    try {
      const ctx = getAudioCtx()
      if (ctx.state === 'suspended') await ctx.resume()

      const buffer = await ctx.decodeAudioData(data)
      const now = ctx.currentTime
      const startAt = Math.max(scheduledAtRef.current, now)

      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      source.start(startAt)

      scheduledAtRef.current = startAt + buffer.duration
      setIsPlaying(true)
      playingRef.current = true

      source.onended = () => {
        if (scheduledAtRef.current <= ctx.currentTime + 0.05) {
          setIsPlaying(false)
          playingRef.current = false
        }
      }
    } catch (err) {
      console.warn('[useRimeAudio] Decode error:', err)
    }
  }, [getAudioCtx])

  // Connect WS audio socket
  useEffect(() => {
    if (!caseId) return

    const ws = new WebSocket(`${WS_BASE}/ws/audio/${caseId}`)
    ws.binaryType = 'arraybuffer'
    wsRef.current = ws

    ws.onopen = () => {
      console.log('[useRimeAudio] Connected to audio stream:', caseId)
    }

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        scheduleChunk(event.data)
      } else if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'audio.stream_end') {
            // Stream complete — will naturally finish
          } else if (msg.type === 'audio.cancelled') {
            // Cancel all pending audio
            scheduledAtRef.current = getAudioCtx().currentTime
            setIsPlaying(false)
            playingRef.current = false
          }
        } catch { /* ignore */ }
      }
    }

    ws.onclose = () => {
      console.log('[useRimeAudio] WS closed:', caseId)
    }

    ws.onerror = (err) => {
      console.warn('[useRimeAudio] WS error:', err)
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [caseId, scheduleChunk, getAudioCtx])

  // Barge-in handler
  const bargeIn = useCallback(async () => {
    if (!caseId) return
    try {
      // Stop scheduled audio immediately
      scheduledAtRef.current = getAudioCtx().currentTime
      setIsPlaying(false)
      playingRef.current = false

      // Tell backend to cancel synthesis
      await fetch(`/api/voice/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: caseId }),
      })
    } catch (err) {
      console.warn('[useRimeAudio] Barge-in error:', err)
    }
  }, [caseId, getAudioCtx])

  return { isPlaying, bargeIn }
}
