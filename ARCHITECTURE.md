┌──────────────────────────────────────────────────────────────────┐
│                    INDUSTRIAL EVENT SOURCES                     │
│                                                                  │
│ Gas / Temperature / Pressure                                    │
│ SCADA Events · Permits · Maintenance · Shifts · CCTV Events    │
└───────────────────────────────┬──────────────────────────────────┘
                                │
                                │ Async Event Stream
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                  SENSOR / EVENT INTELLIGENCE                     │
│                                                                  │
│ Event normalization                                              │
│ Typed event generation                                            │
│ Deterministic threshold pre-filter                               │
│ Rolling event window                                              │
└───────────────────────────────┬──────────────────────────────────┘
                                │
                                │ Normalized Events
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                   OPERATIONAL CONTEXT AGENT                      │
│                                                                  │
│ Combines live operational state with:                            │
│ - Equipment context                                               │
│ - Maintenance history                                             │
│ - Active permits                                                  │
│ - Shift state                                                     │
│ - Zone information                                                │
└───────────────────────┬───────────────────────────┬──────────────┘
                        │                           │
                        │                           │ Qdrant
                        │                           ▼
                        │              ┌───────────────────────────┐
                        │              │ Equipment Context         │
                        │              │ Maintenance History       │
                        │              └───────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│                       RISK REASONER                               │
│                                                                  │
│ Compound-risk correlation                                        │
│ Historical similarity retrieval                                  │
│ Deterministic + LLM reasoning                                    │
│ Evidence construction                                             │
│ Risk tier classification                                          │
└───────────────────────────────┬──────────────────────────────────┘
                                │
                                │ Risk Assessment + Evidence
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                  DETERMINISTIC POLICY ENGINE                     │
│                                                                  │
│ Low      → Log                                                    │
│ Medium   → Notify                                                 │
│ High     → Voice + Human Authorization                            │
│ Critical → Voice + Timeout Escalation + Safety Fallback          │
└───────────────────────────────┬──────────────────────────────────┘
                                │
                    ┌───────────┴────────────┐
                    │                        │
                    ▼                        ▼
        ┌───────────────────────┐   ┌──────────────────────┐
        │ VOICE INTERACTION     │   │ AUDIT / CASE LOG     │
        │ AGENT                 │   │                      │
        │                       │   │ Immutable decision   │
        │ Rime streaming        │   │ trail                 │
        │ ASR                   │   │                      │
        │ Barge-in              │   └──────────────────────┘
        │ State stack            │
        └───────────┬───────────┘
                    │
                    │ Voice
                    ▼
             ┌──────────────┐
             │   OPERATOR   │
             │              │
             │ Human voice  │
             │ authorization│
             └──────┬───────┘
                    │
                    │ Authorized Action
                    ▼
        ┌──────────────────────────────┐
        │ RESPONSE / WORKFLOW          │
        │ ORCHESTRATOR                 │
        │                              │
        │ Permit suspension            │
        │ Evacuation broadcast         │
        │ Incident logging             │
        │ Callback scheduling          │
        └──────────────┬───────────────┘
                       │
                       │ Resolution + Debrief
                       ▼
        ┌──────────────────────────────────────────┐
        │              MEMORY WRITE-BACK           │
        │                                          │
        │ Qdrant: lessons_learned                  │
        │ Qdrant: risk_patterns                    │
        └─────────────────────┬────────────────────┘
                              │
                              └──────────────► Future Risk Reasoning
