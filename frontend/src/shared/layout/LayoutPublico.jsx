import { useState } from 'react'
import { Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router-dom'
import Navbar from './NavBar'
import Footer from './Footer'
import { cerrarSesion, obtenerSesion } from '../../features/login'
const links = [
	{ label: 'Inicio', href: '/' },
	{ label: 'Nosotros', href: '/#Nosotros' },
	{ label: 'Proyectos', href: '/proyectos' },
	{ label: 'Contacto', href: '/contacto' },
	{ label: 'Ingresar', href: '/login' },
]
function LayoutPublico() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const [sesion, setSesion] = useState(obtenerSesion)

  const handleCerrarSesion = () => {
    cerrarSesion()
    setSesion(null)
    navigate('/login')
  }

  // Forzamos el estilo oscuro de la navbar cuando se visite /login
  // También podríamos forzarlo en otras pantallas si hace falta
  const isLoginPage = location.pathname === '/login' || (location.pathname === '/principal' && !sesion)

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar forceScrolled={isLoginPage} links={links} />

      <main className="flex-grow-1">
        <Outlet context={{ sesion, setSesion, handleCerrarSesion }} />
      </main>

      <Footer />
      
      {/* Al cambiar de página, vuelve el scroll arriba (como un sitio tradicional) */}
      <ScrollRestoration />
    </div>
  )
}

export default LayoutPublico
