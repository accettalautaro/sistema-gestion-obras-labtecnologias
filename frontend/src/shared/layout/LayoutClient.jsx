import { Outlet, ScrollRestoration, useLoaderData, useNavigate } from 'react-router-dom'
import NavbarGestor from './NavbarGestor'
import { cerrarSesion } from '../../features/login'
import Footer from './Footer'
import '../../styles/ClienteArea.css'

    function LayoutCliente({ usuario: usuarioProp }){
        const datosSesion = useLoaderData()
        const usuario = usuarioProp ?? datosSesion
        const navigate = useNavigate()
        const esCliente = usuario?.rol === 'cliente'
        const handleCerrarSesion = async () => {
        await cerrarSesion()
        navigate('/login', { replace: true })
        }

        return (
            <div className="layout-gestor layout-cliente d-flex flex-column min-vh-100">
                <NavbarGestor usuario={usuario} handleCerrarSesion={handleCerrarSesion} modoCliente />
                <div className="d-flex flex-grow-1">
                        <main className="main-cliente flex-grow-1 p-3 p-lg-4">
                        <Outlet context={{ usuario, esCliente }} />
                        </main>
                        
                        </div>
                        <Footer />
                        <ScrollRestoration />
            </div>
        )
    }

export default LayoutCliente
