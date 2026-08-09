import { useCaseStore } from '../store/useCaseStore'

export default function Benchmark() {
  const { activeCase, currentStage } = useCaseStore()
  return (
    <div className="p-6 text-sm font-mono opacity-60">
      [Benchmark] case={activeCase?.case_id ?? 'none'} stage={currentStage ?? 'none'}
    </div>
  )
}
