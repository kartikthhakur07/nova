# VIGIL — Compound-Risk Voice Intelligence for Industrial Safety
### Master Product & Technical Architecture Document
### StarForge 2026 · Track 1 (VoxForge) · v2.0 (Final, Consolidated)

> This is the single source of truth for VIGIL: product thesis, UX, sponsor-technology integration, agent architecture, complete system design (frontend, backend, and every layer between), data schemas, technology stack, build plan, evaluation methodology, and submission assets. It supersedes all prior separate documents (product design v1, technical implementation spec v1, frontend addendum v1.1, system architecture v1.2), which are merged here without contradiction. Written to be readable end-to-end by a human reviewer, a hackathon judge, or an AI coding agent picking up implementation.

---

## Table of Contents

1. Product Thesis
2. Product Experience & Hero Scenario
3. Features (Scoped)
4. USP / Moat
5. Sponsor Integration — Rime
6. Sponsor Integration — Qdrant
7. Sponsor Integration — Weya (Disclosure)
8. Agent Architecture
9. Risk & Safety Architecture
10. Complete System Architecture (Frontend + Backend + All Layers)
11. Data Architecture & Schemas
12. Final Technology Stack
13. Implementation / Build Plan
14. Evaluation & Proof
15. Winning Demo Script
16. Track Compliance Matrix
17. Repository Structure
18. Submission Assets & Limitations
19. Judge-Perspective Self-Critique

---

## 1. Product Thesis

**Product name:** VIGIL — *"The voice that notices what no single sensor can."*

**One-line pitch:** VIGIL is a voice-native safety officer's second brain that fuses gas sensors, permits, maintenance logs, shift data, and CCTV events into a single compound-risk picture, talks the officer through it hands-free in the field, and turns every resolved incident into memory that makes the next warning faster.

**The exact painful problem:** Visakhapatnam (Jan 2025, 8 dead) did not fail because sensors were silent — functioning gas detectors, permit-to-work controls, and SCADA all existed. Investigation found warning signals present but unacted upon because no intelligence layer connected them to a decision in time. DGFASLI recorded 6,500+ fatal workplace accidents in FY2023; a 2024 FICCI survey found over 60% of large industrial facilities rely on manual handoffs between their own digital safety tools. The pattern repeats nationally: **data present, but unacted upon — because no unified layer fuses sensors, permits, maintenance, and shift data into a real-time risk picture, and acts on it before a fatality, not after.**

**Why existing systems fail:**
- Dashboards report per-metric state; they don't reason about *combinations* across time. A safety officer on a live plant floor, in PPE, cannot safely read a dashboard.
- Alarms are single-sensor, single-threshold. A gas reading 8% above baseline, during a permitted hot-work job, during a shift changeover, is three individually sub-threshold facts that are jointly critical — no SCADA rule catches that.
- RAG chatbots retrieve on request; they don't hold an incident open across interruptions, verify a hypothesis against live sensor state, or execute an authorized action.
- Manual handoffs mean the 5–15 minute window between "signals start converging" and "someone notices" is precisely the fatal window.

**Why this solution is different:** VIGIL is not a chatbot bolted onto a dashboard. It runs a standing agentic loop — **Detect → Contextualize → Retrieve organizational memory → Reason about compound risk → Explain → Recommend → Act/Escalate (human-authorized) → Verify → Learn** — and the only channel through which it can proactively reach a field worker in gloves, noise, and motion is voice.

**Who uses it, and when:**
- **Safety officer / field supervisor** — VIGIL proactively calls when risk crosses threshold; hands-free query support otherwise.
- **Plant/shift manager** — receives escalation calls requiring human authorization for high-impact workflows.
- **Maintenance engineer** — voice-queries equipment history before starting work, hands-free.
- **Incident commander** — uses VIGIL as a live briefing voice that survives interruption during an active event.

**The core "aha" moment:** VIGIL proactively *calls* the safety officer — unprompted — because it correlated a maintenance job, an active permit, a gas trend, and a historical near-miss into a compound risk no single system flagged. It explains its reasoning in one breath, asks for a single-word authorization, and when the officer interrupts mid-sentence ("wait, which valve?"), VIGIL doesn't restart — it answers the interruption and resumes. This is what separates a second, tireless safety officer from a UI with a microphone.

---

## 2. Product Experience & Hero Scenario

**Before an incident:** VIGIL runs a continuous background correlation loop over the event stream, maintaining a live per-zone risk state. It is silent by default — a system that talks constantly gets muted, so every interruption must be earned.

**When weak signals converge:** Each source is individually sub-threshold. The Risk Reasoner correlates them across a rolling window and against Qdrant-retrieved historical incidents; when the compound score crosses a calibrated threshold, VIGIL escalates from silent monitoring to a proactive voice call.

**What the AI notices that humans/single sensors miss:** the *combination and sequence* — "8% above baseline for the third time this shift, always 40 minutes after this pump's maintenance window" — not any single reading; and that a near-identical combination preceded a documented near-miss in a different unit, a correlation no dashboard filter expresses.

**Interaction model:** short, evidence-first spoken turns (state → evidence → ask), never open-ended questions when action is required, full barge-in support with a stateful interruption stack, closed-form authorization prompts, a tiered escalation ladder (notify → call → auto-escalate on timeout), typed and audited tool execution on authorization, persistent incident memory across callbacks, and a mandatory one-line voice debrief on resolution that becomes a permanent, retrievable organizational lesson.

### Hero scenario (≈2 minutes, live-demoable)

| Time | Beat |
|---|---|
| 0:00 | Plant risk overview, all zones green. |
| 0:10 | Gas sensor +8% (sub-alarm), hot-work permit activates in the same bay, adjacent compressor flagged for drift 2h earlier, shift changeover in 20 min. |
| 0:25 | Compound score crosses threshold; Qdrant similarity search surfaces a 14-month-old near-miss with matching equipment class, permit type, and gas-trend shape. |
| 0:35 | VIGIL proactively calls the officer; evidence-first sentence + historical citation. |
| 0:50 | Officer interrupts: *"Wait — which permit?"* VIGIL answers directly, then resumes: *"Suspend that permit — yes or no?"* |
| 1:05 | Officer authorizes; tool executes; full evidence-to-action audit entry logged. |
| 1:20 | Callback scheduled; compressor serviced; gas trend normalizes. |
| 1:35 | Callback confirms resolution; one-line spoken debrief captured. |
| 1:50 | New lesson-learned record appears in Qdrant, on screen. |
| 1:58 | A later, similar-signature scenario in a different bay is detected *faster*, visibly citing the just-created lesson — proof the system learned, live. |

---

## 3. Features (Scoped)

**Must-have (build first, non-negotiable):** simulated multi-source event bus; deterministic + LLM compound-risk correlation; Qdrant-backed historical retrieval that visibly changes system output; Rime-driven proactive voice with barge-in; confirmation-gated real tool execution; full evidence-to-action audit trail; resolved-incident → Qdrant write-back demonstrated live.

**Sponsor-specific:** Rime streaming with sub-second time-to-first-audio, mid-utterance cancel, pronunciation handling for equipment IDs/units; Qdrant hybrid semantic+lexical search with payload filtering across 8 collections; Weya-*inspired* (not claimed as integrated unless API access is confirmed on-site) callback scheduling, escalation ladder, and human-handoff design.

**Differentiating:** interruption-safe conversation-state stack; evidence-first explanation style (never a bare confidence score); explainable compound-risk arithmetic; second-incident callback proving measurable memory improvement live.

**Stretch (cut first):** multilingual voice, geospatial heatmap, multi-agent permit-conflict negotiation, live computer-vision CCTV events (vs. pre-scripted labels).

**Explicitly excluded:** general-purpose chatbot mode, digital twin visualization, open "ask anything" surface — none required by the brief, all dilute the core loop.

---

## 4. USP / Moat

| USP | Why a generic RAG chatbot or dashboard can't replicate it |
|---|---|
| Compound-risk reasoning across live + historical data | A standing correlation loop that *initiates* contact, vs. a chatbot that answers on request. |
| Temporal/contextual correlation | Risk is defined by combination and sequence, requiring a stateful rolling-window reasoning loop, not a single retrieval call. |
| Historical near-miss retrieval that changes the decision | Qdrant's similarity score is a direct input to the risk-tier arithmetic, not a citation fetched after the fact. |
| Organizational safety memory that compounds | Every resolved incident writes back into the exact collection queried on the next detection — provably faster/more specific across the demo itself. |
| Voice-first, interruption-safe field interaction | The interruption-safe state stack is a genuine engineering problem; losing state on barge-in is the most common voice-agent failure mode, and VIGIL is architected specifically to solve it. |

---

## 5. Sponsor Integration — Rime

**Where it sits:** the only output channel through which VIGIL initiates contact and delivers reasoning — receiving short streamed text segments from the agent layer and returning streamed audio to the officer's device or the demo browser.

**Why voice is necessary:** the user is in PPE, often gloved, near hazardous equipment, and cannot safely read a screen — and the system must be able to *initiate* an interruption, which a UI notification cannot reliably do on a factory floor.

**Streaming/latency strategy:** text streams to Rime sentence-by-sentence rather than waiting for full generation; time-to-first-audio-byte and full round-trip latency are measured and displayed live.

**Short-turn design:** every utterance follows state → evidence → ask, capped at ~2 short sentences per turn.

**Barge-in:** client-side speech-energy detection during playback immediately cancels the in-flight audio stream; cancellation latency is logged.

**Interruption state:** the current utterance is pushed onto a conversation-state stack as "interrupted — resume point noted"; the interrupting utterance is transcribed and routed to intent handling; VIGIL then resumes (restating only the essential clause) or, if the interruption changed the situation, collapses the stack and proceeds directly.

**Pronunciation:** equipment IDs, permit codes, and units are normalized before synthesis (digit-by-digit IDs, expanded units — "two hundred four ppm," not "204ppm").

**Model choice:** Mist v3 for the latency-critical live-call path; Coda reserved for non-time-critical debrief narration if used at all — confirmed against current Rime docs at build time rather than assumed.

**Visible demonstration to judges:** a live latency HUD showing event-detected → first-audio-byte → interruption-detected → resumed timestamps.

**Latency measurement:** all five timestamps logged per call and fed into the evaluation benchmark (§14).

---

## 6. Sponsor Integration — Qdrant

Qdrant is the system's memory, not a citation lookup. Eight logical collections:

| Collection | Contents | Key payload fields |
|---|---|---|
| `incidents_historical` | Past incidents | equipment_id, zone, date, severity, contributing_factors |
| `near_misses` | Near-miss reports | equipment_id, zone, permit_type, resolved |
| `maintenance_history` | Maintenance logs | equipment_id, date, fault_type |
| `safety_procedures` | OISD/DGMS/Factory Act excerpts | regulation_id, topic |
| `equipment_context` | Static equipment metadata | equipment_id, class, criticality |
| `risk_patterns` | Confirmed compound-risk signatures | pattern_type, zone, equipment_class |
| `lessons_learned` | Post-resolution debriefs + evidence trail | incident_id, verified, contributing_factors |
| `active_case_memory` | Live/open incident state, short-TTL | session_id, status |

**Hybrid retrieval:** dense semantic search (`bge-small-en-v1.5`, cosine) combined with exact-match/lexical filtering on equipment IDs, permit codes, and regulation numbers — IDs are never fuzzy-matched.

**Payload filtering:** every query is pre-scoped by zone and/or equipment class before ranking, preventing cross-unit noise.

**Reranking:** a cross-encoder (`bge-reranker-base`) is applied only to the top-k historical-incident candidates before they're spoken aloud — justified because a wrong spoken citation has zero tolerance for error; skipped elsewhere to keep latency low.

**Write-back:** on resolution, the full evidence trail + operator debrief is embedded and upserted into `lessons_learned`, and into `risk_patterns` if confirmed as a true compound-risk signature. The very next similarity query can retrieve it — demonstrated live via the hero scenario's second incident.

**Correction, not deletion:** records carry `verified` and `superseded_by`; false-positive dismissals write a correction record, preserving the audit trail; unverified matches are filtered from default retrieval.

**Why it's not decorative:** the compound-risk score's `historical_boost` term is a direct function of the top retrieved similarity score and its severity — remove Qdrant and the system loses its only source of "has this exact combination mattered before." The Retrieval Trace page (§10.1) makes this causal link visible to judges before VIGIL ever speaks the citation.

---

## 7. Sponsor Integration — Weya (Disclosure)

Per the Track 1 document, Weya is listed only as a **reference/learning resource**, not a mandatory or provided sponsor API. We treat this with explicit honesty rather than fabricating integration:

- **Not claimed as a live integration** unless API access is explicitly granted at the event (verified on-site).
- **Weya-inspired, independently implemented:** human handoff / escalation ladder (attempt → timeout → escalate to next tier → deterministic fallback), callback scheduling for open incidents, and an analytics/audit call log — all modeled on documented production voice-agent patterns but built as VIGIL's own policy engine (§9), not a Weya API call.
- **Presentation to judges:** a dedicated, visible section (not buried) explicitly separates "actual sponsor integrations (Rime, Qdrant)" from "Weya-inspired architecture (independently built)" — this transparency is itself a credibility signal, since fabricated sponsor claims are both disallowed and easily caught by a Weya-literate judge.

---

## 8. Agent Architecture

Five agents — the minimum useful set, each included only because a single LLM call cannot own its responsibility safely.

| Agent | Responsibility | Input | Output | Reads / Tools | Why an agent |
|---|---|---|---|---|---|
| **Sensor/Event Intelligence** | Normalize raw telemetry; deterministic threshold pre-filter | Raw simulated event stream | `NormalizedEvent` | rolling window buffer | Continuous, stateful stream processing independent of reasoning cadence |
| **Operational Context** | Assemble the current situational picture (permits, shift, maintenance, equipment) | Normalized events | `OperationalContext` | Qdrant (`equipment_context`, `maintenance_history`), SQLite (`permits`, `shifts`) | Multi-source structured/semantic joins a single prompt can't reliably do |
| **Risk Reasoner** | Compound-risk score, tier, evidence, historical citations | Context object | `RiskAssessment` | Qdrant (`incidents_historical`, `near_misses`, `risk_patterns`), LLM, reranker | Central reasoning step combining deterministic rules with LLM judgment, must be explainable |
| **Response Orchestrator** | Enforce policy, request authorization, execute tools, escalate | Risk assessment + human responses | Tool calls, audit entries | Policy engine, tool registry, SQLite | Dangerous actions require a separate, auditable, policy-bound component — never the reasoning process itself |
| **Voice Interaction** | Live conversation: turn generation, Rime streaming, barge-in, interruption stack | Orchestrator messages + officer speech | Spoken turns; transcribed intent back to Orchestrator | Rime, ASR, `conversation_state_stack` | Latency-critical turn-taking is a distinct concern that must not block or be blocked by reasoning |

Deliberately **not** separate agents in the MVP: geospatial, compliance-audit, and CCTV-vision are treated as additional event sources / Qdrant collections feeding Sensor/Event Intelligence, not new reasoning agents — avoiding unnecessary orchestration overhead. Permit Intelligence may be split from Operational Context as a sixth agent if time allows; recommended to keep merged.

**Concurrency design decision:** Voice Interaction is a *concurrent*, not sequential, consumer of case state — it begins a lightweight acknowledgment utterance the instant a case crosses threshold, running in parallel with Risk Reasoner finishing the full evidence sentence. Without this, the pipeline's natural sequencing costs 2–4s of dead air before the first word, which reads as broken in a live proactive call. This is the one technical amendment made to the original design and is reflected throughout §10.

---

## 9. Risk & Safety Architecture

- **Deterministic vs. LLM reasoning:** hard SCADA thresholds are deterministic and always fire regardless of the AI layer; the LLM layer only handles compound, sub-threshold cases and never overrides a deterministic critical alarm.
- **Confidence thresholds:** compound score maps to four tiers via a fixed, versioned threshold table (`thresholds.yaml`), calibrated against the evaluation benchmark — not tuned live.
- **Human approval:** any action beyond "log and notify" requires explicit human yes/no authorization, timestamped and stored in the immutable audit trail. The LLM proposes; it never executes.
- **Tier handling:** low = log only; medium = voice notify, no action requested; high = voice call + explicit authorization required; critical = voice call, auto-escalate to shift manager on timeout, then deterministic fallback (alarm broadcast) if still unacknowledged — the system never silently waits.
- **Audit trail:** an immutable, timestamped chain — evidence → context → historical matches with scores → risk tier → utterance spoken → human response → action executed → resolution/debrief → memory write.
- **Hallucination prevention:** the Risk Reasoner is constrained and post-validated to cite only facts traceable to the input context object and retrieved records; any ungrounded claim is dropped before being spoken.
- **Stale knowledge handling:** records carry `verified` and effective-date metadata; retrieval deprioritizes superseded entries; recency is stated explicitly when cited ("a similar case from 14 months ago").
- **Fail-safe behavior:** any failure in Qdrant, Rime, or the LLM degrades to the deterministic SCADA alarm path and a plain notification — voice/AI enhancement is never a single point of failure for basic alerting.
- **Explainability:** every spoken risk statement is generated from, and displayable as, a structured evidence list — auditable by a human without trusting an opaque score.
- **Structural enforcement, not just prompting:** the tool registry itself rejects any `ToolCall` where `authorized != True` — the "LLM is never sole authority" constraint is enforced in code, not only in the system prompt.

---

## 10. Complete System Architecture (Frontend + Backend + All Layers)

### 10.0 Layer map

| # | Layer | Contents | Talks to |
|---|---|---|---|
| 1 | Presentation | 7 pages, ~26 components, design tokens | Client state |
| 2 | Client state | Zustand `useCaseStore`, `currentStage` | Realtime transport |
| 3 | Realtime transport | One WebSocket/session, typed envelope | API gateway |
| 4 | API gateway | FastAPI REST + WS | Agent layer |
| 5 | Agent / orchestration | 5 agents (§8) | Policy, data, external services |
| 6 | Policy / safety | Thresholds, authorization gate, escalation, tool registry | Agent layer, audit store |
| 7 | Data / memory | Qdrant (8 collections), SQLite (6 tables), embeddings, reranker | Agent layer |
| 8 | External services | Rime, LLM, ASR | Agent layer |
| 9 | Infra / deployment | Vercel/Netlify, Render/Fly, Qdrant Cloud free tier | All |

### 10.1 Frontend — presentation layer (pages)

```
/                              Risk Overview (home)
/case/:id/signals              Converging Signals / Live Case View
/case/:id/retrieval            Qdrant Retrieval Trace
/case/:id/voice                Live Conversation / Voice Interaction
/case/:id/confirm              Confirmation / Authorization
/case/:id/audit                Audit Trail / Case Timeline
/case/:id/memory               Lessons Learned / Memory Write-back
/memory                        Global Memory Browser (linked from page 7)
/benchmark                     Evaluation Results
/demo                          Scenario Control Panel (⌘K, presenter-only)
```

Pages 2–7 share a persistent `CaseStepperNav` (`<Outlet />` layout) that auto-highlights the server-driven current pipeline stage — a judge can watch the tabs advance unattended, or navigate manually; disabled tabs are dimmed, not hidden, so the nav bar itself communicates what hasn't happened yet.

**Design language:** an industrial-console aesthetic, not a SaaS dashboard — dark steel base (`#0A0D10`/`#12171C`), Space Grotesk (display), IBM Plex Sans (body), IBM Plex Mono (all data/IDs/timestamps — a deliberate signal: "measured data, not prose"). Tier colors (`safe` green, `watch`/`high` amber tones, `critical` red) are kept visually distinct from `voice-active` teal so risk state and voice state never collide. One signature element carries the motion budget: the **Risk Pulse Ring** — idle breathing ring → evidence arcs assembling (one per contributing fact, colored by source) → live audio waveform when VIGIL speaks. Everything else is static or a quiet micro-interaction.

### 10.2 Frontend — component layer

| Page | Components |
|---|---|
| Risk Overview | `PlantMap`, `ZoneCard`, `SignalTicker`, `SystemStatusBar`, `GlobalRiskPulse` |
| Converging Signals | `RiskPulseRing`, `EvidencePanel`, `CaseTimeline` (compact), `CompoundScoreReadout` |
| Retrieval Trace | `RetrievalTrace`, `RetrievalPipelineStrip` (live candidate counts through embed → hybrid search → rerank → grounding filter) |
| Voice Interaction | `Waveform` (real amplitude via `AnalyserNode` or server-computed RMS), `LiveTranscript`, `LatencyHUD`, `InterruptionIndicator`, `TalkButton` (mic fallback) |
| Confirmation | `AuthorizationPrompt` (full-screen when pending), `ActionPreview`, `EvidenceRecap` |
| Audit Trail | `CaseTimeline` (full/interactive), `AuditLogTable`, `ExportAuditButton` |
| Lessons Learned | `DebriefCapture`, `LessonJustCreatedBanner`, `RelatedMemoryLink`, `GlobalMemoryBrowserLink` |
| Global Memory Browser | `CollectionTabs`, `RecordGrid` |
| Benchmark | `MetricCard` |
| Demo Control | `ScenarioList`, `ScenarioPlayer` |
| Shared | `CaseStepperNav` |

### 10.3 Frontend — client state & realtime layers

- **State:** `useCaseStore` (Zustand) holds `activeCase`, `evidenceList`, `retrievalMatches`, `conversationStateStack`, `latencyMarks`, `connectionStatus`, `currentStage`. **Server-authoritative principle:** the frontend never computes tier, authorization eligibility, or pipeline stage locally — it renders what the backend emits.
- **Transport:** one WebSocket per session (`/ws/session/:sessionId`), typed envelope: `event.normalized | risk.updated | case.state_changed | transcript.delta | audio.level | audit.entry | authorization.requested | interruption.detected | connection.status`. Auto-reconnect with exponential backoff (max 5 attempts); reconnect just re-syncs since the server owns state — nothing is lost on drop.
- **Interaction fallbacks:** every voice action has a mouse/keyboard equivalent (`AuthorizationPrompt` Yes/No buttons, `TalkButton` press-and-hold) so ASR or room-acoustics failure never blocks the live demo.

### 10.4 Backend — API gateway layer

Single FastAPI process. REST:
```
GET  /api/zones
GET  /api/cases/:id
GET  /api/cases/:id/audit
POST /api/cases/:id/authorize        { decision: "yes" | "no" }
GET  /api/memory/collections/:name
GET  /api/benchmark/results
POST /api/demo/scenarios/:id/play
POST /api/demo/scenarios/:id/reset
```
WebSocket: `/ws/session/:sessionId` — fan-out of all internal bus events, typed per §10.3.

### 10.5 Backend — agent / orchestration layer

Five agents (full spec in §8), each a set of async tasks inside the one FastAPI process — not separate containers or microservices. Internal event bus: in-process `asyncio.Queue` fan-out:
```
raw.telemetry → normalized.events → context.assembled → risk.assessed
→ policy.decision → voice conversation events / tool.executed → memory.write_back
```
**Concurrency:** Voice Interaction consumes `policy.decision` concurrently with Risk Reasoner still finalizing evidence text, per the design decision in §8 — this is the one structural amendment to the original design and it only affects sequencing, not the agent set or responsibilities.

### 10.6 Backend — policy / safety layer

- `thresholds.yaml`: `low < 0.35 ≤ medium < 0.6 ≤ high < 0.8 ≤ critical`.
- `policy.py`: deterministic tier → authorization level → escalation timeout mapping.
- **Case state machine** (server-authoritative, drives frontend `currentStage`):
```
DETECTED → INVESTIGATING → NOTIFYING → AWAITING_RESPONSE
  → ACTING → MONITORING → RESOLVING → RESOLVED → ARCHIVED
AWAITING_RESPONSE → ESCALATING → ACTING | FALLBACK_TRIGGERED   (on timeout)
[any state] → interruption pushes conversation_state_stack, state unchanged
```
- **Tool registry**: whitelisted, Pydantic-validated `ToolCall` → `ToolResult`. Tools: `permit_suspend`, `evacuation_broadcast`, `incident_log_create`, `callback_schedule`. Execution is structurally blocked unless `authorized=True`, set only by a recorded human decision.

### 10.7 Backend — data / memory layer

**Qdrant** (8 collections, §6) — vector size 384 (`bge-small-en-v1.5`), cosine distance, hybrid dense+lexical search with pre-filtering by zone/equipment class.

**Retrieval pipeline:**
```
context → query text → embed (bge-small-en-v1.5) → hybrid search (top_k=10)
→ cross-encoder rerank (bge-reranker-base) → top 3 → LLM grounding/citation filter
→ evidence-and-citation object (shared by Risk Reasoner scoring AND Voice Interaction speech)
```
Sharing one pipeline output between scoring and speech guarantees the spoken citation and the score-affecting citation are always the same fact.

**SQLite** — `cases`, `audit_log`, `permits`, `maintenance_records`, `shifts`, `equipment` (full DDL in §11.4). File-based; sufficient for hackathon concurrency.

**Three memory horizons** (deliberately separated): working memory (`conversation_state_stack`, session-lifetime only) → case memory (`active_case_memory` + SQLite `cases`/`audit_log`, archived not deleted) → organizational memory (`lessons_learned`/`risk_patterns`, written once per resolved case, the only horizon that influences future *unrelated* cases).

### 10.8 Backend — external services layer

| Service | Role | Fallback |
|---|---|---|
| Rime | Voice synthesis (Mist v3 live path, Coda for debrief narration) | Browser `SpeechSynthesis`, visible banner |
| LLM (hosted API or Ollama) | Evidence phrasing, citation grounding, tool-call proposal | Hosted → local Ollama → deterministic-only scoring |
| ASR (`faster-whisper`, local) | Speech → text | Text-input fallback (`AuthorizationPrompt`/`TalkButton`) |

### 10.9 Infra / deployment layer

Frontend: Vite build → Vercel/Netlify free tier. Backend: single Python process → Render/Fly free tier, one warm instance during demo. Qdrant: local binary for dev, Qdrant Cloud free tier for the deployed demo. No Docker/Kubernetes. Secrets via `.env` (gitignored) + `.env.example` committed. Logging: structured JSON to stdout; judge-facing observability is the in-app `SystemStatusBar` and `/benchmark` page, not an external tracing tool.

### 10.10 End-to-end request flow (every layer, in order)

1. `data_simulator` publishes a `NormalizedEvent` onto `raw.telemetry` (production: a real MQTT/OPC-UA bridge would publish the same schema).
2. Sensor/Event Intelligence filters/normalizes → `normalized.events`.
3. Operational Context assembles the situational picture from SQLite + Qdrant → `context.assembled`.
4. Risk Reasoner runs the retrieval pipeline (§10.7) and computes the compound score (deterministic weighted sum + capped `historical_boost`) → `risk.assessed`.
5. Policy engine applies the fixed threshold table → tier + required authorization level → `policy.decision`.
6. If tier ≥ medium: Voice Interaction begins speaking, concurrently with any remaining reasoning, via Rime; ASR listens for barge-in.
7. If tier ≥ high: Response Orchestrator prepares a `ToolCall`; nothing executes until a human authorizes (voice or click fallback).
8. On authorization, the tool registry executes, writes an audit entry, case moves to `MONITORING`.
9. On resolution, a one-line voice debrief is captured, embedded, written to `lessons_learned` — shown live via `LessonJustCreatedBanner`.
10. The next Risk Reasoner run for any case can retrieve that new record, closing the loop back to step 4.

Every step is pushed to the frontend in real time over the single WebSocket — which is why the seven-page journey can show each pipeline stage as it happens rather than reconstructing it after the fact.

### 10.11 Failure paths (all layers)

| Layer | Failure | Behavior |
|---|---|---|
| External services | LLM unavailable | Fall back to local Ollama, then deterministic-only scoring |
| External services | Qdrant unreachable | `historical_boost` = 0; UI states "retrieval unavailable" explicitly |
| External services | Rime unavailable | Browser `SpeechSynthesis` fallback, visible banner |
| External services | ASR unavailable | Text-input fallback remains fully functional |
| Realtime transport | WebSocket drop | Auto-reconnect with backoff; server-authoritative state means reconnect just re-syncs |
| Policy/safety | Critical case unacknowledged | Auto-escalate to shift manager, then deterministic alarm fallback — never silently waits |

### 10.12 Simulated vs. production infrastructure

| Simulated (this build) | Production equivalent |
|---|---|
| `data_simulator` JSON event generator | MQTT/OPC-UA sensor bridge, SCADA historian feed |
| Synthetic permit/shift/maintenance records | Digital permit-to-work system, HRMS, CMMS integrations |
| Pre-scripted CCTV-derived event labels | Real computer-vision pipeline on live CCTV |
| SQLite | Postgres |
| In-process asyncio bus | Kafka/NATS message broker |
| Single FastAPI process | Properly separated services behind the broker, horizontally scaled |
| Qdrant local/free-tier | Qdrant Cloud production tier |
| Stdout logging | OpenTelemetry / managed observability |

---

## 11. Data Architecture & Schemas

### 11.1 Normalized event schema

```python
class NormalizedEvent(BaseModel):
    event_id: str
    source: Literal["gas_sensor", "scada", "permit", "maintenance", "shift", "cctv"]
    zone_id: str
    equipment_id: str | None
    ts: datetime
    value: float | None
    unit: str | None
    metadata: dict[str, Any] = {}
    severity_hint: Literal["normal", "elevated", "critical"] = "normal"
```

### 11.2 Context, risk, and evidence schemas

```python
class OperationalContext(BaseModel):
    zone_id: str
    ts: datetime
    active_permits: list[PermitRecord]
    recent_maintenance: list[MaintenanceRecord]
    shift_state: ShiftState
    equipment: list[EquipmentContext]
    recent_events: list[NormalizedEvent]

class PermitRecord(BaseModel):
    permit_id: str; permit_type: str; zone_id: str; holder: str
    status: Literal["active", "suspended", "closed"]
    window_start: datetime; window_end: datetime

class MaintenanceRecord(BaseModel):
    record_id: str; equipment_id: str; fault_code: str | None
    logged_at: datetime; summary: str

class ShiftState(BaseModel):
    current_shift: str; changeover_at: datetime | None

class EquipmentContext(BaseModel):
    equipment_id: str; equipment_class: str
    criticality: Literal["low", "medium", "high"]; zone_id: str

class EvidenceItem(BaseModel):
    source: str; fact: str; raw_value: Any; ts: datetime; weight: float

class HistoricalMatch(BaseModel):
    record_id: str; collection: str; similarity_score: float
    rerank_score: float | None; title: str; date: datetime
    matched_on: list[str]

class RiskAssessment(BaseModel):
    case_id: str; zone_id: str; compound_score: float
    tier: Literal["low", "medium", "high", "critical"]
    evidence: list[EvidenceItem]; historical_matches: list[HistoricalMatch]
    generated_at: datetime
```

### 11.3 Qdrant payload schemas

```python
class IncidentPayload(TypedDict):
    equipment_id: str; equipment_class: str; zone_id: str; date: str
    severity: Literal["near_miss", "minor", "major", "fatal"]
    contributing_factors: list[str]; verified: bool
    superseded_by: str | None; text_summary: str

class LessonLearnedPayload(TypedDict):
    incident_id: str; equipment_id: str; zone_id: str; verified: bool
    contributing_factors: list[str]; debrief_text: str; created_at: str

class ActiveCaseMemoryPayload(TypedDict):
    session_id: str; case_id: str; status: str; ttl_expires_at: str
```
(`MaintenanceHistoryPayload`, `SafetyProcedurePayload`, `EquipmentContextPayload` follow the same pattern: identifying fields + `text_summary` as the embedded field.)

Vector config per collection: `size=384`, `distance=Cosine`; hybrid search combines the dense vector with an exact-match pre-filter on `equipment_id`/`zone_id`.

### 11.4 SQLite DDL

```sql
CREATE TABLE cases (
  case_id TEXT PRIMARY KEY, zone_id TEXT NOT NULL, state TEXT NOT NULL,
  tier TEXT, compound_score REAL, created_at TEXT, resolved_at TEXT
);
CREATE TABLE audit_log (
  entry_id TEXT PRIMARY KEY, case_id TEXT REFERENCES cases(case_id),
  step TEXT NOT NULL, payload_json TEXT NOT NULL, ts TEXT NOT NULL
);
CREATE TABLE permits (
  permit_id TEXT PRIMARY KEY, permit_type TEXT, zone_id TEXT,
  holder TEXT, status TEXT, window_start TEXT, window_end TEXT
);
CREATE TABLE maintenance_records (
  record_id TEXT PRIMARY KEY, equipment_id TEXT, fault_code TEXT,
  logged_at TEXT, summary TEXT
);
CREATE TABLE shifts (
  shift_id TEXT PRIMARY KEY, zone_id TEXT, starts_at TEXT, ends_at TEXT
);
CREATE TABLE equipment (
  equipment_id TEXT PRIMARY KEY, equipment_class TEXT,
  criticality TEXT, zone_id TEXT
);
```

### 11.5 WebSocket envelope

```json
{ "type": "risk.updated",
  "payload": { "case_id": "c_8f21", "compound_score": 0.72, "tier": "high",
    "evidence": [
      {"source":"gas_sensor","fact":"Gas +8% above baseline, Bay 3","weight":0.3},
      {"source":"permit","fact":"Hot-work permit P-2291 active in Bay 3","weight":0.25},
      {"source":"maintenance","fact":"Compressor C-14 flagged for drift 2h ago","weight":0.25},
      {"source":"shift","fact":"Shift changeover in 20 min","weight":0.2}
    ] },
  "ts": "2026-08-09T14:32:07.123Z" }
```

### 11.6 Tool schema

```python
class ToolCall(BaseModel):
    tool_name: Literal["permit_suspend", "evacuation_broadcast",
                        "incident_log_create", "callback_schedule"]
    parameters: dict; case_id: str
    requested_by: Literal["risk_reasoner"]
    authorized: bool = False
    authorized_by: str | None = None
    authorized_at: datetime | None = None
```

---

## 12. Final Technology Stack

All choices target **₹0 / $0** to build and demo.

| Layer | Exact choice | Zero-cost path |
|---|---|---|
| Frontend framework | React 18 + Vite + TypeScript | Fully local/free |
| Styling | Tailwind CSS + hand-written design tokens (§10.1) | Free |
| State | Zustand | Free, MIT |
| Realtime client | Native WebSocket API | Free |
| Audio | Web Audio API (`AnalyserNode`, `MediaRecorder`/`getUserMedia`) | Free, browser-native |
| Frontend hosting | Vercel or Netlify free tier | Free |
| Backend framework | Python 3.11 + FastAPI (async) | Free |
| Backend hosting | Render.com or Fly.io free tier, single instance | Free |
| LLM (reasoning) | Hackathon-provided API credits if available; **Llama 3.1 8B** or **Qwen2.5 7B Instruct** via **Ollama** as guaranteed-free fallback | Free, local |
| Embeddings | `BAAI/bge-small-en-v1.5` via `sentence-transformers`, local | Free, open-weight |
| Reranker | `BAAI/bge-reranker-base`, local, top-k only | Free, open-weight |
| ASR | `faster-whisper` (`small.en`), local | Free, open-source |
| Voice synthesis | **Rime** — Mist v3 (live path), Coda (debrief, optional) | Sponsor hackathon credits |
| Vector DB | **Qdrant** — local binary (dev), Qdrant Cloud free tier (deployed demo) | Free at hackathon scale |
| Relational/state store | SQLite (file-based) | Free, zero infra |
| Event bus | In-process `asyncio.Queue` fan-out | Free — no Kafka/Redis needed |
| Realtime transport | FastAPI native WebSocket | Free |
| Deployment | Single process each side — no Docker/Kubernetes | Free, minimal ops |
| Monitoring | Structured stdout logs + in-app `SystemStatusBar`/`Benchmark` page | Free |
| Secrets | `.env` (gitignored) + `.env.example` committed | Free |

**Cost honesty note:** if sponsor LLM credits are unavailable at the event, the entire pipeline runs on Ollama + local Whisper + local embeddings/reranker + Qdrant local binary + Rime (the one unavoidable external dependency, per sponsor requirement). This fallback path must be tested before demo day, not assumed to work.

---

## 13. Implementation / Build Plan

Assumes a **48-hour / 3-day** hackathon window; rescale proportionally if actual duration differs.

**Day 1 — Core intelligence + data spine (no voice yet).** Repo scaffold, FastAPI skeleton, SQLite schema, Pydantic models. `data_simulator` publishing `NormalizedEvent`s; Sensor/Event Intelligence + Operational Context consuming them; hero + 2 other scenarios scripted. Qdrant local instance, collections created, seed data embedded. Risk Reasoner v1 (deterministic score only, no LLM); WebSocket fan-out; barebones frontend (`RiskOverview`, `SignalTicker`, live `ZoneCard`s) proving the pipeline end-to-end with no voice and no LLM — de-risking the hardest infra path first.

**Day 2 — LLM reasoning + Qdrant retrieval + voice plumbing.** Wire the LLM into Risk Reasoner (grounded evidence phrasing + citation filtering); wire the retrieval + rerank pipeline. Policy engine tiers + authorization gating; Response Orchestrator with one real tool (`permit_suspend`) + audit log. Rime streaming on Voice Interaction; ASR via `faster-whisper`; test the proactive-call path on the hero scenario, no barge-in yet. Build the `ConvergingSignals`, `RetrievalTrace`, and `VoiceInteraction` pages, wired to the real WebSocket stream.

**Day 3 — Interruption handling, memory write-back, polish, benchmark, demo.** Barge-in detection + conversation-state stack (concurrency design from §8 included); `InterruptionIndicator`; rehearse the hero-scenario interruption beat until reliable; record a fallback video clip as insurance. Resolution → debrief → `lessons_learned` write-back; second-scenario "learned it" beat wired and tested; `LessonsLearned` and global `MemoryBrowser` pages. Run `evaluation/benchmark_runner.py` against the ground-truth scenarios, commit results, wire `Benchmark` page to the real file. README, ARCHITECTURE.md, LIMITATIONS.md, Weya disclosure doc, full demo-script rehearsal at least 5 times, final deploy, secret scan.

**Winning-MVP floor:** full pipeline live end-to-end, one real tool call, retrieval that visibly changes the score, working barge-in (or a seamless fallback clip), one committed benchmark run, the two-incident "it learned" beat.

**Cut first if behind schedule:** deep `AuditTrail` polish (keep the compact timeline strip only), `Benchmark` page polish, multilingual voice, live CCTV computer vision, geospatial heatmap — all already excluded from MVP scope.

---

## 14. Evaluation & Proof

Every number shown to judges is generated from a **fixed, versioned scenario script**, reproducible from the committed repo — not staged live.

| Metric | Method |
|---|---|
| Compound-risk detection | Precision/recall across N scripted true-positive and true-negative scenarios |
| False alarms | (medium+ tier triggers on true-negative scenarios) ÷ total true-negatives |
| Retrieval quality | Recall@k against a known matching historical incident |
| Historical incident matching | Manual review of genuine factor overlap between retrieved and live scenario |
| Task completion | % of "authorize action" scenarios where the correct tool call executes with correct parameters |
| Human escalation accuracy | % of critical scenarios correctly escalating to the next tier on timeout |
| Voice latency | Logged time-to-first-audio-byte and interruption-cancel latency (min/median/max) |
| Interruption recovery | % of interruption test cases correctly resumed or re-routed without losing the pending decision |
| Response correctness | Manual rubric: does spoken evidence match the underlying data, with no hallucinated facts |

The benchmark runs once before the final demo; results are committed to `evaluation/results/` and rendered live on the `Benchmark` page — the numbers judges see are reproducible, not curated.

---

## 15. Winning Demo Script

Matches the hero scenario (§2), staged as a walk across the seven-page journey:

Land on **Risk Overview** (all green) → case opens, auto-advance to **Converging Signals** (arcs assembling) → judge's eye guided to **Retrieval Trace** as the historical match populates → **Voice Interaction** lights up as the call connects (interruption demonstrated here) → **Confirmation** for the authorization moment → brief stop on **Audit Trail** to show the logged action → **Lessons Learned** for the debrief and write-back, with the second-incident callback shown by returning to **Risk Overview** and re-entering a new case's **Retrieval Trace** to show the just-created lesson being retrieved. Numbers on screen always come from the logged benchmark run, never a scripted-to-look-good animation.

---

## 16. Track Compliance Matrix

| Requirement | How VIGIL satisfies it | Proof | Technology |
|---|---|---|---|
| Voice essential, not chatbot-with-mic | Proactive calls; unusable via text-only in the field use case | Hero scenario proactive call + barge-in | Rime + Voice Interaction |
| Qdrant meaningful, not decorative | Retrieval score is a direct input to the risk tier | On-screen score change on Retrieval Trace | Qdrant hybrid search + Risk Reasoner |
| Real-time conversations and interruptions | Barge-in cancels synthesis mid-utterance, state stack preserved | Live interruption beat | Rime streaming + conversation-state stack |
| High-trust workflows | Confirmation-gated actions, audit trail, escalation ladder | Permit-suspend tool call, logged authorization | Policy engine + Response Orchestrator |
| Tool calling / task completion | Real tool call executes on voice authorization | Audit log entry with tool result | Response Orchestrator |
| Memory and continuity | Open incidents persist across callbacks; resolved incidents feed future detections | Second-incident faster-detection beat | Qdrant `active_case_memory`, `lessons_learned` |
| Voice evaluation and testing | Logged latency + interruption-recovery benchmark | §14 results, committed | Evaluation harness |
| Latency measurement | Time-to-first-audio, interruption-cancel latency | Live `LatencyHUD` | Voice Interaction instrumentation |
| Interruption state handling | Explicit conversation-state stack | §8/§10.5 design + live demo | Voice Interaction |
| Pronunciation handling | Pre-processing normalization before Rime | Spoken equipment ID/measurement in demo audio | Rime + normalization layer |
| Memory boundaries | `active_case_memory` short-TTL/session-scoped; long-term written only on resolution | §10.7 design | Qdrant collection design |
| Security — no exposed keys | `.env`/`.env.example`, secret-scanned repo | `.env.example`, clean git history | Repo hygiene |
| Synthetic/de-identified data | All incident/permit/worker data synthetic or de-identified | Data generator scripts + README note | Data simulator |
| Public GitHub repo, README, working proof | Structured per §17, live reproducible demo + committed benchmark | Repo link | GitHub |
| Team contributions, limitations | Documented in README | README.md | Documentation |

No requirement in the official Track 1 document is left unaddressed; gaps (e.g., Weya API access) are explicitly disclosed rather than fabricated (§7).

---

## 17. Repository Structure

```
vigil-voxforge/
├── README.md
├── LICENSE
├── ARCHITECTURE.md
├── LIMITATIONS.md
├── .env.example
├── .gitignore
├── requirements.txt
│
├── backend/
│   ├── main.py
│   ├── api/{routes_zones,routes_cases,routes_memory,routes_benchmark,routes_demo,ws_session}.py
│   ├── bus/event_bus.py
│   ├── agents/{sensor_event_intelligence,operational_context,risk_reasoner,response_orchestrator,voice_interaction}.py
│   ├── policy_engine/{thresholds.yaml,policy.py}
│   ├── tools/{registry,permit_suspend,evacuation_broadcast,incident_log_create,callback_schedule}.py
│   ├── memory/{qdrant_client,collections,embeddings}.py
│   ├── rerank/reranker.py
│   ├── voice/{rime_client,asr_client,pronunciation_normalizer}.py
│   ├── llm/{client.py, prompts/{risk_reasoner_prompt.txt,voice_turn_prompt.txt}}
│   ├── db/{schema.sql,db.py}
│   ├── models/{events,context,risk,tools}.py
│   └── state_machine/case_state_machine.py
│
├── data_simulator/
│   ├── main.py, event_generator.py
│   ├── scenarios/{hero_scenario.json,false_positive_scenario.json,critical_no_response_scenario.json}
│   └── schemas/raw_event_schema.json
│
├── qdrant/
│   ├── seed_data/{incidents_historical,near_misses,maintenance_history,safety_procedures,equipment_context}.jsonl
│   └── ingest.py
│
├── frontend/
│   ├── index.html, vite.config.ts, tailwind.config.ts, package.json
│   └── src/
│       ├── main.tsx, App.tsx
│       ├── styles/tokens.css
│       ├── store/useCaseStore.ts
│       ├── ws/useSessionSocket.ts
│       ├── pages/{RiskOverview,ConvergingSignals,RetrievalTrace,VoiceInteraction,Confirmation,AuditTrail,LessonsLearned,MemoryBrowser,Benchmark,DemoControl}.tsx
│       └── components/{RiskPulseRing,PlantMap,ZoneCard,SignalTicker,SystemStatusBar,CaseStepperNav,CompoundScoreReadout,EvidencePanel,RetrievalPipelineStrip,Waveform,LiveTranscript,LatencyHUD,AuthorizationPrompt,ActionPreview,EvidenceRecap,CaseTimeline,InterruptionIndicator,AuditLogTable,CollectionTabs,RecordGrid,LessonJustCreatedBanner,DebriefCapture,RelatedMemoryLink,MetricCard,ScenarioList,ScenarioPlayer}.tsx
│
├── evaluation/
│   ├── benchmark_runner.py, scenarios_ground_truth.json
│   └── results/.gitkeep
│
├── demo/
│   ├── demo_script.md
│   └── fallback_clips/interruption_recovery_fallback.mp4
│
└── docs/{data_architecture.md, risk_safety_architecture.md, weya_alignment_disclosure.md}
```

---

## 18. Submission Assets & Limitations

**README.md contents:** problem summary, one-line pitch, architecture diagram, setup/run instructions, benchmark-run instructions, hero-scenario demo instructions, sponsor-technology explanation (Rime/Qdrant/Weya each explained per §5–7), limitations, team contributions.

**Other assets:** exported architecture diagram image; 2–3 minute demo video of the hero scenario with captioned latency numbers; screenshots (risk overview, converging signals, retrieval trace, audit entry, lessons-learned creation); committed benchmark results with a short interpretation paragraph; per-member contribution breakdown by agent/layer owned.

**Limitations (stated explicitly, not hidden):** no physical IoT hardware — all sensor/SCADA/permit/maintenance data is simulated or synthetic/de-identified; benchmark scenarios are scripted, not field-validated; CCTV events are pre-scripted labels, not live computer vision, unless the CV stretch goal is completed; no formal safety certification; **not a substitute for certified industrial safety systems** — VIGIL adds an intelligence layer on top of, not instead of, deterministic safety controls.

---

## 19. Judge-Perspective Self-Critique

**Rubric read:** Problem & usefulness (30%) is strong — grounded directly in the cited DGFASLI figure and Visakhapatnam incident, not a generic pitch. Voice experience (25%) and Use of Rime (20%) are strong *only if* barge-in and the proactive call are working live, not merely described — this is the single highest-risk item. Technical execution (15%) depends on the tool-call execution being real, not mocked. Demo (10%) depends on the second-incident "it learned" beat landing live.

**What would make a judge reject it:** claiming Weya integration without confirmed API access; a "compound risk" that's actually a single-metric threshold with extra words; Qdrant retrieval that never changes the output; voice that could be replaced by a text notification with zero loss.

**What would make a judge remember it:** live barge-in recovering correctly, and the second-incident faster-detection beat proving the memory loop is real, not narrated.

**Biggest technical risk:** live barge-in under demo-room network/acoustic conditions — the hardest real-time engineering problem in the system. Mitigation: a pre-recorded fallback clip, and click-to-authorize/text-input fallbacks throughout (§10.3), so no single live-audio failure blocks the demo.

**What to remove under time pressure:** CCTV computer vision (keep pre-scripted labels), multilingual support, geospatial heatmap — none required by the rubric, each adds live-demo failure surface without adding judged points relative to the core loop.

**Highest-leverage single addition:** making the "second incident, faster because of stored memory" beat airtight and visibly instrumented with before/after detection-time numbers — the hardest claim in the brief to fake, and the most credible thing a technical judge can verify live.
