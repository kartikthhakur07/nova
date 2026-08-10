import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DemoMode from './pages/DemoMode'
import RealSystemSimulation from './pages/RealSystemSimulation'
import ConvergingSignals from './pages/ConvergingSignals'
import RetrievalTrace from './pages/QuadRetreival'
import Auth from './pages/Auth'
import AuditTrail from './pages/AuditTrail'
import Lessons from './pages/Lessons'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/demo" element={<DemoMode />} />
      <Route path="/simulation" element={<RealSystemSimulation />} />
      <Route path="/voice-interaction" element={<DemoMode />} />
      <Route path="/live-call" element={<DemoMode />} />
      <Route path="/signals" element={<ConvergingSignals />} />
      <Route path="/retrieval-trace" element={<RetrievalTrace />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/audit-trail" element={<AuditTrail />} />
      <Route path="/Lessons" element={<Lessons />} />
    </Routes>
  )
}
