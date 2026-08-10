import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, ShieldAlert } from 'lucide-react'

interface AuthGateProps {
  edit: {
    target_id: string
    field: string
    from_value: string
    to_value: string
    reason: string
  }
}

export default function AuthorizationGate({ edit }: AuthGateProps) {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')

  const handleAction = (action: 'approved' | 'rejected') => {
    setStatus(action)
    // Here we would typically emit an auth resolution back to the websocket
    // e.g. socket.send({ type: 'authorization.resolved', payload: { action } })
  }

  if (status !== 'pending') return null

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      style={{
        position: 'absolute',
        bottom: 120, left: '50%', transform: 'translateX(-50%)',
        background: '#FFFFFF',
        borderRadius: 16,
        boxShadow: '0 20px 40px rgba(234,88,12,0.15), 0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid #FED7AA', // Orange-ish border to indicate action needed
        borderTop: '4px solid #EA580C',
        width: 480,
        zIndex: 20,
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <ShieldAlert size={20} color="#EA580C" />
          <h3 style={{ margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, color: '#0F1729' }}>
            Authorization Required
          </h3>
        </div>
        
        <div style={{ fontSize: 14, color: '#0F1729', marginBottom: 16, lineHeight: 1.5 }}>
          Nova proposes editing <strong style={{ color: '#2563EB' }}>{edit.target_id}</strong>
        </div>

        <div style={{ background: '#F8F9FB', borderRadius: 8, padding: 12, marginBottom: 16, border: '1px solid #E4E8EF', display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center' }}>
          <div style={{ textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#9CA3B4', textDecoration: 'line-through' }}>
            {edit.from_value}
          </div>
          <div style={{ color: '#9CA3B4' }}>→</div>
          <div style={{ textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: '#0F1729', fontWeight: 700 }}>
            {edit.to_value}
          </div>
        </div>

        <div style={{ fontSize: 13, color: '#5A6578', marginBottom: 24 }}>
          <strong>Reason:</strong> {edit.reason}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => handleAction('rejected')}
            style={{
              flex: 1, padding: '12px', borderRadius: 8,
              background: '#FFFFFF', border: '1px solid #E4E8EF',
              color: '#0F1729', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
          >
            <X size={16} /> Reject
          </button>
          <button
            onClick={() => handleAction('approved')}
            style={{
              flex: 1, padding: '12px', borderRadius: 8,
              background: '#2563EB', border: 'none',
              color: '#FFFFFF', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
          >
            <Check size={16} /> Approve
          </button>
        </div>
      </div>
    </motion.div>
  )
}
