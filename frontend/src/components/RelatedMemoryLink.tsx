import React from 'react'
import { Link } from 'react-router-dom'

export function RelatedMemoryLink({ query }: { query: string }) {
  return (
    <div className="p-4 bg-nova-surface border border-nova-border rounded-radius mt-6">
      <p className="text-sm text-nova-text-secondary">
        This lesson may help future cases like: <span className="text-nova-text-primary font-medium">{query}</span>
      </p>
      <Link to="/memory" className="text-voice-active hover:underline text-sm font-medium mt-2 inline-block">
        View related records →
      </Link>
    </div>
  )
}
