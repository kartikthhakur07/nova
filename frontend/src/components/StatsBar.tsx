import { useEffect, useState } from 'react'

const STATS = [
  { label: 'Live Pipeline Snapshots', value: 1284, suffix: '', mono: true },
  { label: 'Avg. First-Audio Latency', value: 1.8, suffix: 's', mono: true },
  { label: 'Cases Resolved Today', value: 54, suffix: '', mono: true },
  { label: 'Historical Records in Qdrant', value: 9_200, suffix: '+', mono: true },
  { label: 'False Positive Rate', value: 2.3, suffix: '%', mono: true },
  { label: 'Detection Window', value: 5, suffix: 'min avg', mono: true },
]

function useCountUp(target: number, duration = 1800) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start: number
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setVal(parseFloat((target * p).toFixed(target % 1 !== 0 ? 1 : 0)))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return val
}

function StatItem({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  const display = useCountUp(value)
  const formatted = value >= 1000 ? display.toLocaleString() : display.toString()

  return (
    <div className="text-center p-6 border border-[var(--border)] flex-1 min-w-[140px] transition-colors duration-300 cursor-default bg-card-bg backdrop-blur-md hover:border-accent hover:bg-accent/5">
      <div className="stat-number text-3xl font-bold text-accent">
        {formatted}{suffix}
      </div>
      <div className="font-body text-[0.65rem] font-light tracking-widest uppercase text-text-muted mt-1.5">
        {label}
      </div>
    </div>
  )
}

export default function StatsBar() {
  return (
    <section className="bg-bg-secondary py-10">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-[var(--border)]">
          {STATS.map(s => (
            <StatItem key={s.label} {...s} />
          ))}
        </div>
      </div>
    </section>
  )
}
