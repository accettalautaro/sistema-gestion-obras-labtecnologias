import { useState } from 'react'
import { useParams } from 'react-router-dom'
import proyectos from '../data/proyectos.js'
import Volver from '../../../shared/components/Volver.jsx'
import '../../../styles/Proyecto.css'

function ProyectoPage() {
	const { id } = useParams()
	const proyecto = proyectos.find((item) => item.id === Number(id))
	const [imagenActual, setImagenActual] = useState(0)

	if (!proyecto) {
		return (
			<main className="proyecto-page proyecto-page--error contenido-principal">
				<h1>Proyecto no encontrado</h1>
				<p>El proyecto solicitado no existe o el enlace no es válido.</p>
				<Volver to="/proyectos">Volver a proyectos</Volver>
			</main>
		)
	}

	const moverImagen = (direccion) => {
		setImagenActual((actual) => (actual + direccion + proyecto.galeria.length) % proyecto.galeria.length)
	}

	return (
		<main className="proyecto-page contenido-principal">
			<section className="proyecto-page__hero">
				<img src={proyecto.imagen} alt={proyecto.titulo} />
				<div className="proyecto-page__hero-overlay">
					<h1>{proyecto.titulo}</h1>
				</div>
			</section>

			<div className="proyecto-page__content">
				<Volver to="/proyectos">Volver a proyectos</Volver>

				<section className="proyecto-page__section">
					<h2>Concepto</h2>
					<p>{proyecto.concepto}</p>
				</section>

				<section className="proyecto-page__gallery" aria-label={`Galería de ${proyecto.titulo}`}>
					<div className="proyecto-page__gallery-track" style={{ transform: `translateX(-${imagenActual * 100}%)` }}>
						{proyecto.galeria.map((imagen, indice) => (
							<figure key={imagen}>
								<img src={imagen} alt={`${proyecto.titulo}, vista ${indice + 1}`} />
							</figure>
						))}
					</div>
					{proyecto.galeria.length > 1 && (
						<>
							<button type="button" className="proyecto-page__gallery-button proyecto-page__gallery-button--prev" onClick={() => moverImagen(-1)} aria-label="Imagen anterior">&#10094;</button>
							<button type="button" className="proyecto-page__gallery-button proyecto-page__gallery-button--next" onClick={() => moverImagen(1)} aria-label="Imagen siguiente">&#10095;</button>
						</>
					)}
				</section>

				<section className="proyecto-page__details">
					<h2>Detalles</h2>
					<dl>
						<div><dt>Tipo</dt><dd>{proyecto.tipo}</dd></div>
						<div><dt>Superficie</dt><dd>{proyecto.superficie}</dd></div>
						<div><dt>Ubicación</dt><dd>{proyecto.ubicacion}</dd></div>
						<div><dt>Año</dt><dd>{proyecto.anio}</dd></div>
					</dl>
				</section>
			</div>
		</main>
	)
}

export default ProyectoPage
