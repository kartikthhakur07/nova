import React from 'react'
import { motion } from 'framer-motion'
import { useCaseStore } from '../../store/useCaseStore'
import { FileText, Activity } from 'lucide-react'

export default function EvidencePanel() {
  const { panelContext } = useCaseStore(s => s.uiState)
  const evidenceList = useCaseStore(s => s.evidenceList)

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      style={{
        position: 'absolute',
        right: 24, top: 24, bottom: 24,
        width: 380,
        background: '#FFFFFF',
        borderRadius: 16,
        boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.03)',
        border: '1px solid #E4E8EF',
        display: 'flex', flexDirection: 'column',
        zIndex: 10
      }}
    >
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F3F7' }}>
        <h3 style={{ margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, color: '#0F1729' }}>
          {panelContext?.title || 'Context & Evidence'}
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#5A6578' }}>
          {panelContext?.subtitle || 'Correlated signals for active zone'}
        </p>
      </div>

      <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {evidenceList.length === 0 ? (
          <div style={{ color: '#9CA3B4', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
            No evidence available.
          </div>
        ) : (
          evidenceList.map((item, i) => (
            <div key={i} style={{
              background: '#F8F9FB', padding: 16, borderRadius: 12, border: '1px solid #F1F3F7'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {item.source === 'sensor' ? <Activity size={14} color="#2563EB" /> : <FileText size={14} color="#7C3AED" />}
                <span style={{ fontSize: 11, fontWeight: 700, color: '#5A6578', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {item.source}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#0F1729', lineHeight: 1.5 }}>
                {item.description}
              </div>
              {item.value !== null && (
                <div style={{ marginTop: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: '#2563EB' }}>
                  {item.value} {item.unit}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </motion.div>
  )
}
