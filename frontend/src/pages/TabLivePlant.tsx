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
    <div style={{ padding: 24, display: 'flex', gap: 24, height: '100%', background: '#F7F6F2' }}>
      {/* LEFT COLUMN: Map & Zones */}
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Active Alerts */}
        {activeCase && (
          <div style={{ 
            padding: 16, background: 'rgba(200,75,66,0.08)', border: '1px solid #C84B42', 
            borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12
          }}>
            <AlertTriangle color="#C84B42" />
            <div>
              <div style={{ fontWeight: 600, color: '#C84B42' }}>Active Alert: {activeCase.zone_id}</div>
              <div style={{ fontSize: 13, color: '#C84B42' }}>Compound Score: {Math.round(activeCase.compound_score * 100)}</div>
            </div>
          </div>
        )}

        {/* Dynamic SVG Map */}
        <div style={{ background: '#FFFFFF', padding: 24, borderRadius: 8, border: '1px solid #C8C9C6', flex: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#0E0D1F' }}>Plant Overview</h2>
          <div style={{ width: '100%', height: 400, background: '#F7F6F2', borderRadius: 8, position: 'relative', border: '1px solid #E9E9E5' }}>
             {/* Simple SVG Map Representation */}
             <svg width="100%" height="100%" viewBox="0 0 800 400">
               <rect x="50" y="50" width="200" height="300" fill={activeCase?.zone_id === 'Bay3' ? 'rgba(200,75,66,0.2)' : '#E9E9E5'} stroke={activeCase?.zone_id === 'Bay3' ? '#C84B42' : '#C8C9C6'} rx="8" />
               <text x="150" y="200" textAnchor="middle" fill="#0E0D1F" fontWeight="bold">Bay 3</text>
               
               <rect x="300" y="50" width="200" height="140" fill={activeCase?.zone_id === 'Bay4' ? 'rgba(200,75,66,0.2)' : '#E9E9E5'} stroke={activeCase?.zone_id === 'Bay4' ? '#C84B42' : '#C8C9C6'} rx="8" />
               <text x="400" y="125" textAnchor="middle" fill="#0E0D1F" fontWeight="bold">Bay 4</text>
               
               <rect x="300" y="210" width="200" height="140" fill="#E9E9E5" stroke="#C8C9C6" rx="8" />
               <text x="400" y="285" textAnchor="middle" fill="#0E0D1F" fontWeight="bold">Storage</text>
               
               <rect x="550" y="50" width="200" height="300" fill="#E9E9E5" stroke="#C8C9C6" rx="8" />
               <text x="650" y="200" textAnchor="middle" fill="#0E0D1F" fontWeight="bold">Refinery</text>
             </svg>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Streams */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Live Sensor Stream */}
        <div style={{ background: '#FFFFFF', padding: 16, borderRadius: 8, border: '1px solid #C8C9C6', flex: 1, overflowY: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, color: '#0E0D1F' }}>
            <Activity size={16} color="#0D9488" /> Live Sensor Stream
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.values(liveSensors).map((sensor: any) => (
              <div key={sensor.equipment_id} style={{ padding: 8, background: '#F7F6F2', borderRadius: 6, fontSize: 13, border: '1px solid #E9E9E5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: '#0E0D1F' }}>{sensor.equipment_id}</span>
                  <span style={{ color: '#62636A' }}>{sensor.zone_id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#0E0D1F' }}>{sensor.value} {sensor.unit}</span>
                  <span style={{ color: sensor.severity_hint === 'critical' ? '#C84B42' : '#72856C', fontWeight: 600 }}>
                    {sensor.severity_hint}
                  </span>
                </div>
              </div>
            ))}
            {Object.keys(liveSensors).length === 0 && (
              <div style={{ color: '#8E9096', fontSize: 13, textAlign: 'center', padding: 20 }}>No telemetry received yet.</div>
            )}
          </div>
        </div>

        {/* Intelligence Ticker */}
        <div style={{ background: '#FFFFFF', padding: 16, borderRadius: 8, border: '1px solid #C8C9C6', flex: 1, overflowY: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, color: '#0E0D1F' }}>
            <Cpu size={16} color="#0D9488" /> Intelligence Ticker
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {intelligenceTicker.map((item, i) => (
              <div key={i} style={{ padding: 8, borderLeft: '3px solid #0D9488', background: '#F7F6F2', fontSize: 12 }}>
                <div style={{ color: '#62636A', marginBottom: 2 }}>{new Date(item.ts).toLocaleTimeString()}</div>
                <div style={{ fontWeight: 600, color: '#0E0D1F' }}>{item.type}</div>
              </div>
            ))}
            {intelligenceTicker.length === 0 && (
              <div style={{ color: '#8E9096', fontSize: 13, textAlign: 'center', padding: 20 }}>No events yet.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
