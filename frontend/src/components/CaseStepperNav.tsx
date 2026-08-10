import React from 'react'
import { Link } from 'react-router-dom'
import { useCaseStore } from '../store/useCaseStore'
import type { PipelineStage } from '../store/useCaseStore'

interface CaseStepperNavProps {
  caseId: string
  currentStage: PipelineStage | null
  reachedStages: PipelineStage[]
  hasPendingAuth?: boolean
}

const STAGES: { id: PipelineStage; label: string }[] = [
  { id: 'signals', label: 'Signals' },
  { id: 'retrieval', label: 'Retrieval' },
  { id: 'voice', label: 'Voice' },
  { id: 'confirm', label: 'Confirm' },
  { id: 'audit', label: 'Audit' },
  { id: 'memory', label: 'Memory' },
]

export function CaseStepperNav({ caseId, currentStage, reachedStages }: CaseStepperNavProps) {
  const hasPendingAuth = useCaseStore(s => s.hasPendingAuth)
  const activeCase = useCaseStore((s) => s.activeCase)
  const connectionStatus = useCaseStore((s) => s.connectionStatus)

  const zoneId = activeCase?.zone_id || 'Unknown'
  const caseIdDisplay = activeCase?.case_id || caseId
  const tier = activeCase?.risk_tier || 'low'

  const getTierClass = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'low': return 'tier-low'
      case 'medium': return 'tier-medium'
      case 'high': return 'tier-high'
      case 'critical': return 'tier-critical'
      default: return 'tier-low'
    }
  }

  const getTierBgClass = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'low': return 'tier-low-bg'
      case 'medium': return 'tier-medium-bg'
      case 'high': return 'tier-high-bg'
      case 'critical': return 'tier-critical-bg'
      default: return 'tier-low-bg'
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-nova-border bg-nova-bg">
        <div className="flex items-center space-x-2 text-nova-text-secondary text-sm">
          <span className="font-semibold text-nova-text-primary">NOVA</span>
          <span>&middot;</span>
          <span>Bay {zoneId}</span>
          <span>&middot;</span>
          <span>Case {caseIdDisplay}</span>
          <span>&middot;</span>
          <span className={`px-2 py-0.5 rounded-sm uppercase text-xs font-bold ${getTierClass(tier)} ${getTierBgClass(tier)}`}>
            {tier}
          </span>
        </div>
      </div>
      
      <div className="flex items-center px-4 bg-nova-surface relative">
        <div className="flex items-center space-x-2 w-full">
          {STAGES.map((stage) => {
            const isCurrent = stage.id === currentStage
            const isReached = reachedStages.includes(stage.id)

            const linkStyles = `
              px-4 py-2.5 flex items-center justify-center transition-all duration-200
              ${isCurrent ? 'opacity-100 font-display font-medium border-b-2 border-voice-active text-nova-text-primary' : ''}
              ${isReached && !isCurrent ? 'opacity-100 cursor-pointer text-nova-text-secondary hover:text-nova-text-primary' : ''}
              ${!isReached && !isCurrent ? 'opacity-35 pointer-events-none text-nova-text-muted' : ''}
            `

            if (isReached && !isCurrent) {
              return (
                <Link key={stage.id} to={`/case/${caseId}/${stage.id}`} className={linkStyles}>
                  {stage.label}
                  {stage.id === 'confirm' && hasPendingAuth && (
                    <span className="ml-2 w-2 h-2 rounded-full bg-tier-critical animate-pulse" />
                  )}
                </Link>
              )
            }

            return (
              <div key={stage.id} className={linkStyles}>
                {stage.label}
                {stage.id === 'confirm' && hasPendingAuth && (
                  <span className="ml-2 w-2 h-2 rounded-full bg-tier-critical animate-pulse" />
                )}
              </div>
            )
          })}
        </div>

        {connectionStatus === 'connected' && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-1.5 px-2 py-1 bg-voice-active-bg rounded-sm border border-voice-active/20">
            <div className="w-1.5 h-1.5 rounded-full bg-voice-active animate-pulse" />
            <span className="text-[10px] font-bold tracking-wider text-voice-active uppercase">LIVE</span>
          </div>
        )}
      </div>
    </div>
  )
}
