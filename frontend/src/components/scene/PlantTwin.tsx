import React from 'react'
import { motion } from 'framer-motion'
import { useCaseStore } from '../../store/useCaseStore'
import { AlertTriangle, Activity } from 'lucide-react'

const BAYS = [
  { id: 'bay-1', label: 'Bay 1', x: 10, y: 10 },
  { id: 'bay-2', label: 'Bay 2', x: 50, y: 10 },
  { id: 'bay-3', label: 'Bay 3', x: 10, y: 50 }, // Primary focus for demo
  { id: 'bay-4', label: 'Bay 4', x: 50, y: 50 },
  { id: 'bay-5', label: 'Bay 5', x: 30, y: 80 },
]

export default function PlantTwin() {
  const { focusedZone } = useCaseStore(s => s.uiState)

  // Calculate camera scale and translation based on focus
  // If focused, we zoom into the specific bay
  const isFocused = !!focusedZone
  const targetBay = BAYS.find(b => b.id === focusedZone)
  
  const scale = isFocused ? 2.5 : 1
  const xOffset = targetBay ? 50 - targetBay.x : 0
  const yOffset = targetBay ? 50 - targetBay.y : 0

  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#F8F9FB', // Light theme background
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      perspective: '1000px',
      overflow: 'hidden'
    }}>
      <motion.div
        animate={{
          scale,
          x: `${xOffset}%`,
          y: `${yOffset}%`,
          rotateX: isFocused ? 20 : 45, // flattens slightly when zooming in
          rotateZ: isFocused ? 0 : -10
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 100 }}
        style={{
          width: '80%', height: '80%', maxWidth: 1000, maxHeight: 800,
          background: 'rgba(255,255,255,0.5)',
          border: '1px solid #E4E8EF',
          borderRadius: 24,
          position: 'relative',
          transformStyle: 'preserve-3d',
          boxShadow: '0 20px 40px rgba(0,0,0,0.05)'
        }}
      >
        {/* Decorative Grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(#E4E8EF 1px, transparent 1px), linear-gradient(90deg, #E4E8EF 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.5, borderRadius: 24
        }} />

        {/* Bays */}
        {BAYS.map(bay => {
          const isTarget = bay.id === focusedZone
          
          return (
            <motion.div
              key={bay.id}
              style={{
                position: 'absolute',
                left: `${bay.x}%`,
                top: `${bay.y}%`,
                width: '35%', height: '25%',
                background: '#FFFFFF',
                border: `2px solid ${isTarget ? '#2563EB' : '#E4E8EF'}`,
                borderRadius: 12,
                boxShadow: isTarget ? '0 0 0 4px rgba(37,99,235,0.1), 0 10px 20px rgba(0,0,0,0.05)' : '0 4px 6px rgba(0,0,0,0.02)',
                display: 'flex', flexDirection: 'column',
                padding: 16
              }}
              animate={{
                z: isTarget ? 40 : 0,
                opacity: isFocused && !isTarget ? 0.3 : 1
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: '#0F1729' }}>
                  {bay.label}
                </span>
                {bay.id === 'bay-3' && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{ color: '#EA580C' }} // High risk orange
                  >
                    <AlertTriangle size={16} />
                  </motion.div>
                )}
              </div>
              
              {/* Simulated internal structure */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                <Activity size={48} color="#0F1729" />
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
