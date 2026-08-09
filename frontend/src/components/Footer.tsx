export default function Footer() {
  return (
    <footer id="contact" className="bg-bg-secondary border-t border-[var(--border)] pt-16 pb-8 mt-24">
      <div className="container">
        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12 pb-12 border-b border-[var(--border)]">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="font-heading text-2xl text-text-primary mb-3 tracking-wider">
              NOVA
            </div>
            <p className="font-body text-[0.78rem] font-light text-text-muted leading-relaxed max-w-[280px]">
              AI-powered compound-risk intelligence for industrial safety. Trained on silence by design, speaks when it matters.
            </p>
            <div className="mt-5 flex gap-3 flex-wrap">
              {['Rime', 'Qdrant', 'React', 'Zustand'].map(tech => (
                <span
                  key={tech}
                  className="font-mono text-[0.6rem] px-2.5 py-1 border border-[var(--border)] text-text-muted tracking-wider"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Product links */}
          <div>
            <div className="font-body text-[0.7rem] font-bold tracking-widest uppercase text-text-muted mb-4">
              Product
            </div>
            {['Risk Overview', 'Converging Signals', 'Retrieval Trace', 'Voice Interaction', 'Use Cases'].map(l => (
              <div key={l} className="mb-2.5">
                <a
                  href="#"
                  className="font-body text-xs font-normal text-text-secondary no-underline transition-colors duration-200 hover:text-accent"
                >
                  {l}
                </a>
              </div>
            ))}
          </div>

          {/* Pipeline */}
          <div>
            <div className="font-body text-[0.7rem] font-bold tracking-widest uppercase text-text-muted mb-4">
              Pipeline
            </div>
            {['Detect / Correlate', 'Retrieve (Qdrant)', 'Reason + Explain', 'Act (human-auth)', 'Verify + Learn'].map(l => (
              <div key={l} className="mb-2.5">
                <a
                  href="#"
                  className="font-body text-xs font-normal text-text-secondary no-underline transition-colors duration-200 hover:text-accent"
                >
                  {l}
                </a>
              </div>
            ))}
          </div>

          {/* Trust & Audit */}
          <div>
            <div className="font-body text-[0.7rem] font-bold tracking-widest uppercase text-text-muted mb-4">
              Trust & Audit
            </div>
            {['Audit Logs', 'Our Mission', 'Terms & Rights'].map(l => (
              <div key={l} className="mb-2.5">
                <a
                  href="#"
                  className="font-body text-xs font-normal text-text-secondary no-underline transition-colors duration-200 hover:text-accent"
                >
                  {l}
                </a>
              </div>
            ))}

            {/* Social icons */}
            <div className="mt-6 flex gap-3">
              {['GH', 'TW', 'LI'].map(s => (
                <a
                  key={s}
                  href="#"
                  className="w-7.5 h-7.5 flex items-center justify-center border border-[var(--border)] font-mono text-[0.55rem] text-text-muted no-underline transition-colors duration-200 hover:border-accent hover:text-accent"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <span className="font-mono text-[0.6rem] text-text-muted tracking-wide">
            © 2026 NOVA · All rights reserved · StarForge Hackathon · Track 1 VoxForge
          </span>
          <div className="flex gap-2 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_var(--accent)]" />
            <span className="font-mono text-[0.6rem] text-accent tracking-widest">
              SYSTEM OPERATIONAL
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
