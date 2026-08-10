import { useDemoStore } from '../store/useDemoStore'
import { novaSpeak, initSpeechEngine } from './novaSpeech'

let demoTimer: ReturnType<typeof setTimeout> | null = null
let sensorInterval: ReturnType<typeof setInterval> | null = null

function wait(ms: number): Promise<void> {
  return new Promise(resolve => {
    demoTimer = setTimeout(resolve, ms)
  })
}

function jitterSensors() {
  const store = useDemoStore.getState()
  const phase = store.demoPhase

  store.sensors.forEach(sensor => {
    let jitter = (Math.random() - 0.5) * 2
    let newValue = sensor.value + jitter

    if (phase === 'detecting' || phase === 'analyzing' || phase === 'alerting') {
      if (sensor.zone === 'Bay 3') {
        if (sensor.type === 'H₂S') {
          newValue = sensor.value + Math.random() * 1.5
          newValue = Math.min(newValue, 18)
        }
        if (sensor.type === 'O₂') {
          newValue = sensor.value - Math.random() * 0.3
          newValue = Math.max(newValue, 17.5)
        }
      }
    }

    if (phase === 'resolving' || phase === 'resolved') {
      if (sensor.zone === 'Bay 3') {
        if (sensor.type === 'H₂S') {
          newValue = sensor.value - Math.random() * 2
          newValue = Math.max(newValue, 3.0)
        }
        if (sensor.type === 'O₂') {
          newValue = sensor.value + Math.random() * 0.2
          newValue = Math.min(newValue, 20.9)
        }
      }
    }

    newValue = Math.max(0, parseFloat(newValue.toFixed(1)))
    const status = newValue > sensor.threshold ? 'critical' : newValue > sensor.threshold * 0.7 ? 'warning' : 'normal'
    store.updateSensor(sensor.id, newValue, status)
  })
}

export async function runDemoSequence() {
  initSpeechEngine()
  const store = useDemoStore.getState

  sensorInterval = setInterval(jitterSensors, 2000)

  // === PHASE 1: Monitoring — Nova speaks intro ===
  await wait(1500)
  store().setDemoPhase('monitoring')
  store().setScene('plant-resting')

  await novaSpeak("I'm watching Bay 1 through Bay 5. Everything's steady. All sensor readings within normal parameters.")
  store().addEvent({ type: 'nova-action', message: 'Nova initialized — monitoring all 5 bays', risk: 'normal' })

  await wait(4000)

  // === PHASE 2: Detection — anomaly forms in Bay 3 ===
  store().setDemoPhase('detecting')
  store().addEvent({ type: 'sensor', message: 'H₂S concentration rising in Bay 3 — 8.2 ppm, exceeding baseline', zone: 'Bay 3', risk: 'elevated' })

  await wait(2000)

  // Camera push-in to Bay 3
  store().focusZone('Bay 3')
  store().setRiskScore(0.35)

  await novaSpeak("I'm seeing something in Bay 3. Gas concentration near compressor C-14 has risen. H₂S is at 8.2 parts per million and climbing.")
  store().addEvent({ type: 'sensor', message: 'Gas concentration alert — H₂S 8.2 ppm near compressor C-14', zone: 'Bay 3', risk: 'elevated' })

  await wait(2000)

  // === PHASE 3: Analysis — compound risk builds ===
  store().setDemoPhase('analyzing')
  store().setRiskScore(0.52)
  store().addEvent({ type: 'permit', message: 'Active hot-work permit PTW-0441 detected in Zone B3', zone: 'Bay 3', risk: 'high' })

  await novaSpeak("Cross-referencing now. There's an active hot-work permit, PTW-0441, in this same zone. And I found 3 historical incidents with similar patterns in our memory bank, with the closest match scoring 0.88 similarity.")
  store().addEvent({ type: 'nova-action', message: 'Qdrant retrieval — 3 historical matches, top similarity score 0.88', zone: 'Bay 3', risk: 'high' })

  await wait(1500)

  // Open evidence panel
  store().setEvidenceOpen(true)
  store().setRiskScore(0.72)

  await novaSpeak("Compound risk score is now 0.72. This is a HIGH tier alert. The combination of rising gas levels with an active hot-work permit in a zone with historical near-misses is concerning.")
  store().addEvent({ type: 'nova-action', message: 'Compound risk score computed: 0.72 → tier HIGH', zone: 'Bay 3', risk: 'high' })

  await wait(2000)

  // === PHASE 4: Alerting — propose action ===
  store().setDemoPhase('alerting')
  store().setRiskScore(0.78)

  await novaSpeak("I recommend suspending permit PTW-0441 and evacuating non-essential personnel from Bay 3 until gas levels stabilize. This requires your authorization.")
  store().addEvent({ type: 'nova-action', message: 'Nova recommends: Suspend permit PTW-0441, evacuate Bay 3', zone: 'Bay 3', risk: 'critical' })

  // === PHASE 5: Authorization ===
  store().setDemoPhase('authorizing')
  store().setAuthorizationPending(true, 'Suspend permit PTW-0441 and evacuate Bay 3')
  store().addEvent({ type: 'authorization', message: 'Authorization required — suspend PTW-0441 and initiate Bay 3 evacuation', risk: 'critical' })

  await new Promise<void>((resolve) => {
    const checkAuth = setInterval(() => {
      const s = useDemoStore.getState()
      if (!s.authorizationPending) {
        clearInterval(checkAuth)
        resolve()
      }
    }, 500)

    setTimeout(() => {
      const s = useDemoStore.getState()
      if (s.authorizationPending) {
        s.authorizeAction()
      }
    }, 12000)
  })

  // === PHASE 6: Resolution ===
  store().setDemoPhase('resolving')
  store().setRiskScore(0.45)

  await novaSpeak("Authorization confirmed. Suspending permit PTW-0441 now. Evacuation signal sent to Bay 3 personnel. I'll continue monitoring gas levels.")
  store().addEvent({ type: 'nova-action', message: 'Permit PTW-0441 suspended. Evacuation signal dispatched.', zone: 'Bay 3', risk: 'elevated' })

  store().setEvidenceOpen(false)

  await wait(4000)

  store().setRiskScore(0.22)
  store().addEvent({ type: 'sensor', message: 'H₂S levels declining — 4.1 ppm and falling', zone: 'Bay 3', risk: 'normal' })

  await novaSpeak("Gas levels are dropping. H₂S is back to 4.1 parts per million and falling. Returning to normal monitoring.")

  store().setDemoPhase('resolved')
  store().setRiskScore(0.12)
  store().resetView()

  store().addEvent({ type: 'nova-action', message: 'Case resolved — resuming standard monitoring across all bays', risk: 'normal' })

  await novaSpeak("All clear. I've logged this incident for future reference. Resuming standard monitoring across all five bays.")

  // =========================================================================
  // POST-DEMO RECORDED Q&A SEGMENT (2 Timed Presenter Questions & Answers)
  // =========================================================================
  await wait(3000)

  // QUESTION 1 SEGMENT
  store().addEvent({
    type: 'nova-action',
    message: 'RECORDING PROMPT: Ask Question 1 now: "Nova, how did you know to correlate the H2S gas reading with permit PTW-0441 instead of treating it as a sensor calibration drift?"',
    risk: 'normal'
  })

  // Give presenter 7 seconds to record asking Question 1
  await wait(7000)

  // Nova speaks Answer 1
  await novaSpeak(
    "I cross-referenced the live 2-second telemetry stream with active CMMS work orders and our Qdrant vector database. Three historical near-misses shared the exact spatial-temporal signature of H2S gas buildup coinciding with hot-work welding, giving us a 0.88 similarity match."
  )

  await wait(3000)

  // QUESTION 2 SEGMENT
  store().addEvent({
    type: 'nova-action',
    message: 'RECORDING PROMPT: Ask Question 2 now: "What would happen if the safety officer didn\'t respond to your authorization prompt within 30 seconds?"',
    risk: 'normal'
  })

  // Give presenter 8 seconds to record asking Question 2
  await wait(8000)

  // Nova speaks Answer 2
  await novaSpeak(
    "If human authorization is delayed past the critical 30-second safety window, Nova triggers automatic failsafe protocol FS-09: automatically isolating gas supply valves, issuing an audible local alarm, and escalating directly to the shift supervisor."
  )

  await wait(4000)
}

export function stopDemoSequence() {
  if (demoTimer) {
    clearTimeout(demoTimer)
    demoTimer = null
  }
  if (sensorInterval) {
    clearInterval(sensorInterval)
    sensorInterval = null
  }
}
