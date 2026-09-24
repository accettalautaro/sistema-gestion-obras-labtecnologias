import { useEffect, useState } from 'react'

function Hero({ proyectos }) {
	const [slideActual, setSlideActual] = useState(0)

	useEffect(() => {
		let frame
		const actualizarHero = () => {
			const contenido = document.querySelector('.home-page .carrusel-contenido')
			if (contenido) {
				const progreso = Math.min(window.scrollY / window.innerHeight, 1)
				contenido.style.opacity = String(1 - progreso)
				contenido.style.transform = `translate(-50%, calc(-50% - ${progreso * 24}px))`
			}
			frame = undefined
		}
		const manejarScroll = () => {
			if (!frame) frame = window.requestAnimationFrame(actualizarHero)
		}

		window.addEventListener('scroll', manejarScroll, { passive: true })
		actualizarHero()

		return () => {
			window.removeEventListener('scroll', manejarScroll)
			if (frame) window.cancelAnimationFrame(frame)
		}
	}, [])

	const moverCarrusel = (direccion) => {
		setSlideActual((actual) => (actual + direccion + proyectos.length) % proyectos.length)
	}

	return (
		<section className="carrusel-contenedor hero-reveal">
			<div className="carrusel-track" style={{ transform: `translateX(-${slideActual * 100}%)` }}>
				{proyectos.map((proyecto) => (
					<div className="carrusel-slide" key={proyecto.id}>
						<div className="fondo-imagen" style={{ backgroundImage: `url(${proyecto.imagen})` }} />
						<div className="carrusel-contenido">
							<h2>{proyecto.titulo}</h2>
							<a href={`#proyecto=${proyecto.id}`} className="boton-hero">Ver Más</a>
						</div>
					</div>
				))}
			</div>
			<button className="carrusel-btn btn-prev" type="button" onClick={() => moverCarrusel(-1)} aria-label="Proyecto anterior">&#10094;</button>
			<button className="carrusel-btn btn-next" type="button" onClick={() => moverCarrusel(1)} aria-label="Proyecto siguiente">&#10095;</button>
		</section>
	)
}

export default Hero