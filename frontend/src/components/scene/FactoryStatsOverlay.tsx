import React, { useState, useEffect } from 'react'
import { Activity, Users, Settings2, Zap } from 'lucide-react'

export default function FactoryStatsOverlay() {
  // Simulate live data fluctuating slightly for the "alive" feel
  const [stats, setStats] = useState({
    production: 98.4,
    power: 4.2,
    personnel: 124,
    pressure: 101.2
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        production: Math.max(90, Math.min(100, prev.production + (Math.random() - 0.5) * 0.5)),
        power: Math.max(3.5, Math.min(5.0, prev.power + (Math.random() - 0.5) * 0.1)),
        personnel: prev.personnel,
        pressure: Math.max(98, Math.min(105, prev.pressure + (Math.random() - 0.5) * 0.8))
      }))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      position: 'absolute',
      left: 24, bottom: 24, top: 90,
      width: 260,
      pointerEvents: 'none', // Allow clicking through if needed
      display: 'flex', flexDirection: 'column', gap: 16,
      zIndex: 5
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid #E4E8EF',
        borderRadius: 16,
        padding: 20,
        boxShadow: '0 10px 25px rgba(0,0,0,0.05)'
      }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9CA3B4' }}>
          Global Plant Metrics
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <StatRow 
            icon={<Settings2 size={16} color="#2563EB" />} 
            label="Production Efficiency" 
            value={`${stats.production.toFixed(1)}%`} 
          />
          <StatRow 
            icon={<Zap size={16} color="#7C3AED" />} 
            label="Power Draw" 
            value={`${stats.power.toFixed(2)} MW`} 
          />
          <StatRow 
            icon={<Activity size={16} color="#EA580C" />} 
            label="System Pressure" 
            value={`${stats.pressure.toFixed(1)} kPa`} 
          />
          <StatRow 
            icon={<Users size={16} color="#0D9488" />} 
            label="Active Personnel" 
            value={`${stats.personnel}`} 
          />
        </div>
      </div>
    </div>
  )
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        <span style={{ fontSize: 13, color: '#5A6578', fontWeight: 500 }}>{label}</span>
      </div>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: '#0F1729' }}>
        {value}
      </span>
    </div>
  )
}
