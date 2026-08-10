import React, { useEffect, useState } from 'react'
import { getMemoryCollection } from '../services/api'
import { CollectionTabs } from '../components/CollectionTabs'
import { RecordGrid } from '../components/RecordGrid'

export default function MemoryBrowser() {
  const [activeTab, setActiveTab] = useState('lessons_learned')
  const [records, setRecords] = useState<any[]>([])
  const [filter, setFilter] = useState('')

  useEffect(() => {
    getMemoryCollection(activeTab)
      .then(res => setRecords(res.records || []))
      .catch((e) => {
        console.error(e)
        setRecords([]) // Fallback to empty gracefully
      })
  }, [activeTab])

  return (
    <div className="min-h-screen bg-nova-bg flex flex-col pb-8">
      <div className="p-6 border-b border-nova-border bg-nova-surface mt-10">
        <div className="flex justify-between items-center max-w-7xl mx-auto w-full">
          <h1 className="font-display text-2xl text-nova-text-primary">Organizational Memory</h1>
          <input 
            type="text" 
            placeholder="Filter records..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-nova-bg border border-nova-border text-nova-text-primary rounded-radius text-sm focus:outline-none focus:border-voice-active mono"
          />
        </div>
      </div>
      <div className="max-w-7xl mx-auto w-full">
        <CollectionTabs activeTab={activeTab} onSelect={setActiveTab} />
        <div className="p-4 mt-4">
          <RecordGrid records={records} filter={filter} />
        </div>
      </div>
    </div>
  )
}
