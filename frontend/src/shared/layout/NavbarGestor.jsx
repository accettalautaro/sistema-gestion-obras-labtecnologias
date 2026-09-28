import { Link } from 'react-router-dom'
import logoScrolled from '../../assets/logoAccettaSinMargenes.png'
import menuIcon from '../../assets/menu.png'
import '../../styles/Navbar.css'

function NavbarGestor({ usuario, handleCerrarSesion }) {
	return (
		<header className="navbar-site header-scrolled">
			<nav className="navegacion scrolled">
				<Link to="/" className="imagen-izquierda-link" aria-label="Ir al inicio">
					<img src={logoScrolled} alt="logo empresa" className="imagen-izquierda" />
				</Link>

				<button
					type="button"
					className="hamburguer d-lg-none"
					data-bs-toggle="offcanvas"
					data-bs-target="#menuGestor"
					aria-controls="menuGestor"
					aria-label="Abrir menú"
				>
					<img src={menuIcon} alt="" />
				</button>

				<div className="d-flex align-items-center gap-3 pe-3">
					<span className="text-light small d-none d-md-inline">Hola, {usuario?.nombre}</span>
					<button className="btn btn-warning btn-sm" onClick={handleCerrarSesion}>
						Cerrar sesión
					</button>
				</div>
			</nav>
		</header>
	)
}

export default NavbarGestor
