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


import { SystemStatusBar } from './components/SystemStatusBar'

// ── CaseLayout ────────────────────────────────────────────────────────── //

function CaseLayout() {
  const { id: caseId = '' } = useParams<{ id: string }>()
  const currentStage = useCaseStore((s) => s.currentStage)
  const reachedStagesSet = useCaseStore((s) => s.reachedStages)
  const reachedStages = Array.from(reachedStagesSet) as import('./store/useCaseStore').PipelineStage[]

  // Fetch case on mount
  useCaseState(caseId)

  // Connect WebSocket for this case session
  useSessionSocket(caseId)

  // The instructions said to use CaseStepperNav + Outlet
  // If case not found: show a simple "Case not found" message
  const activeCase = useCaseStore(s => s.activeCase)

  // To prevent flash of "Case not found", we should probably handle loading, but keeping it simple as requested.
  // Actually, useCaseState handles it.

  if (!activeCase) {
    return <div className="p-8 text-gray-300">Case not found or loading...</div>
  }

  return (
    <div className="flex flex-col min-h-screen bg-nova-bg pb-8">
      <CaseStepperNav caseId={caseId} currentStage={currentStage} reachedStages={reachedStages} />
      <main className="flex-1">
        <Outlet />
      </main>
      <SystemStatusBar />
    </div>
  )
}

// ── Router ────────────────────────────────────────────────────────────── //
import RiskOverview from './pages/RiskOverview'
import DemoControl from './pages/DemoControl'
import Benchmark from './pages/Benchmark'
import ConvergingSignals from './pages/ConvergingSignals'
import RetrievalTrace from './pages/RetrievalTrace'
import VoiceInteraction from './pages/VoiceInteraction'
import Confirmation from './pages/Confirmation'
import AuditTrail from './pages/AuditTrail'
import LessonsLearned from './pages/LessonsLearned'
import { useCaseState } from './hooks/useCaseState'

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
    path: '/benchmark',
    element: <Benchmark />,
  },
  {
    path: '/case/:id',
    element: <CaseLayout />,
    children: [
      { index: true,       element: <RiskOverview /> },
      { path: 'signals',   element: <ConvergingSignals /> },
      { path: 'retrieval', element: <RetrievalTrace /> },
      { path: 'voice',     element: <VoiceInteraction /> },
      { path: 'confirm',   element: <Confirmation /> },
      { path: 'audit',     element: <AuditTrail /> },
      { path: 'memory',    element: <LessonsLearned /> },
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
import { useEffect } from 'react'

function GlobalShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        window.location.href = '/demo'
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
  return null
}

export default function App() {
  return (
    <ErrorBoundary>
      <GlobalShortcuts />
      <RouterProvider router={router} />
    </ErrorBoundary>
  )
}
