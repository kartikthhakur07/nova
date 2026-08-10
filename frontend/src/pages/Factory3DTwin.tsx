/**
 * frontend/src/pages/Factory3DTwin.tsx
 * Isometric 3D SVG factory digital twin with anomaly beacons.
 */
import React, { useState, useEffect } from 'react'
import { getFactoryState, getProductionKPIs } from '../services/api'
import { useCaseStore } from '../store/useCaseStore'
import { Activity, X, AlertTriangle, Users, CheckCircle } from 'lucide-react'

const TIER: Record<string, { top: string; front: string; side: string; stroke: string; glow: string }> = {
  low:      { top: '#D1FAE5', front: '#A7F3D0', side: '#6EE7B7', stroke: '#059669', glow: 'rgba(5,150,105,0.08)' },
  medium:   { top: '#FEF9C3', front: '#FDE68A', side: '#FCD34D', stroke: '#D97706', glow: 'rgba(217,119,6,0.12)' },
  high:     { top: '#FFEDD5', front: '#FED7AA', side: '#FDBA74', stroke: '#EA580C', glow: 'rgba(234,88,12,0.2)' },
  critical: { top: '#FEE2E2', front: '#FECACA', side: '#FCA5A5', stroke: '#DC2626', glow: 'rgba(220,38,38,0.3)' },
}
const BG = '#0B1120', GRID = 'rgba(99,102,241,0.1)', TXT = '#E2E8F0', ACC = '#6366F1'

function iso(gx: number, gy: number, gz: number): [number, number] {
  return [(gx - gy) * 32 + 420, (gx + gy) * 16 - gz * 22 + 100]
}

interface Bldg { id: string; label: string; sub: string; gx: number; gy: number; w: number; d: number; h: number; sens: string[]; eq: string[] }
interface Sensor { sensor_id: string; value: number | null; unit: string; status: string }

const BLDGS: Bldg[] = [
  { id:'Bay1', label:'Bay 1', sub:'Feedstock',  gx:0, gy:0, w:3, d:3, h:2, sens:['T-07'],          eq:['Tank T-07','Valve V-01'] },
  { id:'Bay2', label:'Bay 2', sub:'Pre-Treat',   gx:4, gy:0, w:3, d:3, h:3, sens:['PH-01'],         eq:['HX-01','Mixer M-02'] },
  { id:'Bay3', label:'Bay 3', sub:'Refining',    gx:8, gy:0, w:3, d:4, h:5, sens:['GD-B3-01','C-14'], eq:['Compressor C-14','Pump P-08'] },
  { id:'Bay4', label:'Bay 4', sub:'Reactor',     gx:0, gy:5, w:3, d:3, h:6, sens:['R-22','TC-01'],   eq:['Reactor R-22','TC-01'] },
  { id:'Bay5', label:'Bay 5', sub:'Finishing',   gx:4, gy:5, w:7, d:3, h:2, sens:['FT-01'],          eq:['Flow Meter FT-01','QA-01'] },
]

const PIPES = [
  { from:[1.5,1.5,1] as [number,number,number], to:[5.5,1.5,1] as [number,number,number], col:'#6366F1' },
  { from:[5.5,1.5,1] as [number,number,number], to:[9.5,2.0,1] as [number,number,number], col:'#0D9488' },
  { from:[1.5,6.5,1] as [number,number,number], to:[5.5,6.5,1] as [number,number,number], col:'#8B5CF6' },
]

export default function Factory3DTwin() {
  const [zones, setZones] = useState<Record<string,{risk_tier:string}>>({})
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [pers, setPers] = useState<Record<string,number>>({})
  const [sel, setSel] = useState<Bldg|null>(null)
  const [pulse, setPulse] = useState(0)
  const [flow, setFlow] = useState(0)
  const focused = useCaseStore(s => s.uiState.focusedZone)

  useEffect(() => {
    const load = async () => {
      try {
        const [st, kp] = await Promise.all([getFactoryState(), getProductionKPIs()])
        const zm: Record<string,{risk_tier:string}> = {}
        ;(st.zones ?? []).forEach((z: any) => { zm[z.zone_id] = z })
        setZones(zm); setSensors((st.sensors ?? []) as Sensor[]); setPers(kp.personnel_by_zone ?? {})
      } catch { /* offline */ }
    }
    load(); const id = setInterval(load, 3000); return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let f = 0, raf: number
    const tick = () => { f++; setPulse(f % 120); setFlow(f % 30); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf)
  }, [])

  const tier = (id: string) => zones[id]?.risk_tier ?? 'low'

  function Bldg({ b }: { b: Bldg }) {
    const t = tier(b.id), c = TIER[t] ?? TIER.low
    const isA = t === 'high' || t === 'critical'
    const isFoc = focused === b.id
    const pct = (pulse / 120) * Math.PI * 2
    const gA = isA ? 0.3 + 0.2 * Math.sin(pct) : 0
    const bA = isA ? 0.6 + 0.4 * Math.sin(pct * 2) : 0
    const pts = (corners: [number,number][]) => corners.map(([x,y]) => x + ',' + y).join(' ')
    const top  = [[b.gx,b.gy],[b.gx+b.w,b.gy],[b.gx+b.w,b.gy+b.d],[b.gx,b.gy+b.d]].map(([x,y]) => iso(x,y,b.h)) as [number,number][]
    const front= [[b.gx,b.gy+b.d,0],[b.gx+b.w,b.gy+b.d,0],[b.gx+b.w,b.gy+b.d,b.h],[b.gx,b.gy+b.d,b.h]].map(([x,y,z]) => iso(x,y,z)) as [number,number][]
    const side = [[b.gx+b.w,b.gy,0],[b.gx+b.w,b.gy+b.d,0],[b.gx+b.w,b.gy+b.d,b.h],[b.gx+b.w,b.gy,b.h]].map(([x,y,z]) => iso(x,y,z)) as [number,number][]
    const [lx,ly] = iso(b.gx+b.w/2, b.gy+b.d/2, b.h+0.4)
    const [bx,by] = iso(b.gx+b.w/2, b.gy+b.d/2, b.h)
    const [cx,cy] = iso(b.gx+b.w/2, b.gy+b.d/2, 0)
    const pc = pers[b.id] ?? 0
    return (
      <g style={{cursor:'pointer'}} onClick={() => setSel(b)}>
        {isA && <ellipse cx={cx} cy={cy} rx={b.w*28} ry={b.d*14} fill={c.glow} opacity={gA}/>}
        <polygon points={pts(side)}  fill={c.side}  stroke={c.stroke} strokeWidth={isFoc?2:0.8}/>
        <polygon points={pts(front)} fill={c.front} stroke={c.stroke} strokeWidth={isFoc?2:0.8}/>
        <polygon points={pts(top)}   fill={c.top}   stroke={c.stroke} strokeWidth={isFoc?2.5:1}/>
        {isFoc && <polygon points={pts(top)} fill="none" stroke={ACC} strokeWidth={3} strokeDasharray="6,3" opacity={0.9}/>}
        {isA && <>
          <line x1={bx} y1={by} x2={bx} y2={by-36} stroke={c.stroke} strokeWidth={2}/>
          <circle cx={bx} cy={by-36} r={5} fill={c.stroke} opacity={bA}/>
          <circle cx={bx} cy={by-36} r={14} fill={c.stroke} opacity={bA*0.25}/>
          <text x={bx} y={by-52} textAnchor="middle" fontSize={10} fontWeight={700} fill={c.stroke} fontFamily="'JetBrains Mono',monospace">{'⚠ ' + t.toUpperCase()}</text>
        </>}
        <text x={lx} y={ly} textAnchor="middle" fontSize={10} fontWeight={700} fill={TXT} fontFamily="'Plus Jakarta Sans',sans-serif" style={{pointerEvents:'none'}}>{b.label}</text>
        {pc > 0 && <>
          <circle cx={lx+32} cy={ly-5} r={9} fill="#1E293B" stroke="#475569" strokeWidth={1}/>
          <text x={lx+32} y={ly-1} textAnchor="middle" fontSize={8} fontWeight={700} fill="#E2E8F0" fontFamily="'JetBrains Mono',monospace">{pc}</text>
        </>}
      </g>
    )
  }

  function Grid() {
    const ls = []
    for (let gx=0;gx<=12;gx++) { const [x1,y1]=iso(gx,0,0),[x2,y2]=iso(gx,9,0); ls.push(<line key={'gx'+gx} x1={x1} y1={y1} x2={x2} y2={y2} stroke={GRID} strokeWidth={0.5}/>) }
    for (let gy=0;gy<=9;gy++) { const [x1,y1]=iso(0,gy,0),[x2,y2]=iso(12,gy,0); ls.push(<line key={'gy'+gy} x1={x1} y1={y1} x2={x2} y2={y2} stroke={GRID} strokeWidth={0.5}/>) }
    return <>{ls}</>
  }

  const selSens = sensors.filter(s => sel?.sens.includes(s.sensor_id))

  return (
    <div style={{minHeight:'100vh',background:BG,display:'flex',flexDirection:'column',fontFamily:"'Inter',sans-serif"}}>
      <div style={{padding:'16px 24px',display:'flex',alignItems:'center',gap:16,borderBottom:'1px solid rgba(99,102,241,0.15)',background:'rgba(15,23,42,0.95)'}}>
        <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#6366F1,#4F46E5)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 20px rgba(99,102,241,0.4)'}}>
          <Activity size={18} color="#fff"/>
        </div>
        <div>
          <div style={{fontSize:16,fontWeight:700,color:TXT,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>3D Factory Digital Twin</div>
          <div style={{fontSize:12,color:'#64748B'}}>Isometric live view — click any building to inspect</div>
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:16,alignItems:'center'}}>
          {(['low','medium','high','critical'] as const).map(t => (
            <div key={t} style={{display:'flex',alignItems:'center',gap:5}}>
              <div style={{width:8,height:8,borderRadius:2,background:TIER[t].stroke}}/>
              <span style={{fontSize:11,color:'#94A3B8',textTransform:'capitalize'}}>{t}</span>
            </div>
          ))}
          <div style={{padding:'4px 10px',borderRadius:20,background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.3)',display:'flex',alignItems:'center',gap:5}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:'#10B981'}}/>
            <span style={{fontSize:11,color:'#10B981',fontWeight:600}}>LIVE</span>
          </div>
        </div>
      </div>

      <div style={{display:'flex',flex:1,overflow:'hidden'}}>
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:24,overflow:'auto'}}>
          <svg viewBox="0 0 840 540" style={{width:'100%',maxWidth:1000,height:'auto'}}>
            <defs>
              <radialGradient id="bg3d" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="#0F172A"/>
                <stop offset="100%" stopColor="#060B17"/>
              </radialGradient>
            </defs>
            <rect width={840} height={540} fill="url(#bg3d)"/>
            <Grid/>
            {PIPES.map((p,i) => {
              const [x1,y1]=iso(...p.from),[x2,y2]=iso(...p.to)
              const off=(flow+i*10)%30
              return <g key={i}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={p.col} strokeWidth={4} opacity={0.2}/>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={p.col} strokeWidth={2} strokeDasharray="8,10" strokeDashoffset={-off} opacity={0.9}/>
              </g>
            })}
            {[...BLDGS].reverse().map(b => <Bldg key={b.id} b={b}/>)}
            <text x={820} y={530} textAnchor="end" fontSize={9} fill="#334155" fontFamily="'JetBrains Mono',monospace">ISO 3D VIEW</text>
          </svg>
        </div>

        {sel && (
          <div style={{width:300,background:'#0F1729',borderLeft:'1px solid rgba(99,102,241,0.2)',display:'flex',flexDirection:'column',overflowY:'auto'}}>
            <div style={{padding:'16px 20px',borderBottom:'1px solid rgba(99,102,241,0.15)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:TXT,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{sel.label}</div>
                <div style={{fontSize:12,color:'#64748B',marginTop:2}}>{sel.sub}</div>
              </div>
              <button onClick={()=>setSel(null)} style={{background:'none',border:'none',cursor:'pointer',color:'#64748B'}}><X size={18}/></button>
            </div>
            <div style={{padding:16}}>
              <div style={{padding:'8px 12px',borderRadius:8,marginBottom:16,background:TIER[tier(sel.id)].glow,border:'1px solid ' + TIER[tier(sel.id)].stroke + '40',display:'flex',alignItems:'center',gap:8}}>
                <AlertTriangle size={14} color={TIER[tier(sel.id)].stroke}/>
                <span style={{fontSize:12,fontWeight:700,color:TIER[tier(sel.id)].stroke,fontFamily:"'JetBrains Mono',monospace"}}>{'RISK: ' + tier(sel.id).toUpperCase()}</span>
                <div style={{marginLeft:'auto',display:'flex',gap:4,alignItems:'center'}}>
                  <Users size={12} color="#64748B"/>
                  <span style={{fontSize:11,color:'#64748B'}}>{pers[sel.id] ?? 0}</span>
                </div>
              </div>
              <div style={{fontSize:11,fontWeight:700,color:'#475569',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.08em'}}>Sensor Readings</div>
              {selSens.length > 0 ? selSens.map(s => {
                const isA = s.status==='dead'||s.status==='degraded'
                return <div key={s.sensor_id} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:7,marginBottom:5,background:isA?'rgba(220,38,38,0.08)':'rgba(99,102,241,0.06)',border:'1px solid ' + (isA?'rgba(220,38,38,0.2)':'rgba(99,102,241,0.12)')}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:isA?'#DC2626':'#10B981',flexShrink:0}}/>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:'#94A3B8',flex:1}}>{s.sensor_id}</span>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:isA?'#F87171':TXT}}>{s.value!==null ? s.value + s.unit : 'DEAD'}</span>
                </div>
              }) : <div style={{padding:12,background:'rgba(99,102,241,0.05)',borderRadius:8,fontSize:12,color:'#475569'}}>No live data — run a scenario.</div>}
              <div style={{fontSize:11,fontWeight:700,color:'#475569',marginTop:16,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.08em'}}>Equipment</div>
              {sel.eq.map(e => <div key={e} style={{padding:'7px 12px',borderRadius:7,marginBottom:5,background:'rgba(99,102,241,0.05)',border:'1px solid rgba(99,102,241,0.1)',display:'flex',alignItems:'center',gap:8}}>
                <CheckCircle size={12} color="#10B981"/><span style={{fontSize:12,color:'#94A3B8'}}>{e}</span>
              </div>)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
