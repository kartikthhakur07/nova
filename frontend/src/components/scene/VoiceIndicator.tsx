import React from 'react'
import { motion } from 'framer-motion'
import { Mic2, MicOff } from 'lucide-react'

interface Props {
  listening: boolean
  muted: boolean
  onToggleMute: () => void
}

export default function VoiceIndicator({ listening, muted, onToggleMute }: Props) {
  return (
    <div style={{
      position: 'absolute',
      top: 24, left: 24,
      display: 'flex', alignItems: 'center', gap: 12,
      zIndex: 20
    }}>
      <button
        onClick={onToggleMute}
        style={{
          width: 48, height: 48, borderRadius: '50%',
          background: '#FFFFFF',
          border: '1px solid #E4E8EF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          color: muted ? '#DC2626' : '#5A6578'
        }}
      >
        {muted ? <MicOff size={20} /> : <Mic2 size={20} />}
      </button>

      {!muted && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <motion.div
            animate={{
              scale: listening ? [1, 1.2, 1] : 1,
              opacity: listening ? [0.6, 1, 0.6] : 0.4
            }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{
              width: 12, height: 12, borderRadius: '50%',
              background: listening ? '#2563EB' : '#9CA3B4'
            }}
          />
          <span style={{
            fontSize: 13, fontWeight: 600,
            color: listening ? '#2563EB' : '#9CA3B4',
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}>
            {listening ? 'Listening...' : 'Resting'}
          </span>
        </div>
      )}
    </div>
  )
}
