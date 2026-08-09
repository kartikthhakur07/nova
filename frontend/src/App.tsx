/**
 * frontend/src/App.tsx
 *
 * React Router v6 application root.
 *
 * Routes
 * ──────
 *  /                    → RiskOverview  (placeholder — Saishree)
 *  /demo                → DemoControl   (placeholder — Kartik)
 *  /case/:id            → CaseLayout (nested)
 *    /case/:id/signals    → placeholder
 *    /case/:id/retrieval  → placeholder
 *    /case/:id/voice      → placeholder
 *    /case/:id/confirm    → placeholder
 *    /case/:id/audit      → placeholder
 *    /case/:id/memory     → placeholder
 *
 * Global ErrorBoundary wraps RouterProvider.
 */
import React from 'react'
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useParams,
} from 'react-router-dom'
import { CaseStepperNav } from './components/CaseStepperNav'
import { useCaseStore } from './store/useCaseStore'
import { useSessionSocket } from './ws/useSessionSocket'
import type { PipelineStage } from './types/api'

// ── Placeholders (Saishree / Kartik own the real implementations) ─────── //

function RiskOverview() {
  return (
    <div className="p-8 text-gray-300">
      Risk Overview — coming from Saishree
    </div>
  )
}

function DemoControl() {
  return (
    <div className="p-8 text-gray-300">
      Demo Control — coming from Kartik
    </div>
  )
}

// ── Stage placeholder factory ─────────────────────────────────────────── //

function StagePlaceholder({ stage }: { stage: PipelineStage }) {
  return (
    <div className="p-8 text-gray-400 text-sm">
      <span className="font-mono text-blue-400">{stage}</span> panel — coming soon
    </div>
  )
}

// ── CaseLayout ────────────────────────────────────────────────────────── //

const ORDERED_STAGES: Array<PipelineStage | 'overview'> = [
  'overview',
  'signals',
  'retrieval',
  'voice',
  'confirm',
  'audit',
  'memory',
]

function CaseLayout() {
  const { id: caseId = '' } = useParams<{ id: string }>()
  const currentStage = useCaseStore((s) => s.currentStage)

  // Connect WebSocket for this case session
  useSessionSocket(caseId)

  // Build reachedStages: everything up to and including currentStage
  const reachedStages = React.useMemo<Set<PipelineStage | 'overview'>>(() => {
    const reached = new Set<PipelineStage | 'overview'>(['overview'])
    if (currentStage === null) return reached
    for (const stage of ORDERED_STAGES) {
      reached.add(stage)
      if (stage === currentStage) break
    }
    return reached
  }, [currentStage])

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <CaseStepperNav currentStage={currentStage} reachedStages={reachedStages} />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

// ── Router ────────────────────────────────────────────────────────────── //

const router = createBrowserRouter([
  {
    path: '/',
    element: <RiskOverview />,
  },
  {
    path: '/demo',
    element: <DemoControl />,
  },
  {
    path: '/case/:id',
    element: <CaseLayout />,
    children: [
      { path: 'signals',   element: <StagePlaceholder stage="signals"   /> },
      { path: 'retrieval', element: <StagePlaceholder stage="retrieval" /> },
      { path: 'voice',     element: <StagePlaceholder stage="voice"     /> },
      { path: 'confirm',   element: <StagePlaceholder stage="confirm"   /> },
      { path: 'audit',     element: <StagePlaceholder stage="audit"     /> },
      { path: 'memory',    element: <StagePlaceholder stage="memory"    /> },
    ],
  },
])

// ── ErrorBoundary ─────────────────────────────────────────────────────── //

interface ErrorBoundaryState {
  hasError: boolean
  message: string
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-red-400">
          <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
          <pre className="text-sm text-gray-400">{this.state.message}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

// ── App root ──────────────────────────────────────────────────────────── //

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  )
}
