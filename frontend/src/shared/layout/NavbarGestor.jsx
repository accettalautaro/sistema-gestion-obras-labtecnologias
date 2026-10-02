import { Link } from 'react-router-dom'
import logoScrolled from '../../assets/logoAccettaSinMargenes.png'
import menuIcon from '../../assets/menu.png'
import '../../styles/Navbar.css'
import '../../styles/LayoutGestor.css'

function NavbarGestor({ usuario, handleCerrarSesion, modoCliente = false }) {
	return (
		<header className={`navbar-site header-scrolled ${modoCliente ? 'navbar-cliente' : ''}`}>
			<nav className="navegacion scrolled">
				<Link to="/" className="imagen-izquierda-link" aria-label="Ir al inicio">
					<img src={logoScrolled} alt="logo empresa" className="imagen-izquierda" />
				</Link>

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

				<div className="navbar-gestor__account">
					{!modoCliente && <span className="navbar-gestor__greeting d-none d-md-inline">Hola, {usuario?.nombre}</span>}
					{modoCliente && <Link className="navbar-cliente__inicio" to="/cliente">Mis obras</Link>}
					<button className="navbar-gestor__logout" onClick={handleCerrarSesion}>
						Cerrar sesión
					</button>
				</div>
			</nav>
		</header>
	)
}

export default NavbarGestor
