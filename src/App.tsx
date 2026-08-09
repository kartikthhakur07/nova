import { Routes, Route } from 'react-router-dom'
import RiskOverview from './pages/RiskOverview'
import ConvergingSignals from './pages/ConvergingSignals'
import RetrievalTrace from './pages/QuadRetreival'
import VoiceInteraction from './pages/LiveInteraction'
import Auth from './pages/Auth'
import AuditTrail from './pages/AuditTrail'
import Lessons from './pages/Lessons'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RiskOverview />} />
      <Route path="/signals" element={<ConvergingSignals />} />
      <Route path="/retrieval-trace" element={<RetrievalTrace />} />
      <Route path="/voice-interaction" element={<VoiceInteraction />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/audit-trail" element={<AuditTrail />} />
      <Route path="/Lessons" element={<Lessons />} />
    </Routes>
  )
}
