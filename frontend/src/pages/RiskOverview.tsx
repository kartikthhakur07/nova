import Navbar from '../components/Navbar'
import HeroSection from '../components/HeroSection'
import SignalTicker from '../components/SignalTicker'
import StatsBar from '../components/StatsBar'
import InfraSection from '../components/InfraSection'
import HowVigilReasons from '../components/HowVigilReasons'
import PlantMapSection from '../components/PlantMapSection'
import Footer from '../components/Footer'

export default function RiskOverview() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <HeroSection />
      <SignalTicker />
      <StatsBar />
      <InfraSection />
      <HowVigilReasons />
      <PlantMapSection />
      <Footer />
    </div>
  )
}
