import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
const links = [
	{ label: 'Inicio', href: '/' },
	{ label: 'Nosotros', href: '/#Nosotros' },
	{ label: 'Proyectos', href: '/proyectos' },
	{ label: 'Contacto', href: '/contacto' },
	{ label: 'Ingresar', href: '/login' },
]
function LayoutPublico() {
  const location = useLocation()

  // Forzamos el estilo oscuro de la navbar cuando se visite /login
  // También podríamos forzarlo en otras pantallas si hace falta
  const isLoginPage = location.pathname === '/login'

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar forceScrolled={isLoginPage} links={links} />

      <main className="flex-grow-1">
        <Outlet />
      </main>

      <Footer />
      
      {/* Al cambiar de página, vuelve el scroll arriba (como un sitio tradicional) */}
      <ScrollRestoration />
    </div>
  )
}

export default LayoutPublico
