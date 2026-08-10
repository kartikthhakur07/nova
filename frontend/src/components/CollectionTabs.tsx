import React from 'react'

const TABS = [
  'incidents_historical', 'near_misses', 'maintenance_history',
  'safety_procedures', 'equipment_context', 'risk_patterns',
  'lessons_learned', 'active_case_memory'
]

export function CollectionTabs({ activeTab, onSelect }: { activeTab: string, onSelect: (t: string) => void }) {
  return (
    <div className="flex overflow-x-auto border-b border-nova-border space-x-4 px-4 pb-0 scrollbar-hide">
      {TABS.map(tab => (
        <button
          key={tab}
          onClick={() => onSelect(tab)}
          className={`py-3 px-1 border-b-2 text-sm whitespace-nowrap capitalize ${
            activeTab === tab 
              ? 'border-voice-active text-nova-text-primary font-medium' 
              : 'border-transparent text-nova-text-muted hover:text-nova-text-secondary'
          }`}
        >
          {tab.replace(/_/g, ' ')}
        </button>
      ))}
    </div>
  )
}
