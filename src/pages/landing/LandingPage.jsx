import Header from '../../components/landing/Header.jsx'
import Hero from '../../components/landing/Hero.jsx'
import Beneficios from '../../components/landing/Beneficios.jsx'
import Recursos from '../../components/landing/Recursos.jsx'
import Footer from '../../components/landing/Footer.jsx'
import SplashScreen from '../../components/landing/SplashScreen.jsx'
import './landing.css'

export default function LandingPage() {
  return (
    <div className="landing-page">
      <SplashScreen />
      <Header />
      <main>
        <Footer />
        <Hero />
        <Beneficios />
        <Recursos />
      </main>
    </div>
  )
}
