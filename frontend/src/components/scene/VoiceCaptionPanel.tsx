import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function VoiceCaptionPanel({ text }: { text: string }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          style={{
            position: 'absolute',
            bottom: 40,
            left: 0, right: 0,
            display: 'flex', justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 30
          }}
        >
          <div style={{
            background: 'rgba(15, 23, 41, 0.85)',
            backdropFilter: 'blur(12px)',
            color: '#FFFFFF',
            padding: '16px 24px',
            borderRadius: 12,
            fontFamily: "'Inter', sans-serif",
            fontSize: 16,
            fontWeight: 500,
            maxWidth: '60%',
            textAlign: 'center',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            letterSpacing: '0.01em',
            lineHeight: 1.5
          }}>
            "{text}"
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
