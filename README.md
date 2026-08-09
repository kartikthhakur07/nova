# NOVA

**The voice that notices what no single sensor can.**

NOVA is a voice-native industrial safety intelligence system. It fuses gas sensors, permit-to-work logs, maintenance records, shift data, and CCTV events into a single compound-risk picture, speaks to safety officers hands-free in the field, and turns every resolved incident into organizational memory that makes the next warning faster.

Built for **StarForge 2026 — Track 1 (VoxForge)**.

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [How It Works — User Flow](#how-it-works--user-flow)
- [Features](#features)
- [What Makes This Different](#what-makes-this-different)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Sponsor Technology Integration](#sponsor-technology-integration)
- [Getting Started](#getting-started)
- [Repository Structure](#repository-structure)
- [Evaluation](#evaluation)
- [Limitations](#limitations)
- [Team](#team)
- [License](#license)

---

## The Problem

India's heavy industrial sector continues to pay a devastating human cost. DGFASLI recorded over 6,500 fatal workplace accidents in FY2023 — a figure that excludes most mining and construction fatalities. In one of the most disturbing recent incidents, eight workers died at the Visakhapatnam Steel Plant in January 2025 when entrapped gases triggered a sudden explosion in a coke oven battery — a facility with functioning gas detectors, permit-to-work controls, and SCADA. An investigation found that warning signals from gas pressure sensors existed, but no intelligence layer connected those readings to an operational decision in time.

This is not a story about missing technology. A 2024 FICCI survey found that **over 60% of large industrial facilities rely on manual handoffs between their own digital safety tools.** The data exists. The systems exist. What's missing is the layer that fuses sensors, permits, maintenance records, and shift logs into a single real-time risk picture — and acts on it before a fatality, not after.

## The Solution

NOVA is not a dashboard, and it is not a chatbot with a microphone bolted on. It runs a standing agentic loop over live plant data:

**Detect → Contextualize → Retrieve organizational memory → Reason about compound risk → Explain → Recommend → Authorize & Act → Verify → Learn**

Individually, a gas reading 8% above baseline is unremarkable. A hot-work permit active in the same bay is routine. A compressor flagged for drift two hours earlier is a maintenance footnote. A shift changeover in twenty minutes is scheduling. **Together, in the same time window, they are a compound risk no single sensor threshold or SCADA rule can see.** VIGIL correlates across sources and time, retrieves whether a similar combination has mattered before, and — because the people who need this information are in PPE, near hazardous equipment, and cannot safely read a screen — it tells them, out loud, before they ask.

## How It Works — User Flow

1. **Silent by default.** VIGIL monitors continuously in the background. It does not talk unless a compound-risk score crosses a calibrated threshold — a system that talks constantly gets muted, so every interruption is earned.
2. **Weak signals converge.** Sub-threshold facts across sensors, permits, maintenance, and shift data accumulate in a rolling window. VIGIL's Risk Reasoner correlates them and queries organizational memory for a matching historical pattern.
3. **VIGIL proactively calls the officer.** No app to open, no dashboard to check — a voice call, structured as *state → evidence → ask*, citing the specific combination of facts and any matching historical incident.
4. **The officer can interrupt at any point.** Barge-in is handled natively: mid-sentence interruptions cancel the current utterance, VIGIL answers the interrupting question directly, then resumes exactly where it needs to.
5. **Any action requires explicit human authorization.** VIGIL asks a single closed-form question ("Suspend that permit — yes or no?"). Nothing executes without a recorded human decision.
6. **Authorized actions are executed and logged.** A real tool call runs (e.g. suspending a permit), and the full evidence-to-action chain is written to an immutable audit trail.
7. **Unresolved cases persist across callbacks.** VIGIL can schedule a follow-up and hold the case open rather than forcing a synchronous resolution.
8. **Resolution becomes memory.** On close, VIGIL asks a one-line spoken debrief. The answer — plus the full evidence trail — is embedded and written back into organizational memory.
9. **The next incident is detected faster.** A later, similarly-patterned case retrieves the lesson just written, visibly citing it — the system provably gets sharper across its own operating history, not just in theory.

## Features

**Core (always on):**
- Multi-source event correlation across sensors, permits, maintenance, and shift data
- Compound-risk scoring — deterministic, explainable arithmetic, not a black-box confidence number
- Historical incident and near-miss retrieval that directly changes the risk score
- Proactive, evidence-first voice notification with full barge-in / interruption handling
- Confirmation-gated action execution with a complete, immutable audit trail
- Organizational memory that writes back on every resolved case and is retrievable on the very next one

**Safety architecture:**
- Deterministic threshold alarms that fire independently of any AI reasoning
- A single, structurally-enforced authorization gate — the reasoning layer proposes, it never executes
- A fixed escalation ladder (officer → shift manager → deterministic fallback) with enforced timeouts
- Hallucination-prevention: every spoken claim must be traceable to a specific input fact or it is dropped before being said

## What Makes This Different

| Capability | Why a generic RAG chatbot or dashboard can't replicate it |
|---|---|
| **Compound-risk reasoning** | A standing correlation loop that initiates contact, not a system that answers when asked |
| **Temporal correlation** | Risk is defined by the combination and sequence of signals — this requires a stateful reasoning loop, not a single retrieval call |
| **Retrieval that changes the decision** | The historical-match similarity score is a direct input to the compound-risk arithmetic, not a citation fetched after the fact |
| **Compounding organizational memory** | Every resolved case writes back into the exact memory the next detection queries — the system measurably improves across its own operating history |
| **Voice-first, interruption-safe interaction** | Losing conversation state on barge-in is the most common voice-agent failure; VIGIL is architected specifically around a persistent interruption-state stack |

## Architecture

The complete system design — every layer from the browser to the vector database, with a full diagram — lives in **[`ARCHITECTURE.md`](./ARCHITECTURE.md)**. In brief:

NOVA is a single logical pipeline implemented as one backend process with cleanly separated modules — no microservice mesh, no unnecessary infrastructure. Five async agents (Sensor/Event Intelligence, Operational Context, Risk Reasoner, Response Orchestrator, Voice Interaction) sit behind a deterministic policy/safety gate that has zero LLM involvement, backed by a vector memory layer (Qdrant) and a relational state/audit store (SQLite), fronted by a real-time WebSocket-driven frontend built around a seven-stage case journey (Risk Overview → Converging Signals → Retrieval Trace → Voice Interaction → Confirmation → Audit Trail → Lessons Learned).

See `ARCHITECTURE.md` for the full layered diagram, request lifecycle, deployment topology, and failure/degradation paths.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript, single client-side store, native WebSocket |
| API gateway | FastAPI (Python), REST + WebSocket |
| Agent orchestration | Async Python tasks within one process, in-process event bus |
| Policy engine | Pure deterministic Python — no LLM dependency |
| Vector memory | Qdrant — hybrid dense + lexical search, cross-encoder reranking |
| Relational store | SQLite |
| Embeddings | `BAAI/bge-small-en-v1.5` (local) |
| Reranker | `BAAI/bge-reranker-base` (local) |
| LLM | Hosted API (sponsor credits) with a local fallback model |
| Speech recognition | `faster-whisper` (local) |
| Voice synthesis | Rime — streaming |
| Deployment | Single-process backend, static frontend hosting — no Docker/Kubernetes |

Every component was chosen to build and demo at **₹0 / $0**. Full rationale for each choice, plus the exact free-tier path, is in `ARCHITECTURE.md`.

## Sponsor Technology Integration

**Rime** is the only channel through which VIGIL initiates contact — it is not a text-to-speech layer bolted onto a chat UI. Streaming synthesis, sub-second time-to-first-audio, mid-utterance barge-in cancellation, and pronunciation handling for equipment IDs and measurements are all first-class design requirements, not afterthoughts.

**Qdrant** is one of the system's intellectual cores. Its retrieval score is a direct, causal input to the compound-risk tier — remove it, and VIGIL loses its only source of "has this exact combination mattered before." Eight purpose-built collections separate live case memory from long-term organizational memory, with hybrid dense + lexical search and payload filtering so retrieval is precise, not merely on-topic.

**Weya** is referenced in the official Track 1 materials as a learning resource, not a provided API. VIGIL is explicit and honest about this: escalation ladder design, callback scheduling, and human-handoff patterns are **Weya-inspired, independently implemented** — never claimed as a live integration unless API access is explicitly confirmed.

## Getting Started

```bash
# Clone and enter the repo
git clone <repo-url> && cd vigil-voxforge

# Backend
cd backend
pip install -r requirements.txt
cp ../.env.example ../.env   # fill in RIME_API_KEY at minimum; LLM defaults to a local fallback
python -m uvicorn main:app --reload

# Vector memory (separate terminal)
qdrant   # or: docker run -p 6333:6333 qdrant/qdrant
python ../qdrant/ingestion/ingest_seed_data.py

# Frontend (separate terminal)
cd ../frontend
npm install
npm run dev
```

Run the committed evaluation benchmark:

```bash
python evaluation/benchmark_runner.py
```

Full setup notes, environment variable reference, and troubleshooting live in `.env.example` and `ARCHITECTURE.md`.

## Repository Structure

```
vigil-voxforge/
├── ARCHITECTURE.md          # complete system design and diagrams
├── LIMITATIONS.md
├── backend/                 # FastAPI app: agents, policy engine, memory, services
├── frontend/                # React app: 7-stage case journey
├── data_simulator/          # scripted, replayable telemetry — no physical IoT required
├── qdrant/                  # collection schemas, seed data, ingestion
├── evaluation/               # benchmark runner + committed results
└── demo/                     # demo script + fallback recording
```

## Evaluation

Every metric shown in this repository is generated from a fixed, versioned scenario script and committed to `evaluation/results/` — reproducible by re-running `evaluation/benchmark_runner.py`, not hand-picked from a live demo. Measured: compound-risk detection precision/recall, false-alarm rate, retrieval recall@k, task completion rate, human-escalation accuracy, voice latency (time-to-first-audio, interruption-cancel latency), and response correctness against underlying data.

## Limitations

This is a hackathon prototype, built and demoed with **no physical IoT hardware** — all sensor, SCADA, permit, maintenance, and shift data is simulated or synthetic/de-identified. Benchmark scenarios are scripted, not field-validated against a real facility. CCTV-derived events are pre-scripted labels, not live computer vision, unless noted otherwise. VIGIL has no formal safety certification and is **not a substitute for certified industrial safety systems** — it is designed to add an intelligence layer on top of, not instead of, deterministic safety controls that already exist in a facility. |

## License

MIT — see `LICENSE`.