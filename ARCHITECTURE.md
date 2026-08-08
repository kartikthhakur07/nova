sequenceDiagram
    participant E as Industrial Events
    participant C as Context Builder
    participant A as Agent Layer
    participant Q as Qdrant
    participant R as Risk Reasoner
    participant P as Policy Engine
    participant V as Rime Voice
    participant H as Human
    participant W as Workflow
    participant L as Learning

    E->>C: Normalized events
    C->>A: Operational context
    A->>Q: Retrieve relevant memory
    Q-->>A: Historical evidence
    A->>R: Signals + context + memory
    R->>P: Compound risk assessment
    P-->>V: Required response
    V->>H: Voice notification
    H->>V: Question / authorization
    V->>W: Authorized action
    W-->>H: Outcome
    W->>L: Resolved incident
    L->>Q: New lesson learned
