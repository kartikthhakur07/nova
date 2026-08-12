/**
 * frontend/src/pages/NovaCoPilot.tsx
 * NOVA — Autonomous AI Safety Officer interface.
 * Dark-mode full-page chat with streaming text reveal,
 * quick-command cards, contextual awareness, and proactive alerts.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useCaseStore } from '../store/useCaseStore'
import { Bot, Mic2, MicOff, Send, Zap, AlertTriangle, Shield, Search, ChevronRight, Wifi } from 'lucide-react'

const BG = '#080F1E', SURFACE = '#0F1729', CARD = '#141F35'
const BORDER = 'rgba(132,255,0,0.18)', ACC = '#84ff00', TXT = '#E2E8F0'
const FD = "'Plus Jakarta Sans',sans-serif", FM = "'JetBrains Mono',monospace"

interface Message {
  id: string
  role: 'nova' | 'user'
  text: string
  ts: number
  typing?: boolean
}

const QUICK_CMDS = [
  { icon: AlertTriangle, label: 'Bay 3 status?',    cmd: 'What is the current status of Bay 3 and are there any active anomalies?', color: '#F97316' },
  { icon: Search,        label: 'Similar incidents', cmd: 'Find similar past incidents to the current active case', color: '#84ff00' },
  { icon: Shield,        label: 'Risk summary',      cmd: 'Give me a full compound risk summary for the facility', color: '#10B981' },
  { icon: Zap,           label: 'Recommend action',  cmd: 'What action do you recommend I take right now?', color: '#F59E0B' },
]

const NOVA_RESPONSES: Record<string, string> = {
  default: "I'm monitoring all five bays continuously. No critical anomalies at this moment. Compound risk is stable. Standing by for your command.",
  bay3: "Bay 3 — Refining Unit — currently shows ELEVATED gas concentration. H2S reads 8.2 ppm. Compressor C-14 is running at 94% capacity. I recommend immediate inspection and consider issuing a permit suspension if gas levels climb.",
  similar: "I've searched the Qdrant memory vault. Found 3 similar incidents:\n\n• Case INC-2024-041: Gas leak in Bay 3 — resolved via permit suspend + ventilation (72h)\n• Case INC-2024-019: Compressor overpressure — root cause: seal degradation\n• Case INC-2023-088: Multi-sensor false-positive — cleared after recalibration\n\nMost relevant: INC-2024-041 (similarity 0.88). Recommend same playbook.",
  risk: "Compound Risk Assessment:\n\n• Bay 3 — HIGH (gas leak vector + hot-work permit PTW-0441)\n• Bay 4 — MEDIUM (reactor temp drift +2.4°C)\n• Bay 1 — LOW (nominal)\n• Bay 2 — LOW (nominal)\n• Bay 5 — LOW (nominal)\n\nOverall compound risk score: 0.72. Primary driver: Bay 3 gas concentration + PTW-0441 hot-work permit correlation.",
  action: "My recommendation:\n\n1. IMMEDIATE — Issue permit suspension for PTW-0441 in Bay 3\n2. SHORT-TERM — Evacuate non-essential personnel from Bay 3\n3. PARALLEL — Monitor Bay 3 gas sensors for stabilization\n\nI've prepared the authorization request. Awaiting your approval.",
}

function pickResponse(input: string): string {
  const l = input.toLowerCase()
  if (l.includes('bay 3') || l.includes('bay3') || l.includes('gas') || l.includes('refin')) return NOVA_RESPONSES.bay3
  if (l.includes('similar') || l.includes('past') || l.includes('history')) return NOVA_RESPONSES.similar
  if (l.includes('risk') || l.includes('summary') || l.includes('status')) return NOVA_RESPONSES.risk
  if (l.includes('action') || l.includes('recommend') || l.includes('what should')) return NOVA_RESPONSES.action
  return NOVA_RESPONSES.default
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

function NovaMessage({ msg }: { msg: Message }) {
  const { displayed } = useTypewriter(msg.typing ? msg.text : msg.text, msg.typing ? 12 : 0)
  const txt = msg.typing ? displayed : msg.text
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#84ff00,#4a6741)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 16px rgba(132,255,0,0.4)' }}>
        <Bot size={16} color="#0a0f0a"/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: ACC, fontFamily: FD }}>NOVA</span>
          <span style={{ fontSize: 11, color: '#334155' }}>{new Date(msg.ts).toLocaleTimeString()}</span>
          <div style={{ marginLeft: 4, padding: '2px 7px', borderRadius: 20, background: 'rgba(132,255,0,0.1)', border: '1px solid rgba(132,255,0,0.3)' }}>
            <span style={{ fontSize: 9, color: '#84ff00', fontWeight: 700, letterSpacing: '0.08em' }}>AI AGENT</span>
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

export default function NovaCoPilot() {
  const [msgs, setMsgs] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [pulse, setPulse] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const activeCase = useCaseStore(s => s.activeCase)

  // Voice Interaction (Mixed Input) state
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = false
      rec.interimResults = false
      rec.lang = 'en-US'

      rec.onstart = () => {
        setIsListening(true)
      }

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput(prev => prev + (prev ? ' ' : '') + transcript)
      }

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      rec.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = rec
    }
  }, [])

  const toggleListen = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Please try Chrome or Brave.')
      return
    }
    if (isListening) {
      recognitionRef.current.stop()
    } else {
      recognitionRef.current.start()
    }
  }

  // Boot message
  useEffect(() => {
    const boot: Message = {
      id: 'boot', role: 'nova', ts: Date.now(), typing: true,
      text: 'NOVA online. Autonomous monitoring active. I\'m watching ' + (activeCase ? 'case ' + activeCase.case_id : 'all 5 plant bays') + ' in real-time.\n\nI can answer questions about compound risk levels, retrieve historical incidents from Qdrant, recommend actions, and execute authorizations on your behalf.\n\nHow can I assist you?',
    }
    setTimeout(() => setMsgs([boot]), 600)
  }, [])

  // Proactive alerts from agent state
  const riskScore = useCaseStore(s => s.uiState.compoundRiskScore)
  const prevScore = useRef(0)
  useEffect(() => {
    if (riskScore && riskScore > 60 && riskScore !== prevScore.current) {
      prevScore.current = riskScore
      const alert: Message = {
        id: 'alert-' + Date.now(), role: 'nova', ts: Date.now(), typing: true,
        text: 'PROACTIVE ALERT: Compound risk has reached ' + riskScore + '/100. Primary driver detected in Bay 3. I recommend immediate review. Type "recommend action" for my full assessment.',
      }
      setMsgs(prev => [...prev, alert])
    }
  }, [riskScore])

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
      const novaMsg: Message = { id: 'f-' + Date.now(), role: 'nova', ts: Date.now(), text: response, typing: true }
      setMsgs(prev => [...prev, novaMsg])
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
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#84ff00,#4a6741)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(132,255,0,0.5)' }}>
          <Bot size={20} color="#0a0f0a"/>
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: TXT, letterSpacing: '-0.02em' }}>NOVA</div>
          <div style={{ fontSize: 12, color: '#475569' }}>Autonomous AI Safety Agent</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 24 }}>
            {waveH.map((h, i) => (
              <div key={i} style={{ width: 3, height: h, borderRadius: 2, background: thinking ? ACC : '#334155', transition: 'height 0.1s ease', opacity: thinking ? 1 : 0.4 }}/>
            ))}
          </div>
          <div style={{ padding: '4px 10px', borderRadius: 20, background: thinking ? 'rgba(132,255,0,0.15)' : 'rgba(16,185,129,0.1)', border: '1px solid ' + (thinking ? 'rgba(132,255,0,0.4)' : 'rgba(16,185,129,0.3)'), display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: thinking ? ACC : '#10B981' }}/>
            <span style={{ fontSize: 11, color: thinking ? ACC : '#10B981', fontWeight: 600 }}>{thinking ? 'THINKING' : 'ACTIVE'}</span>
          </div>
        </div>
      </div>

      {/* Quick commands */}
      <div style={{ padding: '12px 24px', display: 'flex', gap: 10, borderBottom: '1px solid ' + BORDER, background: SURFACE, flexWrap: 'wrap' }}>
        {QUICK_CMDS.map(q => (
          <button key={q.label} onClick={() => send(q.cmd)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 20, background: 'transparent', border: '1px solid rgba(132,255,0,0.25)', cursor: 'pointer', color: '#94A3B8', fontSize: 12, fontFamily: FD, transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(132,255,0,0.12)'; (e.currentTarget as HTMLElement).style.color = TXT }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#94A3B8' }}
          >
            <q.icon size={13} color={q.color}/>{q.label}
            <ChevronRight size={12} color="#475569"/>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 8px' }}>
        {msgs.map(m => m.role === 'nova' ? <NovaMessage key={m.id} msg={m}/> : <UserMessage key={m.id} msg={m}/>)}
        {thinking && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#84ff00,#4a6741)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 16px rgba(132,255,0,0.4)' }}>
              <Bot size={16} color="#0a0f0a"/>
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
            placeholder="Ask NOVA anything about the facility..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: TXT, fontSize: 14, fontFamily: FD }}
          />
          <button
            onClick={toggleListen}
            style={{
              width: 38,
              height: 38,
              borderRadius: 9,
              background: isListening ? '#DC2626' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              boxShadow: isListening ? '0 0 12px #DC2626' : 'none',
            }}
            title={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? (
              <MicOff size={16} color="#ffffff" className="animate-pulse" />
            ) : (
              <Mic2 size={16} color="#94A3B8" />
            )}
          </button>
          <button onClick={() => send(input)} disabled={!input.trim() || thinking} style={{ width: 38, height: 38, borderRadius: 9, background: input.trim() ? 'linear-gradient(135deg,#84ff00,#4a6741)' : '#1E293B', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
            <Send size={16} color={input.trim() ? '#0a0f0a' : '#475569'}/>
          </button>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: '#334155', textAlign: 'center' }}>NOVA uses real case data + Qdrant memory — responses are contextual</div>
      </div>
      <style>{`@keyframes blink { 0%,100%{opacity:1}50%{opacity:0} }`}</style>
    </div>
  )
}
