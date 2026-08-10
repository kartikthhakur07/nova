/**
 * frontend/src/pages/FridayCoPilot.tsx
 * FRIDAY — Autonomous AI Co-Pilot chat interface.
 * Dark-mode full-page chat with streaming text reveal,
 * quick-command cards, contextual awareness, and proactive alerts.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useCaseStore } from '../store/useCaseStore'
import { Bot, Mic2, MicOff, Send, Zap, AlertTriangle, Shield, Search, ChevronRight, Wifi } from 'lucide-react'

const BG = '#080F1E', SURFACE = '#0F1729', CARD = '#141F35'
const BORDER = 'rgba(99,102,241,0.18)', ACC = '#6366F1', TXT = '#E2E8F0'
const FD = "'Plus Jakarta Sans',sans-serif", FM = "'JetBrains Mono',monospace"

interface Message {
  id: string
  role: 'friday' | 'user'
  text: string
  ts: number
  typing?: boolean
}

const QUICK_CMDS = [
  { icon: AlertTriangle, label: 'Bay 3 status?',    cmd: 'What is the current status of Bay 3 and are there any active anomalies?', color: '#F97316' },
  { icon: Search,        label: 'Similar incidents', cmd: 'Find similar past incidents to the current active case', color: '#6366F1' },
  { icon: Shield,        label: 'Risk summary',      cmd: 'Give me a full compound risk summary for the facility', color: '#10B981' },
  { icon: Zap,           label: 'Recommend action',  cmd: 'What action do you recommend I take right now?', color: '#F59E0B' },
]

const FRIDAY_RESPONSES: Record<string, string> = {
  default: "I'm monitoring all five bays continuously. No critical anomalies at this moment. Compound risk is stable. Standing by for your command.",
  bay3: "Bay 3 — Refining Unit — currently shows ELEVATED gas concentration. GD-B3-01 reads 147 ppm (threshold: 100 ppm). Compressor C-14 is running at 94% capacity. I recommend immediate inspection and consider issuing a permit suspension if gas levels climb above 200 ppm.",
  similar: "I've searched the memory vault. Found 3 similar incidents:\n\n• Case INC-2024-041: Gas leak in Bay 3 — resolved via permit suspend + ventilation (72h)\n• Case INC-2024-019: Compressor overpressure — root cause: seal degradation\n• Case INC-2023-088: Multi-sensor false-positive — cleared after recalibration\n\nMost relevant: INC-2024-041. Recommend same playbook.",
  risk: "Compound Risk Assessment:\n\n• Bay 3 — HIGH (gas leak vector)\n• Bay 4 — MEDIUM (reactor temp drift +2.4°C)\n• Bay 1 — LOW (nominal)\n• Bay 2 — LOW (nominal)\n• Bay 5 — LOW (nominal)\n\nOverall facility risk score: 68/100. Primary driver: Bay 3 gas concentration + Bay 4 thermal drift correlation. Confidence: 0.87.",
  action: "My recommendation:\n\n1. IMMEDIATE — Issue permit suspension for Bay 3 (gas leak vector active)\n2. SHORT-TERM — Deploy inspection team to verify GD-B3-01 reading physically\n3. PARALLEL — Monitor Bay 4 thermocouple TC-01 for further drift\n4. ESCALATE — If gas exceeds 200 ppm within 15 minutes, trigger evacuation protocol\n\nI've prepared the authorization request. Awaiting your approval.",
}

function pickResponse(input: string): string {
  const l = input.toLowerCase()
  if (l.includes('bay 3') || l.includes('bay3') || l.includes('gas') || l.includes('refin')) return FRIDAY_RESPONSES.bay3
  if (l.includes('similar') || l.includes('past') || l.includes('history')) return FRIDAY_RESPONSES.similar
  if (l.includes('risk') || l.includes('summary') || l.includes('status')) return FRIDAY_RESPONSES.risk
  if (l.includes('action') || l.includes('recommend') || l.includes('what should')) return FRIDAY_RESPONSES.action
  return FRIDAY_RESPONSES.default
}

function useTypewriter(text: string, speed = 18) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  useEffect(() => {
    setDisplayed(''); setDone(false)
    let i = 0
    const id = setInterval(() => {
      i++; setDisplayed(text.slice(0, i))
      if (i >= text.length) { clearInterval(id); setDone(true) }
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])
  return { displayed, done }
}

function FridayMessage({ msg }: { msg: Message }) {
  const { displayed } = useTypewriter(msg.typing ? msg.text : msg.text, msg.typing ? 12 : 0)
  const txt = msg.typing ? displayed : msg.text
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#6366F1,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 16px rgba(99,102,241,0.4)' }}>
        <Bot size={16} color="#fff"/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: ACC, fontFamily: FD }}>FRIDAY</span>
          <span style={{ fontSize: 11, color: '#334155' }}>{new Date(msg.ts).toLocaleTimeString()}</span>
          <div style={{ marginLeft: 4, padding: '2px 7px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <span style={{ fontSize: 9, color: '#10B981', fontWeight: 700, letterSpacing: '0.08em' }}>AI</span>
          </div>
        </div>
        <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 12, borderTopLeftRadius: 4, padding: '12px 16px', fontSize: 13, color: TXT, lineHeight: 1.7, whiteSpace: 'pre-line', fontFamily: FD }}>
          {txt}
          {msg.typing && txt.length < msg.text.length && <span style={{ opacity: 0.5, animation: 'blink 1s infinite' }}>▌</span>}
        </div>
      </div>
    </div>
  )
}

function UserMessage({ msg }: { msg: Message }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexDirection: 'row-reverse' }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: '#1E293B', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 14 }}>👤</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: '#334155' }}>{new Date(msg.ts).toLocaleTimeString()}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', fontFamily: FD }}>YOU</span>
        </div>
        <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, borderTopRightRadius: 4, padding: '12px 16px', fontSize: 13, color: '#CBD5E1', maxWidth: '80%', fontFamily: FD }}>
          {msg.text}
        </div>
      </div>
    </div>
  )
}

export default function FridayCoPilot() {
  const [msgs, setMsgs] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [pulse, setPulse] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const activeCase = useCaseStore(s => s.activeCase)

  // Boot message
  useEffect(() => {
    const boot: Message = {
      id: 'boot', role: 'friday', ts: Date.now(), typing: true,
      text: 'FRIDAY online. All systems nominal. I\'m monitoring ' + (activeCase ? 'case ' + activeCase.case_id : 'the facility') + ' in real-time.\n\nI can answer questions about current risk levels, retrieve historical incidents from memory, recommend actions, and execute authorizations on your behalf.\n\nHow can I assist you?',
    }
    setTimeout(() => setMsgs([boot]), 600)
  }, [])

  // Proactive alerts from agent state
  const activeCase2 = useCaseStore(s => s.activeCase)
  const riskScore = useCaseStore(s => s.uiState.compoundRiskScore)
  const prevScore = useRef(0)
  useEffect(() => {
    if (riskScore && riskScore > 60 && riskScore !== prevScore.current) {
      prevScore.current = riskScore
      const alert: Message = {
        id: 'alert-' + Date.now(), role: 'friday', ts: Date.now(), typing: true,
        text: 'PROACTIVE ALERT: Compound risk has reached ' + riskScore + '/100. Primary driver detected in Bay 3. I recommend immediate review. Type "recommend action" for my full assessment.',
      }
      setMsgs(prev => [...prev, alert])
    }
  }, [riskScore])

  // Pulse animation for thinking indicator
  useEffect(() => {
    const id = setInterval(() => setPulse(p => (p + 1) % 60), 50)
    return () => clearInterval(id)
  }, [])

  const scrollBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [])

  const send = useCallback((text: string) => {
    if (!text.trim() || thinking) return
    const userMsg: Message = { id: 'u-' + Date.now(), role: 'user', ts: Date.now(), text: text.trim() }
    setMsgs(prev => [...prev, userMsg])
    setInput('')
    setThinking(true)
    scrollBottom()
    const delay = 800 + Math.random() * 600
    setTimeout(() => {
      const response = pickResponse(text)
      const fridayMsg: Message = { id: 'f-' + Date.now(), role: 'friday', ts: Date.now(), text: response, typing: true }
      setMsgs(prev => [...prev, fridayMsg])
      setThinking(false)
      scrollBottom()
    }, delay)
  }, [thinking, scrollBottom])

  const pct = (pulse / 60) * Math.PI * 2
  const waveH = thinking ? [4,8,12,8,4,10,6,14,6,10].map((h, i) => h * (0.5 + 0.5 * Math.sin(pct + i * 0.8))) : [3,3,3,3,3,3,3,3,3,3]

  return (
    <div style={{ height: '100vh', background: BG, display: 'flex', flexDirection: 'column', fontFamily: FD }}>
      {/* Header */}
      <div style={{ padding: '14px 24px', borderBottom: '1px solid ' + BORDER, background: 'rgba(8,15,30,0.95)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#6366F1,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(99,102,241,0.5)' }}>
          <Bot size={20} color="#fff"/>
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: TXT, letterSpacing: '-0.02em' }}>FRIDAY</div>
          <div style={{ fontSize: 12, color: '#475569' }}>Autonomous Industrial AI Co-Pilot</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Live waveform */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 24 }}>
            {waveH.map((h, i) => (
              <div key={i} style={{ width: 3, height: h, borderRadius: 2, background: thinking ? ACC : '#334155', transition: 'height 0.1s ease', opacity: thinking ? 1 : 0.4 }}/>
            ))}
          </div>
          <div style={{ padding: '4px 10px', borderRadius: 20, background: thinking ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.1)', border: '1px solid ' + (thinking ? 'rgba(99,102,241,0.4)' : 'rgba(16,185,129,0.3)'), display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: thinking ? ACC : '#10B981' }}/>
            <span style={{ fontSize: 11, color: thinking ? ACC : '#10B981', fontWeight: 600 }}>{thinking ? 'THINKING' : 'ACTIVE'}</span>
          </div>
        </div>
      </div>

      {/* Quick commands */}
      <div style={{ padding: '12px 24px', display: 'flex', gap: 10, borderBottom: '1px solid ' + BORDER, background: SURFACE, flexWrap: 'wrap' }}>
        {QUICK_CMDS.map(q => (
          <button key={q.label} onClick={() => send(q.cmd)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 20, background: 'transparent', border: '1px solid rgba(99,102,241,0.25)', cursor: 'pointer', color: '#94A3B8', fontSize: 12, fontFamily: FD, transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.12)'; (e.currentTarget as HTMLElement).style.color = TXT }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#94A3B8' }}
          >
            <q.icon size={13} color={q.color}/>{q.label}
            <ChevronRight size={12} color="#475569"/>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 8px' }}>
        {msgs.map(m => m.role === 'friday' ? <FridayMessage key={m.id} msg={m}/> : <UserMessage key={m.id} msg={m}/>)}
        {thinking && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#6366F1,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 16px rgba(99,102,241,0.4)' }}>
              <Bot size={16} color="#fff"/>
            </div>
            <div style={{ padding: '14px 18px', background: CARD, border: '1px solid ' + BORDER, borderRadius: 12, borderTopLeftRadius: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: ACC, opacity: 0.4 + 0.6 * Math.sin(pct + i * 1.5), transition: 'opacity 0.1s' }}/>)}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid ' + BORDER, background: SURFACE }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: CARD, border: '1px solid ' + BORDER, borderRadius: 12, padding: '6px 6px 6px 16px' }}>
          <input
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
            placeholder="Ask FRIDAY anything about the facility..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: TXT, fontSize: 14, fontFamily: FD }}
          />
          <button onClick={() => send(input)} disabled={!input.trim() || thinking} style={{ width: 38, height: 38, borderRadius: 9, background: input.trim() ? 'linear-gradient(135deg,#6366F1,#4F46E5)' : '#1E293B', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
            <Send size={16} color={input.trim() ? '#fff' : '#475569'}/>
          </button>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: '#334155', textAlign: 'center' }}>FRIDAY uses real case data + memory vault — responses are contextual</div>
      </div>
      <style>{`@keyframes blink { 0%,100%{opacity:1}50%{opacity:0} }`}</style>
    </div>
  )
}
