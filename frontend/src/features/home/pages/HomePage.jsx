import estudio from '../../../assets/seccionEstudio.jpg'
import perfil from '../../../assets/perfilprovisorio.jpg'
import logoSimple from '../../../assets/logosimple.png'
import Hero from '../components/Hero.jsx'
import SeccionProyectos from '../components/SeccionProyectos.jsx'
import proyectosHome from '../data/proyectos.js'
import '../../../styles/Home.css'

function HomePage() {
	return (
		<main className="contenido-principal pagina-inicio home-page">
			<Hero proyectos={proyectosHome} />

			<section className="seccion-estudio seccion-contenido reveal">
				<div className="estudio-imagen" style={{ backgroundImage: `url(${estudio})` }} />
				<div className="estudio-texto">
					<h2 className="titulo-fino">Estudio</h2>
					<p className="texto-claro">Somos un estudio de Arquitectura con búsquedas diversas. Trabajamos de manera personalizada con cada cliente logrando satisfacer sus necesidades, aportando nuestra impronta y creatividad en el diseño.</p>
					<p className="texto-claro">Abordamos todas las fases de una obra de arquitectura: Proyecto - Dirección - Administración - Construcción, ofreciendo un servicio completo desde el inicio de la idea hasta la finalización de la obra.</p>
					<p className="texto-claro">Ademas ofrecemos un sistema para que puedas seguir el progreso de tu proyecto desde cualquier lugar y en todo momento.</p>
					<a href="#Nosotros" className="boton-blanco">Ver Más</a>
				</div>
			</section>

			<SeccionProyectos proyectos={proyectosHome} />

			<section id="Nosotros">
				<div className="reveal">
					<h2>Quien Soy</h2>
					<div id="perfil">
						<img src={perfil} alt="foto perfil" className="imagen-perfil" />
						<h3>Marcelo Accetta</h3>
						<h4>ARQUITECTO</h4>
					</div>
					<div className="texto-nosotros">
						<p>¡Hola! Soy <strong>Marcelo Accetta</strong>, arquitecto egresado de la <strong>Universidad Nacional de Córdoba</strong> y fundador de <strong>Accetta Equipamiento</strong>.</p>
						<p>A lo largo de mi carrera, he comprendido que la arquitectura va mucho más allá de levantar paredes; se trata de <strong>dar vida a los espacios</strong> y dotarlos de un propósito. Por eso nació Accetta Equipamiento, con la visión de ofrecer <strong>soluciones integrales</strong> donde el <strong>diseño espacial</strong> y el <strong>equipamiento funcional</strong> trabajen en perfecta armonía.</p>
						<p>Mi formación en la UNC me dio las bases técnicas y estéticas, pero es el trabajo del día a día con cada cliente lo que realmente define nuestro enfoque. Nos apasiona <strong>escuchar tus necesidades</strong>, entender cómo habitas o trabajas en un lugar, y transformar esa visión en una <strong>realidad tangible, eficiente y con un alto valor estético</strong>.</p>
						<p>Sabemos que iniciar un proyecto de construcción o remodelación es un paso importante que requiere confianza. Para darte total tranquilidad, integramos la tecnología a nuestro método de trabajo: contamos con un <strong>sistema de gestión de obras exclusivo</strong>. A través de esta plataforma, podrás seguir el progreso de tu construcción paso a paso, desde cualquier lugar y en todo momento, garantizando una <strong>transparencia absoluta</strong>.</p>
						<p>Ya sea que busques optimizar un espacio comercial, renovar tu oficina o darle una nueva identidad a tu hogar, en Accetta Equipamiento estamos listos para <strong>acompañarte en cada etapa</strong>, con la tranquilidad de que siempre tendrás el <strong>control de tu proyecto</strong>.</p>
					</div>
				</div>
			</section>

			<section id="info-contacto" className="info-contacto reveal">
				<div className="contacto-card">
					<div className="contacto-logo-wrap"><img src={logoSimple} alt="logo empresa" className="contacto-logo" /></div>
					<div className="contacto-datos">
						<h3>Accetta Equipamiento</h3>
						<p className="contacto-direccion">Ciudad de la Paz 2761 - 7A - CABA</p>
						<p className="contacto-email">Email: <a href="mailto:arqaccetta@gmail.com">arqaccetta@gmail.com</a></p>
						<p className="contacto-telefono">Teléfono: 2657-657808</p>
					</div>
				</div>
			</section>
		</main>
	)
}

export default HomePage