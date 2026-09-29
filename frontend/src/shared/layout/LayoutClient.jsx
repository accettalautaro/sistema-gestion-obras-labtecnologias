import { NavLink, Outlet, ScrollRestoration, useLoaderData, useNavigate } from 'react-router-dom'
import NavbarGestor from './NavbarGestor'
import { cerrarSesion } from '../../features/login'
import Footer from './Footer'
const ENLACES_CLIENTE = [
  { id: 1, texto: 'Inicio', destino: '/cliente', disponible: true },
  { id: 2, texto: 'Mis Obras', destino: '/cliente', disponible: true,},
  { id: 3, texto: 'Recordatorios', destino: '/cliente', disponible: false },
]
function LayoutCliente(){
    const usuario = useLoaderData() 
    const navigate = useNavigate()
    const esCliente = usuario?.rol === 'cliente'
    const handleCerrarSesion = () => {
    cerrarSesion()
    navigate('/login', { replace: true })
     }

    return (
        
        <>
            <NavbarGestor usuario={usuario} handleCerrarSesion={handleCerrarSesion} />
            <div className="d-flex flex-grow-1">
                    <aside
                      className="offcanvas-lg offcanvas-start sidebar-gestor bg-white border-end"
                      tabIndex="-1"
                      id="menuCliente"
                      aria-labelledby="tituloMenuCliente"
                    >
                      <div className="offcanvas-header">
                        <h2 className="offcanvas-title h6" id="tituloMenuCliente">
                          Menú
                        </h2>
                        <button
                          type="button"
                          className="btn-close"
                          data-bs-dismiss="offcanvas"
                          data-bs-target="#menuCliente"
                          aria-label="Cerrar"
                        ></button>
                      </div>
            
                      <div className="offcanvas-body p-lg-3">
                        <nav className="nav nav-pills flex-column w-100 gap-1">
                          {ENLACES_CLIENTE.map((enlace) =>
                                !esCliente ? null : enlace.disponible ? (
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
                      <Outlet context={{ usuario, esCliente }} />
                    </main>
                    
                    </div>
                    <Footer />
                    <ScrollRestoration />
        </>
    )
}