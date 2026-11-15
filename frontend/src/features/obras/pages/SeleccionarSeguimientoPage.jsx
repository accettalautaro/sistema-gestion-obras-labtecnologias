import { Link, useOutletContext } from 'react-router-dom'
import { useFetch } from '../../../shared/hooks/useFetch'
import { listarObras } from '../services/obrasService.js'
import '../../../styles/SeguimientoObra.css'

function SeleccionarSeguimientoPage() {
	const { esArquitecto } = useOutletContext()
	const { datos, cargando, error } = useFetch(listarObras)

	if (esArquitecto === null) return <p role="status">Verificando acceso de arquitecto...</p>
	if (!esArquitecto) return <div className="alert alert-danger" role="alert">Esta pantalla está disponible únicamente para cuentas vinculadas a un arquitecto.</div>
	if (cargando) return <p role="status">Cargando obras...</p>
	if (error) return <div className="alert alert-danger" role="alert">{error.message}</div>

	const obras = datos?.obras ?? []

	return <section className="seguimiento-obra">
		<header className="seguimiento-obra__header">
			<div className="seguimiento-obra__encabezado-texto"><p className="seguimiento-obra__eyebrow">Área privada</p><h1>Seguir avance de obra</h1><p>Seleccioná una obra para consultar sus etapas y tareas.</p></div>
		</header>
		{obras.length ? <div className="row g-3">{obras.map((obra) => <div className="col-12 col-md-6 col-xl-4" key={obra['id-obra']}>
			<article className="card h-100">
				<div className="card-body d-flex flex-column">
					<p className="seguimiento-obra__eyebrow mb-1">Obra #{obra['id-obra']} · Lote {obra.nrolote ?? '—'}</p>
					<h2 className="h5">{obra.nombre || 'Sin nombre'}</h2>
					<p className="text-secondary mb-2">{obra.Estado ?? 'Sin estado'}</p>
					<div className="progress mb-2" role="progressbar" aria-label={`Avance de obra ${obra['id-obra']}`} aria-valuenow={Number.parseFloat(obra.porcentaje) || 0} aria-valuemin="0" aria-valuemax="100"><div className="progress-bar" style={{ width: obra.porcentaje }} /></div>
					<p className="small text-secondary">Avance: {obra.porcentaje}</p>
					<Link className="btn seguimiento-obra__boton mt-auto align-self-start" to={`/principal/obras/${obra['id-obra']}/avance`}>Ver seguimiento</Link>
				</div>
			</article>
		</div>)}</div> : <div className="alert alert-info">Todavía no hay obras para consultar.</div>}
	</section>
}

export default SeleccionarSeguimientoPage
