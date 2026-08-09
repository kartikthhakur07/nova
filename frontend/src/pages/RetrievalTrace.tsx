import { useCaseStore } from '../store/useCaseStore'

export default function RetrievalTrace() {
  const { activeCase, currentStage } = useCaseStore()
  return (
    <div className="p-6 text-sm font-mono opacity-60">
      [RetrievalTrace] case={activeCase?.case_id ?? 'none'} stage={currentStage ?? 'none'}
    </div>
  )
}
