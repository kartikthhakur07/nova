/**
 * frontend/src/App.tsx
 *
 * React Router v6 application root with NOVA Agent-Piloted Architecture.
 */
import React, { useEffect } from 'react'
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useParams,
} from 'react-router-dom'
import { CaseStepperNav } from './components/CaseStepperNav'
import { useCaseStore } from './store/useCaseStore'
import { useSessionSocket } from './ws/useSessionSocket'
import { useCaseState } from './hooks/useCaseState'

import { SystemStatusBar } from './components/SystemStatusBar'
import HomePage from './pages/HomePage'
import DemoMode from './pages/DemoMode'
import RealSystemSimulation from './pages/RealSystemSimulation'
import AppShell from './components/AppShell'
import MissionControl from './pages/MissionControl'
import DemoControl from './pages/DemoControl'
import Benchmark from './pages/Benchmark'
import AuditTrail from './pages/AuditTrail'
import LessonsLearned from './pages/LessonsLearned'
import MemoryBrowser from './pages/MemoryBrowser'
import Factory3DTwin from './pages/Factory3DTwin'
import NovaCoPilot from './pages/FridayCoPilot'
import SensorTelemetry from './pages/SensorTelemetry'
import TabLivePlant from './pages/TabLivePlant'
import TabActiveCase from './pages/TabActiveCase'
import TabCounterfactual from './pages/TabCounterfactual'
import TabMemoryReports from './pages/TabMemoryReports'

function CaseLayout() {
  const { id: caseId = '' } = useParams<{ id: string }>()
  const currentStage = useCaseStore((s) => s.currentStage)
  const reachedStagesSet = useCaseStore((s) => s.reachedStages)
  const reachedStages = Array.from(reachedStagesSet) as import('./store/useCaseStore').PipelineStage[]

  useCaseState(caseId)
  useSessionSocket(caseId)

  const activeCase = useCaseStore(s => s.activeCase)

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

const router = createBrowserRouter([
  // ── Primary Live System Simulation Route ──
  {
    path: '/',
    element: <RealSystemSimulation />,
  },
  {
    path: '/demo',
    element: <RealSystemSimulation />,
  },
  {
    path: '/simulation',
    element: <RealSystemSimulation />,
  },
  // ── Dashboard shell ──
  {
    path: '/dashboard',
    element: <AppShell />,
    children: [
      { index: true,          element: <MissionControl /> },
      { path: 'factory-twin', element: <Factory3DTwin /> },
      { path: 'nova',         element: <NovaCoPilot /> },
      { path: 'telemetry',    element: <SensorTelemetry /> },
      { path: 'audit',        element: <AuditTrail /> },
      { path: 'lessons',      element: <LessonsLearned /> },
      { path: 'memory',       element: <MemoryBrowser /> },
      { path: 'benchmark',    element: <Benchmark /> },
      { path: 'live-plant',   element: <TabLivePlant /> },
      { path: 'active-case',  element: <TabActiveCase /> },
      { path: 'counterfactual', element: <TabCounterfactual /> },
      { path: 'reports',      element: <TabMemoryReports /> },
    ],
  },
  // ── Legacy case routes ──
  {
    path: '/case/:id',
    element: <CaseLayout />,
    children: [
      { index: true,       element: <MissionControl /> },
      { path: 'audit',     element: <AuditTrail /> },
      { path: 'memory',    element: <LessonsLearned /> },
    ],
  },
])

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
