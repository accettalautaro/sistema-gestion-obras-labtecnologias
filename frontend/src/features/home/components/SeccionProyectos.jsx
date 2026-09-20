function SeccionProyectos({ proyectos }) {
	return (
		<section id="grilla-proyectos">
			<h2 className="titulo-fino">Proyectos</h2>
			<div className="proyectos-grilla">
				{proyectos.map((proyecto) => (
					<div className="proyecto-item" key={proyecto.id}>
						<a className="proyecto-link" href={`/proyecto.html?id=${proyecto.id}`}>
							<img src={proyecto.imagen} alt={proyecto.titulo} />
							<div className="proyecto-overlay">
								<span className="proyecto-titulo">{proyecto.titulo}</span>
								<span className="proyecto-categoria">Residencial</span>
							</div>
						</a>
					</div>
				))}
			</div>
		</section>
	)
}

export default SeccionProyectos