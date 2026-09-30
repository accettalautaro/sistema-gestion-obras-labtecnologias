import { Link } from 'react-router-dom'

function SeccionProyectos({ proyectos }) {
	return (
		<section id="grilla-proyectos">
			<h2 className="titulo-fino">Proyectos</h2>
			<div className="proyectos-grilla">
				{proyectos.map((proyecto) => (
					<div className="proyecto-item" key={proyecto.id}>
						<Link className="proyecto-link" to={`/proyecto/${proyecto.id}`}>
							<img src={proyecto.imagen} alt={proyecto.titulo} />
							<div className="proyecto-overlay">
								<span className="proyecto-titulo">{proyecto.titulo}</span>
								<span className="proyecto-categoria">Residencial</span>
							</div>
						</Link>
					</div>
				))}
			</div>
		</section>
	)
}

export default SeccionProyectos