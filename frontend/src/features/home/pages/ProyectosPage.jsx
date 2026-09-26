import casaminimalista from '../../../assets/casaminimalista.jpg'
import { Link } from 'react-router-dom'
import proyectos from '../data/proyectos.js'
import '../../../styles/Proyectos.css'

function ProyectosPage() {
	return (
		<main className="proyectos-page contenido-principal">
			<section className="proyectos-page__hero" style={{ backgroundImage: `url(${casaminimalista})` }}>
				<h1>Proyectos</h1>
			</section>

			<section className="proyectos-page__listado">
				<h2>Proyectos</h2>
				<p>Conocé algunos de los proyectos realizados por nosotros.</p>

				<div className="proyectos-page__grid">
					{proyectos.map((proyecto) => (
						<Link className="proyecto-card-link" to={`/proyecto/${proyecto.id}`} key={proyecto.id}>
							<article className="proyecto-card">
								<img src={proyecto.imagen} alt={proyecto.titulo} />
								<div className="proyecto-card__info">
									<h3>{proyecto.titulo}</h3>
									<p>{proyecto.tipo}</p>
								</div>
							</article>
						</Link>
					))}
				</div>
			</section>
		</main>
	)
}

export default ProyectosPage
