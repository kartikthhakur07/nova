/**
 * frontend/src/hooks/useCaseState.ts
 *
 * Fetches a single case from the REST API on mount / caseId change,
 * writes it to the Zustand store, and exposes loading/error state.
 */
import { useEffect, useState } from 'react'
import { getCase } from '../services/api'
import { useCaseStore } from '../store/useCaseStore'
import type { Case, PipelineStage } from '../types/api'

interface UseCaseStateResult {
  activeCase: Case | null
  stage: PipelineStage | null
  isLoading: boolean
  error: string | null
}

export function useCaseState(caseId: string): UseCaseStateResult {
  const setActiveCase = useCaseStore((s) => s.setActiveCase)
  const activeCase = useCaseStore((s) => s.activeCase)
  const currentStage = useCaseStore((s) => s.currentStage)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    getCase(caseId)
      .then((c) => {
        if (!cancelled) {
          setActiveCase(c)
          setIsLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [caseId, setActiveCase])

  return {
    activeCase,
    stage: currentStage,
    isLoading,
    error,
  }
}
