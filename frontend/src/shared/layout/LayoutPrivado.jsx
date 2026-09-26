import { NavLink, Outlet, ScrollRestoration, useLoaderData, useNavigate } from 'react-router-dom'
import NavbarGestor from './NavbarGestor'

const ENLACES_GESTOR = [
  { id: 1, texto: 'Inicio', destino: '/principal', disponible: true },
  { id: 2, texto: 'Productos', destino: '/principal/productos', disponible: false },
  { id: 3, texto: 'Pedidos', destino: '/principal/pedidos', disponible: false },
]

// Doble navegación: NavbarGestor (horizontal) + sidebar (vertical) + <Outlet />.
function LayoutGestor() {
  // CLASE 3 · React Router: useLoaderData devuelve lo que retornó el loader de
  // esta ruta (protegerRuta en router.jsx), en este caso el usuario logueado.
  const usuario = useLoaderData()
  const navigate = useNavigate()

  const handleCerrarSesion = () => {
    localStorage.removeItem('sesion-usuario')
    navigate('/login', { replace: true })
  }

  return (
    <div className="d-flex flex-column min-vh-100 bg-body-tertiary">
      <NavbarGestor usuario={usuario} handleCerrarSesion={handleCerrarSesion} />

      <div className="d-flex flex-grow-1">
        {/* offcanvas-lg: en escritorio es una columna fija; en móvil, un panel deslizable */}
        <aside
          className="offcanvas-lg offcanvas-start sidebar-gestor bg-white border-end"
          tabIndex="-1"
          id="menuGestor"
          aria-labelledby="tituloMenuGestor"
        >
          <div className="offcanvas-header">
            <h2 className="offcanvas-title h6" id="tituloMenuGestor">
              Menú
            </h2>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="offcanvas"
              data-bs-target="#menuGestor"
              aria-label="Cerrar"
            ></button>
          </div>

          <div className="offcanvas-body p-lg-3">
            <nav className="nav nav-pills flex-column w-100 gap-1">
              {ENLACES_GESTOR.map((enlace) =>
                enlace.disponible ? (
                  <NavLink key={enlace.id} className="nav-link" to={enlace.destino} end>
                    {enlace.texto}
                  </NavLink>
                ) : (
                  <span
                    key={enlace.id}
                    className="nav-link disabled d-flex justify-content-between align-items-center"
                  >
                    {enlace.texto}
                    <small className="badge text-bg-light">Próximamente</small>
                  </span>
                ),
              )}
            </nav>
          </div>
        </aside>

        <main className="flex-grow-1 p-3 p-lg-4">
          <Outlet context={{ usuario }} />
        </main>
      </div>

      <ScrollRestoration />
    </div>
  )
}

export default LayoutGestor
