import React, { useEffect } from 'react'
import ScrollReveal from 'scrollreveal'
import notebook from '../../assets/landing/Notebook.webm'

export default function Recursos() {
  useEffect(() => {
    const sr = ScrollReveal({ reset: true })
    sr.reveal('.notebook-efeito', { duration: 2000, distance: '90px', origin: 'left' })
    sr.reveal('.Recursos-efeito', { duration: 2000, distance: '90px', delay: 700, origin: 'right' })
    return () => sr.destroy()
  }, [])

  return (
    <section id="recursos" className="recursos">
      <div className="interface">
        <div className="card-recursos">
          <div className="notebook-wrapper notebook-efeito">
            <video autoPlay muted loop playsInline className="notebook-video">
              <source src={notebook} type="video/webm" />
              O teu navegador não suporta vídeos.
            </video>
          </div>
          <div className="Recursos Recursos-efeito">
            <h1>Recursos:</h1>
            <p>✔ Calendário de Reservas e Eventos</p>
            <p>✔ Mural de Avisos em Tempo Real</p>
            <p>✔ Gestão de Ocorrências e Chamados</p>
            <p>✔ Acesso Multiplataforma</p>
          </div>
        </div>
      </div>
    </section>
  )
}
