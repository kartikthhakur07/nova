import React from 'react'
import { Link } from 'react-router-dom'

export function GlobalMemoryBrowserLink() {
  return (
    <div className="mt-8 pt-4 border-t border-nova-border text-center">
      <Link to="/memory" className="text-nova-text-muted hover:text-nova-text-primary text-sm transition-colors">
        Browse all organizational memory →
      </Link>
    </div>
  )
}
