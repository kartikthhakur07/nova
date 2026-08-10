import React, { useEffect, useState } from 'react'
import { getBenchmarkResults } from '../services/api'
import { MetricCard } from '../components/MetricCard'

export default function Benchmark() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getBenchmarkResults()
      .then(res => setResults(res))
      .catch(e => {
        console.error('Benchmark load error:', e)
        setResults(null)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-nova-text-muted">Loading benchmark data...</div>

  if (!results) {
    return (
      <div className="min-h-screen bg-nova-bg p-8 flex flex-col items-center justify-center">
        <div className="max-w-lg text-center bg-nova-surface border border-nova-border p-8 rounded-lg">
          <h2 className="text-xl font-display text-nova-text-primary mb-4">Benchmark not yet run</h2>
          <p className="text-nova-text-secondary mb-4">Run the benchmark pipeline to generate results.json.</p>
          <pre className="mono text-sm bg-nova-bg p-4 rounded-md text-left overflow-x-auto text-nova-text-muted">
            python -m evaluation.benchmark_runner
          </pre>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-nova-bg p-8 pb-16">
      <h1 className="font-display text-3xl mb-8 text-nova-text-primary">Performance Benchmark</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Object.entries(results).map(([key, val]: [string, any]) => {
          if (typeof val === 'number') {
            return <MetricCard key={key} name={key.replace(/_/g, ' ')} value={val.toFixed(3)} />
          }
          return <MetricCard key={key} name={key.replace(/_/g, ' ')} value={String(val)} />
        })}
      </div>
    </div>
  )
}
