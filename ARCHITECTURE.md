# Architecture

NOVA is a voice-first, agentic industrial-safety system. This document describes the complete system architecture — every layer from the browser to the vector database — independent of product framing or hackathon scoring. For product rationale, see `README.md`.

## Contents

- [Layer overview](#layer-overview)
- [System diagram](#system-diagram)
- [Frontend architecture](#frontend-architecture)
- [Backend architecture](#backend-architecture)
- [Data layer](#data-layer)
- [External services](#external-services)
- [Request lifecycle](#request-lifecycle)
- [Deployment topology](#deployment-topology)
- [Failure & degradation paths](#failure--degradation-paths)
- [Technology stack](#technology-stack)

---

## Layer overview

| # | Layer | Responsibility | Depends on |
|---|---|---|---|
| 1 | Presentation | Pages, components, design system | Client state |
| 2 | Client state | In-memory store, derived UI state | Realtime transport |
| 3 | Realtime transport | WebSocket session, typed message envelope | API gateway |
| 4 | API gateway | REST + WebSocket surface | Agent layer |
| 5 | Agent / orchestration | Five async agents implementing the reasoning pipeline | Policy layer, data layer, external services |
| 6 | Policy / safety | Deterministic thresholds, authorization gate, escalation ladder, tool registry | Agent layer, audit store |
| 7 | Data / memory | Vector memory, relational state, embeddings, reranking | Agent layer |
| 8 | External services | Voice synthesis, LLM, speech recognition | Agent layer |
| 9 | Infra / deployment | Hosting, secrets, logging | All layers |

The system is a single logical pipeline — **Detect → Contextualize → Retrieve → Reason → Explain → Authorize → Act → Verify → Learn** — implemented as one backend process with clearly separated modules, not a microservice mesh. This is a deliberate simplicity decision, not an omission: see [Deployment topology](#deployment-topology).

---

## System diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. PRESENTATION                                                           │
│   Risk Overview → Converging Signals → Retrieval Trace → Voice            │
│   Interaction → Confirmation → Audit Trail → Lessons Learned              │
│   (shared CaseStepperNav, server-driven stage highlighting)               │
└───────────────────────────────┬──────────────────────────────────────────┘
                                 │ store reads/writes
┌───────────────────────────────▼──────────────────────────────────────────┐
│ 2. CLIENT STATE                                                           │
│   useCaseStore — activeCase, evidenceList, retrievalMatches,              │
│   conversationStateStack, latencyMarks, connectionStatus, currentStage    │
│   (server-authoritative: never computes tier/authorization locally)       │
└───────────────────────────────┬──────────────────────────────────────────┘
                                 │ single WebSocket, typed envelope
┌───────────────────────────────▼──────────────────────────────────────────┐
│ 3. REALTIME TRANSPORT           /ws/session/:sessionId                    │
└───────────────────────────────┬──────────────────────────────────────────┘
                                 │
┌───────────────────────────────▼──────────────────────────────────────────┐
│ 4. API GATEWAY (FastAPI)                                                  │
│   REST: /zones /cases/:id /cases/:id/audit /cases/:id/authorize           │
│         /memory/collections/:name /benchmark/results /demo/scenarios      │
└───────────────────────────────┬──────────────────────────────────────────┘
                                 │ internal async event bus
┌───────────────────────────────▼──────────────────────────────────────────┐
│ 5. AGENT / ORCHESTRATION LAYER                                            │
│                                                                            │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐      │
│  │ Sensor / Event  │─▶│ Operational     │─▶│ Risk Reasoner          │      │
│  │ Intelligence    │  │ Context Agent   │  │ (LLM + retrieval)      │◀───┐ │
│  │ (deterministic  │  │ (permits, shift,│  │ compound score + tier │    │ │
│  │  normalize +    │  │  maintenance)   │  │ + evidence + citations │    │ │
│  │  threshold pre- │  └────────────────┘  └───────────┬────────────┘    │ │
│  │  filter)        │                                  │                 │ │
│  └────────────────┘                                   ▼                 │ │
│                                          ┌──────────────────────────┐    │ │
│                                          │ 6. POLICY / SAFETY GATE  │    │ │
│                                          │ (deterministic — no LLM) │    │ │
│                                          │ thresholds → tier        │    │ │
│                                          │ tier → authorization lvl │    │ │
│                                          │ tool registry (gated)    │    │ │
│                                          │ escalation ladder        │    │ │
│                                          └────────────┬──────────────┘   │ │
│                                        ┌───────────────┴───────────────┐ │ │
│                                        ▼                               ▼ │ │
│                        ┌────────────────────────┐   ┌──────────────────────────┐
│                        │ Voice Interaction Agent │   │ Response Orchestrator    │
│                        │ turn generation, ASR,   │   │ authorization tracking,  │
│                        │ barge-in, state stack   │   │ tool execution, audit    │
│                        └───────────┬─────────────┘   └────────────┬─────────────┘
│                                    │                                │           │
└────────────────────────────────────┼────────────────────────────────┼───────────┘
                                     │                                │
                     ┌───────────────▼──────────────┐   ┌─────────────▼──────────────┐
                     │ 8. EXTERNAL SERVICES          │   │ 7. DATA / MEMORY LAYER     │
                     │  Rime (voice synthesis)       │   │  Qdrant — 8 collections    │
                     │  faster-whisper (ASR)         │   │  SQLite — cases, audit_log,│
                     │  LLM (hosted API / Ollama)    │   │  permits, maintenance,     │
                     │                                │   │  shifts, equipment         │
                     └────────────────────────────────┘   │  embeddings + reranker     │
                                                            └──────────────┬─────────────┘
                                                                           │
                                              memory write-back on resolution
                                                (lessons_learned, risk_patterns)
                                                           │
                                              ↻ feeds the next Risk Reasoner retrieval
```

---

## Frontend architecture

### Pages (presentation layer)

```
/                              Risk Overview           — global/home
/case/:id/signals              Converging Signals       — evidence assembling live
/case/:id/retrieval            Qdrant Retrieval Trace    — retrieval pipeline made visible
/case/:id/voice                Voice Interaction         — live call, transcript, latency
/case/:id/confirm              Confirmation              — human authorization gate
/case/:id/audit                Audit Trail               — immutable case log
/case/:id/memory               Lessons Learned            — debrief + write-back
/memory                        Global Memory Browser     — cross-case, linked from above
/benchmark                     Evaluation Results
/demo                          Scenario Control           — presenter-only
```

Pages 2–7 share one persistent stepper layout whose highlighted stage is driven entirely by server-pushed case state — the frontend never infers pipeline stage locally.

### State & transport

- **Store:** a single client-side store holds the active case's evidence, retrieval matches, conversation stack, latency marks, and connection status — populated only from server messages, never computed client-side.
- **Transport:** one WebSocket per session carries every live update as a typed message (`event.normalized`, `risk.updated`, `case.state_changed`, `transcript.delta`, `audio.level`, `audit.entry`, `authorization.requested`, `interruption.detected`, `connection.status`). Reconnect uses exponential backoff; because the server owns state, a reconnect simply re-syncs.
- **Interaction fallbacks:** every voice-driven action (authorization, speech input) has a click/keyboard equivalent, so no single audio or ASR failure blocks the UI.

---

## Backend architecture

### API gateway

Single FastAPI process exposing REST for case/zone/memory/benchmark reads and one action endpoint (`authorize`), plus one WebSocket endpoint fanning out the internal event bus to connected sessions.

### Agent / orchestration layer

Five agents, implemented as async tasks inside one process (not separate services):

| Agent | Reasoning type | Talks to |
|---|---|---|
| Sensor/Event Intelligence | Deterministic | Rolling event buffer |
| Operational Context | Deterministic assembly | SQLite, Qdrant (equipment/maintenance) |
| Risk Reasoner | LLM + deterministic scoring | Qdrant (historical collections), LLM, reranker |
| Response Orchestrator | Deterministic (policy-bound) | Policy engine, tool registry, SQLite |
| Voice Interaction | Deterministic turn-taking + streaming I/O | Rime, ASR, in-memory conversation stack |

Internal event flow:
```
raw.telemetry → normalized.events → context.assembled → risk.assessed
→ policy.decision → { conversation events (voice) , tool.executed (orchestrator) }
→ memory.write_back
```

**Concurrency note:** Voice Interaction begins speaking as soon as a case opens, in parallel with Risk Reasoner finishing evidence generation — the voice channel is never blocked on the slowest step of the reasoning chain.

### Policy / safety layer

The only layer in the system that is fully deterministic and has zero LLM involvement:

```
compound_score ──▶ [thresholds.yaml] ──▶ tier (low/medium/high/critical)
tier ──▶ [authorization.py] ──▶ required authorization level (none/notify/confirm)
tool_call ──▶ [is_tool_call_authorized()] ──▶ single choke point — execution
                                                is structurally impossible
                                                without a recorded human decision
tier timeout ──▶ [escalation_policy.py] ──▶ officer → shift manager → deterministic fallback
```

Case state machine (server-authoritative, drives the frontend stepper):
```
DETECTED → INVESTIGATING → NOTIFYING → AWAITING_RESPONSE
  → ACTING → MONITORING → RESOLVING → RESOLVED → ARCHIVED
AWAITING_RESPONSE → ESCALATING → ACTING | FALLBACK_TRIGGERED   (on timeout)
```

---

## Data layer

**Qdrant** — eight collections, 384-dim vectors, cosine distance, hybrid dense + exact-match retrieval, pre-filtered by zone/equipment before ranking:

```
incidents_historical   near_misses          maintenance_history   safety_procedures
equipment_context      risk_patterns        lessons_learned       active_case_memory
```

Retrieval pipeline:
```
context → query text → embed → hybrid search (top_k=10) → cross-encoder rerank (top_n=3)
→ LLM grounding/citation filter → evidence-and-citation object
   (consumed identically by Risk Reasoner scoring AND Voice Interaction speech)
```

**SQLite** — relational state and the immutable audit trail: `cases`, `audit_log`, `permits`, `maintenance_records`, `shifts`, `equipment`.

**Three memory horizons**, deliberately separated:
```
Working memory        → conversation stack, in-process, session-lifetime only
Case memory            → active_case_memory (Qdrant) + cases/audit_log (SQLite)
Organizational memory  → lessons_learned / risk_patterns (Qdrant), written once per
                          resolved case — the only horizon that influences future,
                          unrelated cases
```

---

## External services

| Service | Role | Degrades to |
|---|---|---|
| Rime | Streaming voice synthesis | Browser native speech synthesis |
| LLM (hosted or local) | Evidence phrasing, citation grounding | Local model → deterministic-only scoring |
| ASR (local) | Speech-to-text | Text-input fallback |

---

## Request lifecycle

```
1. Event ingested → normalized → deterministic threshold pre-filter
2. Context assembled from live + structured data
3. Risk Reasoner retrieves historical memory, LLM grounds evidence + citations,
   deterministic arithmetic computes compound score
4. Policy engine maps score → tier → required authorization
5. (tier ≥ medium) Voice Interaction speaks, concurrently with any remaining reasoning
6. (tier ≥ high) Response Orchestrator proposes a tool call — held until authorized
7. Human authorizes (voice or UI) → tool executes → audit entry written
8. Case resolves → debrief captured → written back to organizational memory
9. The next Risk Reasoner run for any case can retrieve that new record
```

Every step is pushed to connected clients over the WebSocket in real time as it happens.

---

## Deployment topology

```
┌────────────┐   WebSocket/REST   ┌───────────────────────────────────────┐
│  Frontend   │◀──────────────────▶│  Single backend process               │
│  (static    │                    │  (API gateway + all 5 agents as       │
│   hosting)  │                    │   async tasks + in-process event bus) │
└────────────┘                    │                                        │
                                    │  ┌────────┐ ┌────────┐ ┌───────────┐ │
                                    │  │ SQLite │ │ Qdrant │ │ LLM/ASR/  │ │
                                    │  │ (file) │ │        │ │ Rime      │ │
                                    │  └────────┘ └────────┘ └───────────┘ │
                                    └───────────────────────────────────────┘
```

No Docker/Kubernetes, no message broker, no microservice mesh — one deployable backend process, chosen deliberately for operational simplicity at this system's scale. See the technology stack for the production-scale equivalents each component maps to.

---

## Failure & degradation paths

| Failure | Behavior |
|---|---|
| LLM unavailable | Falls back to a local model, then to deterministic-only scoring |
| Qdrant unreachable | Historical-boost term treated as zero; UI states retrieval is unavailable |
| Rime unavailable | Falls back to browser-native speech synthesis, with a visible indicator |
| ASR unavailable | Text-input authorization/interaction remains fully functional |
| WebSocket drop | Auto-reconnect with backoff; server-authoritative state means reconnect just re-syncs |
| Critical case unacknowledged | Auto-escalates to the next tier, then to a deterministic fallback — never waits silently |

---

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript, single client-side store, native WebSocket |
| API gateway | FastAPI (Python), REST + WebSocket |
| Agents | Async Python tasks within one process |
| Policy engine | Pure deterministic Python, no LLM dependency |
| Vector memory | Qdrant, hybrid dense + lexical search, cross-encoder reranking |
| Relational store | SQLite |
| Embeddings | Local sentence-embedding model |
| LLM | Hosted API with a local fallback model |
| ASR | Local speech-to-text |
| Voice synthesis | Rime, streaming |
| Event bus | In-process async pub/sub |
| Deployment | Single-process backend, static frontend hosting |
