import React, { useEffect } from 'react'
import ScrollReveal from 'scrollreveal'
import smartphone from '../../assets/landing/Smartphone.webm'
import sindicos from '../../assets/landing/sindicos.png'
import moradores from '../../assets/landing/moradores.png'

export default function Beneficios() {
  useEffect(() => {
    const sr = ScrollReveal({ reset: true })
    sr.reveal('.Sindicos', { duration: 2000, distance: '90px' })
    sr.reveal('.Moradores', { duration: 2000, distance: '90px', delay: 400 })
    sr.reveal('.video-wrapper-efeito', { duration: 2000, distance: '90px', delay: 700, origin: 'right' })
    return () => sr.destroy()
  }, [])

  return (
    <section id="beneficios" className="beneficios">
      <div className="interface">
        <div className="card-beneficios beneficios-efeito">
          <div className="Sindicos">
            <img src={sindicos} alt="Ícone Síndicos" />
            <h1>Beneficios para Sindicos</h1>
            <p>• Gestão Centralizada de Chamados</p>
            <p>• Comunicação Direta e Oficial</p>
            <p>• Transparência e Organização</p>
          </div>
          <div className="Moradores">
            <img src={moradores} alt="Ícone Moradores" />
            <h1>Vantagens para Moradores</h1>
            <p>• Reservas de Áreas Comuns</p>
            <p>• Avisos na Palma da Mão</p>
            <p>• Abertura de Chamados Prática</p>
          </div>
          <div className="video-wrapper video-wrapper-efeito">
            <video autoPlay muted loop playsInline className="side-video">
              <source src={smartphone} type="video/webm" />
              O teu navegador não suporta vídeos.
            </video>
          </div>
        </div>
      </div>
    </section>
  )
}
