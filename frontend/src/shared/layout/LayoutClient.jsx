import { NavLink, Outlet, ScrollRestoration, useLoaderData, useNavigate } from 'react-router-dom'
import NavbarGestor from './NavbarGestor'
import { cerrarSesion } from '../../features/login'
import Footer from './Footer'
    const ENLACES_CLIENTE = [
    { id: 1, texto: 'Inicio', destino: '/cliente', disponible: true },
    { id: 2, texto: 'Mis Obras', destino: '/cliente', disponible: false,},
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
            <div className="layout-gestor d-flex flex-column min-vh-100 bg-body-tertiary">
                <NavbarGestor usuario={usuario} handleCerrarSesion={handleCerrarSesion} />
                <div className="d-flex flex-grow-1">
                        <main className="flex-grow-1 p-3 p-lg-4">
                        <Outlet context={{ usuario, esCliente }} />
                        </main>
                        
                        </div>
                        <Footer />
                        <ScrollRestoration />
            </div>
        )
    }

export default LayoutCliente