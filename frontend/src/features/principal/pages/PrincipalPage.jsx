import '../../../styles/Principal.css'

function PrincipalPage({ usuario, onCerrarSesion }) {
	if (!usuario) return null

	const { proyecto } = usuario

	return (
		<main className="principal-page contenido-principal">
			<section className="principal-page__intro">
				<div>
					<p className="principal-page__eyebrow">Panel de seguimiento</p>
					<h1>Hola, {usuario.nombre}</h1>
					<p>Este es el estado actualizado de tu proyecto de obra.</p>
				</div>
				<button type="button" className="principal-page__logout" onClick={onCerrarSesion}>Cerrar sesión</button>
			</section>

			<section className="principal-page__summary" aria-label="Resumen del proyecto">
				<article className="principal-card principal-card--project">
					<p className="principal-card__label">Proyecto activo</p>
					<h2>{proyecto.nombre}</h2>
					<p>{proyecto.ubicacion}</p>
				</article>
				<article className="principal-card">
					<p className="principal-card__label">Estado actual</p>
					<h2>{proyecto.estado}</h2>
					<p>Última actualización del seguimiento</p>
				</article>
				<article className="principal-card">
					<p className="principal-card__label">Tu perfil</p>
					<h2>{usuario.rol}</h2>
					<p>DNI terminado en {usuario.dni.slice(-4)}</p>
				</article>
			</section>

			<section className="principal-page__progress">
				<div className="principal-page__section-heading">
					<div>
						<p className="principal-page__eyebrow">Seguimiento de obra</p>
						<h2>Avance del proyecto</h2>
					</div>
					<strong>{proyecto.avance}%</strong>
				</div>
				<div className="principal-page__progress-bar" aria-label={`Avance del proyecto: ${proyecto.avance}%`}>
					<span style={{ width: `${proyecto.avance}%` }} />
				</div>
				<p className="principal-page__next">Próxima etapa: <strong>{proyecto.proximaEtapa}</strong></p>
			</section>

			<section className="principal-page__notice">
				<div>
					<p className="principal-page__eyebrow">Información</p>
					<h2>Tu obra, siempre a mano</h2>
					<p>Desde este panel podrás consultar el progreso y mantenerte al tanto de las próximas etapas de tu proyecto.</p>
				</div>
				<a href="#contacto">Contactar al estudio</a>
			</section>
		</main>
	)
}

export default PrincipalPage
