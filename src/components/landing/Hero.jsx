import React, { useEffect } from 'react'
import ScrollReveal from 'scrollreveal'

export default function Hero() {
  useEffect(() => {
    const sr = ScrollReveal({ reset: true })
    sr.reveal('.txt-efeito', { duration: 2000, distance: '90px' })
    return () => sr.destroy()
  }, [])

  return (
    <section id="inicio" className="hero">
      <div className="interface">
        <div className="img-hero" />
        <div className="txt-hero txt-efeito">
          <h1>DOMUS</h1>
          <h2>O SEU CONDOMÍNIO NA PALMA DA SUA MÃO!</h2>
          <p>
            Baixe agora o app para facilitar a vida de síndicos e moradores.
            Gestão, comunicação, e segurança em um só lugar.
          </p>
          <div className="hero-downloads">
            <a href="#"><button type="button">Download-mobile</button></a>
            <a href="#"><button type="button">Download-desktop</button></a>
          </div>
        </div>
      </div>
    </section>
  )
}
