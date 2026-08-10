import React from 'react'

export function LessonJustCreatedBanner({ lesson }: { lesson: any }) {
  if (!lesson) return null
  return (
    <div className="p-4 bg-tier-low-bg border border-tier-low mb-6 rounded-radius flex flex-col space-y-2">
      <div className="flex items-center text-tier-low font-bold">
        <span className="mr-2">✓</span> Lesson learned written to memory
      </div>
      <div className="text-nova-text-primary text-sm font-medium">{lesson.title || lesson.summary}</div>
      {lesson.contributing_factors && (
        <div className="flex space-x-2">
          {lesson.contributing_factors.map((f: string) => (
            <span key={f} className="px-2 py-1 bg-nova-surface border border-nova-border text-xs text-nova-text-muted rounded-radius-sm">
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
