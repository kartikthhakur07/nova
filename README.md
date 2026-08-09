# NOVA

## Industrial Risk Intelligence

NOVA is a voice-native industrial safety intelligence system that detects **compound risks** by correlating individually normal signals across gas sensors, permits, maintenance activity, shift data, SCADA events, CCTV-derived events, and historical safety knowledge.

Instead of waiting for a single sensor to cross an alarm threshold, NOVA continuously builds a contextual risk picture, retrieves relevant organizational memory, reasons about emerging risk, communicates with the safety officer through voice, coordinates authorized actions, and learns from resolved incidents.

> **The voice that notices what no single sensor can.**

## Core Capabilities

### Compound-Risk Detection

NOVA correlates multiple weak signals across a rolling time window and identifies dangerous combinations that conventional single-sensor threshold systems can miss.

A typical risk pattern may combine:

- Elevated gas readings
- Active hot-work permits
- Maintenance activity
- Shift changeover
- Worker presence
- Historical near-miss patterns

The compound-risk engine combines deterministic rules with AI reasoning rather than relying exclusively on either approach.

### Qdrant-Powered Safety Memory

Qdrant acts as NOVA's operational memory rather than a simple document lookup layer.

NOVA maintains contextual collections for:

- Historical incidents
- Near misses
- Maintenance history
- Safety procedures
- Equipment context
- Confirmed risk patterns
- Lessons learned
- Active case memory

Hybrid semantic and lexical retrieval allows natural-language descriptions to be searched semantically while equipment IDs, permit codes, and regulatory identifiers remain exact-matchable.

Retrieved historical similarity directly influences compound-risk assessment and provides evidence for the risk explanation.

### Proactive Voice Safety Officer

NOVA is designed to proactively contact the safety officer when a compound-risk threshold is crossed.

Voice is the primary interaction channel for field environments where operators may be wearing PPE, using gloves, or moving through hazardous areas.

Operators can:

- Receive proactive risk calls
- Ask follow-up questions
- Request specific evidence
- Interrupt NOVA mid-response
- Confirm recommended actions
- Continue interrupted workflows

### Rime Voice Integration

Rime powers the real-time voice interaction layer.

The implementation focuses on:

- Streaming voice responses
- Low time-to-first-audio
- Mid-utterance barge-in cancellation
- Interruption recovery
- Conversation continuity
- Industrial identifier pronunciation
- Unit and permit-code normalization
- End-to-end voice latency instrumentation

NOVA measures and displays voice performance including first-audio latency and interruption cancellation latency.

### Interruption-Safe Conversations

Interruptions are treated as first-class events.

When an operator asks:

> "Wait, which permit?"

NOVA stops the current response, answers the interruption, and resumes the pending decision without restarting the conversation.

A conversation-state stack preserves:

- Pending decision
- Current explanation
- Risk context
- Interruption state
- Resume point

### Evidence-First Risk Explanation

NOVA does not present a bare risk score.

It explains the specific combination of evidence behind the decision, such as:

- Current gas trend
- Active permit
- Maintenance condition
- Operational timing
- Relevant historical incident

This allows the operator to verify or challenge individual facts instead of trusting an unexplained AI conclusion.

### Confirmation-Gated Actions

NOVA separates AI reasoning from safety authorization.

For actions beyond notification, the system asks for explicit human confirmation before execution.

For example:

> "Suspend the Bay 3 permit — yes or no?"

Authorized actions are executed through typed tools and recorded in the audit trail.

### Escalation and Fail-Safe Workflows

Risk levels determine how NOVA responds:

- **Low:** Log only
- **Medium:** Voice notification
- **High:** Voice call and explicit authorization
- **Critical:** Voice call followed by escalation if unanswered

Critical cases can escalate to the shift manager and ultimately trigger a deterministic safety fallback.

The AI layer never becomes the sole authority for dangerous actions.

### Persistent Incident Continuity

Open incidents remain active through a persistent incident state machine:

```text
Detected
→ Investigating
→ Escalated
→ Confirmed / Dismissed
→ Resolved
```

## Quick start

### Prerequisites
- Python 3.11+
- Node 18+
- Copy `.env.example` to `.env` and fill in `RIME_API_KEY`

### Run locally
```bash
make install   # install all deps
make demo      # starts backend + opens browser
```

Then open DemoControl (⌘K) and press ▶ Play on "Hero Scenario".

### Run E2E smoke test
```bash
make e2e
```
All 8 steps should pass before the live demo.

### Reset demo state
```bash
make reset-demo
```
Run this between demo rehearsals to clear SQLite and restart clean.
