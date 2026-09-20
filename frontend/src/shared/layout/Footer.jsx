import instagramLogo from '../../assets/instagramlogo.png'
import '../../styles/Footer.css'

function Footer() {
	return (
		<footer className="site-footer">
			<a href="https://www.instagram.com/vascoaccetta/" target="_blank" rel="noreferrer">
				<img className="site-footer__instagram-logo" src={instagramLogo} alt="Instagram" />
			</a>
			<p>Copyright © 2026 Accetta Equipamiento. Todos los derechos reservados.</p>
		</footer>
	)
}

export default Footer
