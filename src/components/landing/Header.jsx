import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import contato from '../../assets/landing/contato.png'
import logo from '../../assets/landing/logo.png'

export default function Header() {
  const [rolagem, setRolagem] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => setRolagem(window.scrollY > 0)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const fecharMenu = () => setMenuAberto(false)

  return (
    <header id="header" className={rolagem ? 'rolagem' : ''}>
      <div className="interface">
        <section className="logotipo-cabecalho">
          <a href="#inicio" aria-label="DOMUS - Inicio"><img src={logo} alt="Logo" /></a>
        </section>

        <nav className="menu-desktop">
          <ul>
            <li><a href="#inicio">Inicio</a></li>
            <li><a href="#beneficios">Beneficios</a></li>
            <li><a href="#recursos">Recursos</a></li>
          </ul>
        </nav>

        <div className="btn">
          <ul>
            <li><button className="btn-entrar" type="button" onClick={() => navigate('/login')}>Entrar</button></li>
            <li><button className="btn-cadastre-se" type="button" onClick={() => navigate('/first-steps')}>Cadastre-se</button></li>
            <li><button className="btn-contato" type="button" aria-label="Contato"><img src={contato} alt="Contato" /></button></li>
          </ul>
        </div>

        <button type="button" className="btn-abrir-menu" onClick={() => setMenuAberto(true)} aria-label="Abrir menu">☰</button>

        <div className={`menu-mobile ${menuAberto ? 'abrir-menu' : ''}`}>
          <button type="button" className="btn-fechar" onClick={fecharMenu} aria-label="Fechar menu">✕</button>
          <nav>
            <ul>
              <li><a href="#inicio" onClick={fecharMenu}>Inicio</a></li>
              <li><a href="#beneficios" onClick={fecharMenu}>Beneficios</a></li>
              <li><a href="#recursos" onClick={fecharMenu}>Recursos</a></li>
              <li><button type="button" onClick={() => navigate('/login')}>Entrar</button></li>
              <li><button type="button" onClick={() => navigate('/first-steps')}>Cadastre-se</button></li>
              <li><button type="button">Contato</button></li>
            </ul>
          </nav>
        </div>
        {menuAberto && <div className="overlay-menu" onClick={fecharMenu} />}
      </div>
    </header>
  )
}
