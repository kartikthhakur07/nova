import { useCaseStore } from '../store/useCaseStore'

export default function LessonsLearned() {
  const { activeCase, currentStage } = useCaseStore()
  return (
    <div className="p-6 text-sm font-mono opacity-60">
      [LessonsLearned] case={activeCase?.case_id ?? 'none'} stage={currentStage ?? 'none'}
    </div>
  )
}
