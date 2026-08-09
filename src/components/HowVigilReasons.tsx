const STEPS = [
  {
    num: '01',
    title: 'Detect',
    desc: 'Continuous and automatic monitoring across sensor streams — gas, SCADA, permits, maintenance, CCTV.',
  },
  {
    num: '02',
    title: 'Correlate',
    desc: 'Cross-reference multiple independent signals against a rolling time window to find joint anomalies.',
  },
  {
    num: '03',
    title: 'Retrieve (Qdrant)',
    desc: 'Hybrid semantic+lexical search across 9,200 historical records to find precedent for the pattern.',
  },
  {
    num: '04',
    title: 'Reason',
    desc: 'Compound-risk score fuses live signals + historical boost — explainable as N factors, not a black box.',
  },
  {
    num: '05',
    title: 'Explain',
    desc: 'Summarise evidence in one spoken sentence: state → evidence → ask. Evidence-first, never a bare score.',
  },
  {
    num: '06',
    title: 'Act (human-auth)',
    desc: 'Response Orchestrator calls tools only after explicit voice authorisation from the officer.',
  },
  {
    num: '07',
    title: 'Verify + Learn',
    desc: 'Confirmed outcome + officer debrief is embedded into Qdrant — next detection benefits immediately.',
  },
]

export default function HowVigilReasons() {
  return (
    <section id="capabilities" className="section bg-bg-secondary">
      <div className="container">
        {/* Header */}
        <div className="mb-14">
          <div className="font-mono text-[0.65rem] tracking-[0.16em] uppercase text-accent mb-6">
            AGENTIC REASONING PIPELINE
          </div>
          <h2 className="font-heading text-[clamp(2.5rem,4vw,4rem)] text-text-primary leading-none">
            How NOVA <span className="text-accent">Reasons</span>
          </h2>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {STEPS.map((step) => (
            <StepCard key={step.num} {...step} />
          ))}
        </div>

        {/* Pipeline flow diagram */}
        <div className="mt-10">

          <PipelineDiagram />
        </div>

      </div>
    </section>
  )
}

function StepCard({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="bg-bg-secondary p-10 transition-all duration-250 relative overflow-hidden group hover:bg-card-bg hover:border-l-2 hover:border-accent">
      {/* Number watermark */}
      <div className="absolute -top-2 right-3 font-heading text-6xl text-accent opacity-5 leading-none select-none">
        {num}
      </div>

      {/* Step number badge */}
      <div className="font-mono text-[0.62rem] font-bold tracking-widest text-accent mb-2">
        {num}
      </div>

      {/* Title */}
      <h3 className="font-heading text-2xl text-text-primary mb-3 ml-2">
        {title}
      </h3>

      {/* Desc */}
      <p className="font-body text-[0.78rem] font-light text-text-secondary leading-relaxed">
        {desc}
      </p>
    </div>
  )
}

/* ─── Horizontal pipeline flow ───────────────────────────────────── */
function PipelineDiagram() {
  const nodes = ['Sensor/Event Intelligence', 'Operational Context', 'Risk Reasoner', 'Policy Engine', 'Voice Agent', 'Orchestrator', 'Qdrant Memory']

  return (
    <div className="pt-4 backdrop-blur-md">
      <div className="font-mono text-[0.8rem] tracking-widest text-text-muted mb-5 p-8 Suppercase">
        AGENT PIPELINE — 5 agents, not agent soup
      </div>

      <div className="flex items-center flex-wrap gap-4 overflow-x-auto pb-2 pt-2">
        {nodes.map((n, i) => (
          <div key={n} className="flex items-center shrink-0">
            <div className="px-3.5 py-1.5 border border-accent bg-accent/5 font-mono text-[0.65rem] font-semibold text-accent whitespace-nowrap tracking-wide transition-colors duration-200 hover:bg-accent/15">
              {n}
            </div>
            {i < nodes.length - 1 && (
              <div className="w-7 h-px bg-gradient-to-r from-accent to-transparent shrink-0 relative">
                <span className="absolute -right-1 -top-1.25 text-accent text-[0.65rem]">▸</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
