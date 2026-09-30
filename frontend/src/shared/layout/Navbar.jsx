import { useEffect, useState } from 'react'
import logo from '../../assets/logoAccettaSinMargenesBlanco.png'
import logoScrolled from '../../assets/logoAccettaSinMargenes.png'
import menuIcon from '../../assets/menu.png'
import instagramLogo from '../../assets/instagramlogoBlanco.png'
import instagramLogoScrolled from '../../assets/instagramlogo.png'
import { Link } from 'react-router-dom'
import '../../styles/Navbar.css'



function Navbar({ forceScrolled = false , links}) {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const [isScrolled, setIsScrolled] = useState(false)

	useEffect(() => {
		document.body.classList.toggle('menu-open', isMobileMenuOpen)

		return () => document.body.classList.remove('menu-open')
	}, [isMobileMenuOpen])

	useEffect(() => {
		const handleScroll = () => setIsScrolled(window.scrollY > 50)

		window.addEventListener('scroll', handleScroll, { passive: true })
		handleScroll()

		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	const closeMobileMenu = () => setIsMobileMenuOpen(false)

	return (
		<header className={`navbar-site${(isScrolled || forceScrolled) ? ' header-scrolled' : ''}`}>
			<nav className={`navegacion${(isScrolled || forceScrolled) ? ' scrolled' : ''}`}>
				<Link to="/" className="imagen-izquierda-link" aria-label="Ir al inicio">
					<img src={(isScrolled || forceScrolled) ? logoScrolled : logo} alt="logo empresa" className="imagen-izquierda" />
				</Link>

				<button
					type="button"
					className="hamburguer"
					aria-label="Abrir menú"
					aria-expanded={isMobileMenuOpen}
					onClick={() => setIsMobileMenuOpen(true)}
				>
					<img src={menuIcon} alt="" />
				</button>

				<ul className="links">
					{links.map((link) => (
						<li key={link.label}>
							{link.href.startsWith('http') || link.href.includes('#') ? (
								<a href={link.href}>{link.label}</a>
							) : (
								<Link to={link.href}>{link.label}</Link>
							)}
						</li>
					))}
					<li>
						<a href="https://www.instagram.com/vascoaccetta/" target="_blank" rel="noreferrer">
							<img className="instagram-logo" src={(isScrolled || forceScrolled) ? instagramLogoScrolled : instagramLogo} alt="Instagram" />
						</a>
					</li>
				</ul>

				{isMobileMenuOpen && <div className="offcanvas-backdrop" onClick={closeMobileMenu} />}
				<aside
					className={`mobile-menu${isMobileMenuOpen ? ' mobile-menu-visible' : ''}`}
					aria-hidden={!isMobileMenuOpen}
				>
					<div className="mobile-menu-header">
						<button type="button" className="close-menu" aria-label="Cerrar menú" onClick={closeMobileMenu}>
							×
						</button>
					</div>
					<div className="mobile-menu-body">
						<img src={logo} alt="logo empresa" className="mobile-menu-logo" />
						<hr />
						<ul className="mobile-links">
							{links.map((link) => (
								<li key={link.label}>
									{link.href.startsWith('http') || link.href.includes('#') ? (
										<a href={link.href} onClick={closeMobileMenu}>{link.label}</a>
									) : (
										<Link to={link.href} onClick={closeMobileMenu}>{link.label}</Link>
									)}
								</li>
							))}
						</ul>
						<hr />
						<a href="https://www.instagram.com/vascoaccetta/" target="_blank" rel="noreferrer">
							<img className="instagram-logo" src={instagramLogo} alt="Instagram" />
						</a>
					</div>
				</aside>
			</nav>
		</header>
	)
}

export default Navbar
