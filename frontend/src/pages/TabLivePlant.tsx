import React, { useEffect, useState } from 'react'
import { getFactoryState } from '../services/api'
import { useCaseStore } from '../store/useCaseStore'
import { Activity, AlertTriangle, Cpu } from 'lucide-react'

export default function TabLivePlant() {
  const [factoryState, setFactoryState] = useState<any>(null)
  
  const liveSensors = useCaseStore(s => s.liveSensors)
  const intelligenceTicker = useCaseStore(s => s.intelligenceTicker)
  const activeCase = useCaseStore(s => s.activeCase)

  useEffect(() => {
    getFactoryState().then(setFactoryState).catch(console.error)
  }, [])

  return (
    <div style={{ padding: 24, display: 'flex', gap: 24, height: '100%' }}>
      {/* LEFT COLUMN: Map & Zones */}
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Active Alerts */}
        {activeCase && (
          <div style={{ 
            padding: 16, background: '#FEF2F2', border: '1px solid #FCA5A5', 
            borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12
          }}>
            <AlertTriangle color="#DC2626" />
            <div>
              <div style={{ fontWeight: 600, color: '#991B1B' }}>Active Alert: {activeCase.zone_id}</div>
              <div style={{ fontSize: 13, color: '#DC2626' }}>Compound Score: {Math.round(activeCase.compound_score * 100)}</div>
            </div>
          </div>
        )}

        {/* Dynamic SVG Map */}
        <div style={{ background: '#FFF', padding: 24, borderRadius: 8, border: '1px solid #E4E8EF', flex: 1 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Plant Overview</h2>
          <div style={{ width: '100%', height: 400, background: '#F1F3F7', borderRadius: 8, position: 'relative' }}>
             {/* Simple SVG Map Representation */}
             <svg width="100%" height="100%" viewBox="0 0 800 400">
               <rect x="50" y="50" width="200" height="300" fill={activeCase?.zone_id === 'Bay3' ? '#FCA5A5' : '#D1D5DB'} rx="8" />
               <text x="150" y="200" textAnchor="middle" fill="#374151" fontWeight="bold">Bay 3</text>
               
               <rect x="300" y="50" width="200" height="140" fill={activeCase?.zone_id === 'Bay4' ? '#FCA5A5' : '#D1D5DB'} rx="8" />
               <text x="400" y="125" textAnchor="middle" fill="#374151" fontWeight="bold">Bay 4</text>
               
               <rect x="300" y="210" width="200" height="140" fill="#D1D5DB" rx="8" />
               <text x="400" y="285" textAnchor="middle" fill="#374151" fontWeight="bold">Storage</text>
               
               <rect x="550" y="50" width="200" height="300" fill="#D1D5DB" rx="8" />
               <text x="650" y="200" textAnchor="middle" fill="#374151" fontWeight="bold">Refinery</text>
             </svg>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Streams */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Live Sensor Stream */}
        <div style={{ background: '#FFF', padding: 16, borderRadius: 8, border: '1px solid #E4E8EF', flex: 1, overflowY: 'auto' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} /> Live Sensor Stream
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.values(liveSensors).map((sensor: any) => (
              <div key={sensor.equipment_id} style={{ padding: 8, background: '#F8F9FB', borderRadius: 6, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{sensor.equipment_id}</span>
                  <span style={{ color: '#5A6578' }}>{sensor.zone_id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{sensor.value} {sensor.unit}</span>
                  <span style={{ color: sensor.severity_hint === 'critical' ? '#DC2626' : '#059669', fontWeight: 500 }}>
                    {sensor.severity_hint}
                  </span>
                </div>
              </div>
            ))}
            {Object.keys(liveSensors).length === 0 && (
              <div style={{ color: '#9CA3B4', fontSize: 13, textAlign: 'center', padding: 20 }}>No telemetry received yet.</div>
            )}
          </div>
        </div>

        {/* Intelligence Ticker */}
        <div style={{ background: '#FFF', padding: 16, borderRadius: 8, border: '1px solid #E4E8EF', flex: 1, overflowY: 'auto' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={16} /> Intelligence Ticker
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {intelligenceTicker.map((item, i) => (
              <div key={i} style={{ padding: 8, borderLeft: '2px solid #2563EB', background: '#F8F9FB', fontSize: 12 }}>
                <div style={{ color: '#5A6578', marginBottom: 2 }}>{new Date(item.ts).toLocaleTimeString()}</div>
                <div style={{ fontWeight: 600 }}>{item.type}</div>
              </div>
            ))}
            {intelligenceTicker.length === 0 && (
              <div style={{ color: '#9CA3B4', fontSize: 13, textAlign: 'center', padding: 20 }}>No events yet.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
