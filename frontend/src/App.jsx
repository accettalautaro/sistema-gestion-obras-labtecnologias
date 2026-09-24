import { useEffect, useState } from 'react'
import Navbar from './shared/layout/NavBar.jsx'
import Footer from './shared/layout/Footer.jsx'
import HomePage from './features/home/pages/HomePage.jsx'
import ContactoPage from './features/contacto/pages/ContactoPage.jsx'
import LoginPage from './features/login/pages/LoginPage.jsx'
import ProyectosPage from './features/home/pages/ProyectosPage.jsx'
import ProyectoPage from './features/home/pages/ProyectoPage.jsx'
import PrincipalPage from './features/principal/pages/PrincipalPage.jsx'

function App() {
  const [location, setLocation] = useState({ pathname: window.location.pathname, hash: window.location.hash })
  const [sesion, setSesion] = useState(() => {
    const storedSession = localStorage.getItem('sesion-usuario')
    return storedSession ? JSON.parse(storedSession) : null
  })

  useEffect(() => {
    const handleLocationChange = () => {
      setLocation({ pathname: window.location.pathname, hash: window.location.hash })
      const storedSession = localStorage.getItem('sesion-usuario')
      setSesion(storedSession ? JSON.parse(storedSession) : null)
      window.scrollTo(0, 0)
    }

    window.addEventListener('hashchange', handleLocationChange)
    window.addEventListener('popstate', handleLocationChange)

    return () => {
      window.removeEventListener('hashchange', handleLocationChange)
      window.removeEventListener('popstate', handleLocationChange)
    }
  }, [])

  const isContactoPage = location.pathname === '/contacto' || location.pathname === '/contacto/' || location.hash === '#contacto'
  const isLoginPage = location.pathname === '/login' || location.pathname === '/login/' || location.hash === '#login'
  const isPrincipalPage = location.hash === '#principal'
  const isProyectosPage = location.hash === '#proyectos'
  const proyectoMatch = location.hash.match(/^#proyecto=(\d+)$/)
  const proyectoId = proyectoMatch ? Number(proyectoMatch[1]) : null

  return (
    <>
      <Navbar />
      {isContactoPage ? <ContactoPage /> : isLoginPage ? <LoginPage /> : isPrincipalPage && sesion ? <PrincipalPage usuario={sesion} onCerrarSesion={() => {
        localStorage.removeItem('sesion-usuario')
        setSesion(null)
        window.location.hash = 'login'
      }} /> : isPrincipalPage ? <LoginPage /> : isProyectosPage ? <ProyectosPage /> : proyectoId ? <ProyectoPage proyectoId={proyectoId} /> : <HomePage />}
      <Footer />
    </>
  )
}

export default App
