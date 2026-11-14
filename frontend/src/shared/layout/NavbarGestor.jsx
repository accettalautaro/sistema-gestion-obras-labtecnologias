import { Link } from 'react-router-dom'
import logoScrolled from '../../assets/logoAccettaSinMargenes.png'
import menuIcon from '../../assets/menu.png'
import '../../styles/Navbar.css'
import '../../styles/LayoutGestor.css'
import BotonCerrarSesion from '../components/BotonCerrarSesion.jsx'

function NavbarGestor({ usuario, handleCerrarSesion, modoCliente = false }) {
	const nombreUsuario = String(usuario?.nombre ?? '').trim()

	return (
		<header className={`navbar-site header-scrolled ${modoCliente ? 'navbar-cliente' : ''}`}>
			<nav className="navegacion scrolled">
				<Link to="/" className="imagen-izquierda-link" aria-label="Ir al inicio">
					<img src={logoScrolled} alt="logo empresa" className="imagen-izquierda" />
				</Link>

				{!modoCliente && <div className="navbar-gestor__account d-none d-lg-flex">
					<span className="navbar-gestor__greeting">{nombreUsuario ? `Hola, ${nombreUsuario}` : 'Hola'}</span>
					<BotonCerrarSesion handleCerrarSesion={handleCerrarSesion} />
				</div>}
				{modoCliente && <BotonCerrarSesion className="navbar-gestor__account" handleCerrarSesion={handleCerrarSesion} />}
				{!modoCliente && <button
					type="button"
					className="hamburguer d-lg-none"
					data-bs-toggle="offcanvas"
					data-bs-target="#menuGestor"
					aria-controls="menuGestor"
					aria-label="Abrir menú"
				>
					<img src={menuIcon} alt="" />
				</button>}
			</nav>
		</header>
	)
}

export default NavbarGestor
