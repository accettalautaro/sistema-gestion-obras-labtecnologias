import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useOutletContext } from 'react-router-dom'
import '../../../styles/Principal.css'

const leerPorcentaje = (valor) => {
	const numero = Number.parseFloat(String(valor ?? '0').replace('%', '').replace(',', '.'))
	return Number.isFinite(numero) ? Math.min(100, Math.max(0, numero)) : 0
}

const estadoNormalizado = (estado = '') => estado
	.toLowerCase()
	.normalize('NFD')
	.replace(/[\u0300-\u036f]/g, '')
	.replace('Ã³', 'o')

const mostrarEstado = (estado = '') => {
	const normalizado = estadoNormalizado(estado)
	if (normalizado.includes('ejecuci')) return 'En ejecución'
	if (normalizado.includes('pausa')) return 'En pausa'
	if (normalizado.includes('termin') || normalizado.includes('finaliz') || normalizado.includes('complet')) return 'Finalizada'
	return estado || 'Sin estado'
}

const formatearPesos = (valor) => new Intl.NumberFormat('es-AR', {
	style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
}).format(valor)

function PrincipalPage() {
	const { usuario } = useOutletContext()
	const [obras, setObras] = useState([])
	const [clientes, setClientes] = useState([])
	const [tareas, setTareas] = useState([])
	const [loading, setLoading] = useState(true)
	const [errorApi, setErrorApi] = useState(false)

	useEffect(() => {
		let vigente = true
		Promise.all([
			fetch('/backend/data/obras.json').then((respuesta) => {
				if (!respuesta.ok) throw new Error('No se pudieron cargar las obras.')
				return respuesta.json()
			}),
			fetch('/backend/data/clientes.json').then((respuesta) => {
				if (!respuesta.ok) throw new Error('No se pudieron cargar los clientes.')
				return respuesta.json()
			}),
			fetch('/backend/data/tareas.json').then((respuesta) => {
				if (!respuesta.ok) throw new Error('No se pudieron cargar las tareas.')
				return respuesta.json()
			}),
		])
			.then(([obrasData, clientesData, tareasData]) => {
				if (!vigente) return
				setObras(Array.isArray(obrasData) ? obrasData : obrasData.obras || [])
				setClientes(Array.isArray(clientesData) ? clientesData : [])
				setTareas(Array.isArray(tareasData) ? tareasData : [])
			})
			.catch((error) => {
				console.error('Error al cargar los datos del inicio', error)
				if (vigente) setErrorApi(true)
			})
			.finally(() => { if (vigente) setLoading(false) })

		return () => { vigente = false }
	}, [])

	const resumen = useMemo(() => {
		const activas = obras.filter((obra) => estadoNormalizado(obra.Estado).includes('ejecuci') || estadoNormalizado(obra.Estado).includes('activa')).length
		const pausadas = obras.filter((obra) => estadoNormalizado(obra.Estado).includes('pausa')).length
		const terminadas = obras.filter((obra) => ['termin', 'finaliz', 'complet'].some((palabra) => estadoNormalizado(obra.Estado).includes(palabra))).length
		const avance = obras.length
			? Math.round(obras.reduce((total, obra) => total + leerPorcentaje(obra.porcentaje), 0) / obras.length)
			: 0
		const costoTotal = tareas.reduce((total, tarea) => total + (Number(tarea['costo-real']) || 0), 0)
		return { activas, pausadas, terminadas, avance, costoTotal }
	}, [obras, tareas])

	const clientePorId = (id) => clientes.find((cliente) => String(cliente['id-cliente']) === String(id))
	const nombreCliente = (obra) => {
		const cliente = clientePorId(obra['id-cliente'])
		return cliente ? `${cliente.nombre} ${cliente.apellido || ''}`.trim() : 'Cliente sin asignar'
	}
	const tareasDeObra = (obra) => tareas.filter((tarea) => String(tarea['id-obra']) === String(obra['id-obra']))
	const necesitaAtencion = obras.filter((obra) => estadoNormalizado(obra.Estado).includes('pausa') || (leerPorcentaje(obra.porcentaje) < 20 && estadoNormalizado(obra.Estado).includes('ejecuci')))

	if (!usuario) return <Navigate to="/login" replace />
	if (loading) return <div className="dashboard-loading" role="status">Preparando el resumen de obras…</div>
	if (errorApi) return (
		<section className="dashboard-error" role="alert">
			<h1>No pudimos cargar el resumen</h1>
			<p>Revisá que el servidor esté iniciado e intentá actualizar la página.</p>
		</section>
	)

	return (
		<div className="dashboard">
			<header className="dashboard__header">
				<div>
					<p className="dashboard__eyebrow">Panel de gestión</p>
					<h1>Buen día, {usuario.nombre}</h1>
					<p className="dashboard__subtitle">Este es el estado general de tus obras.</p>
				</div>
				<Link className="dashboard__action" to="/principal/clientes">Gestionar clientes <span aria-hidden="true">→</span></Link>
			</header>

			<section className="dashboard__stats" aria-label="Resumen de obras">
				<article className="dashboard-stat dashboard-stat--primary">
					<span className="dashboard-stat__icon" aria-hidden="true">⌂</span>
					<p>Obras en ejecución</p><strong>{resumen.activas}</strong>
					<small>de {obras.length} obras registradas</small>
				</article>
				<article className="dashboard-stat">
					<span className="dashboard-stat__icon dashboard-stat__icon--green" aria-hidden="true">✓</span>
					<p>Finalizadas</p><strong>{resumen.terminadas}</strong>
					<small>obras completadas</small>
				</article>
				<article className="dashboard-stat">
					<span className="dashboard-stat__icon dashboard-stat__icon--amber" aria-hidden="true">Ⅱ</span>
					<p>En pausa</p><strong>{resumen.pausadas}</strong>
					<small>requieren seguimiento</small>
				</article>
				<article className="dashboard-stat">
					<span className="dashboard-stat__icon dashboard-stat__icon--blue" aria-hidden="true">↗</span>
					<p>Avance promedio</p><strong>{resumen.avance}<span>%</span></strong>
					<small>avance declarado por obra</small>
				</article>
			</section>

			<section className="dashboard__middle">
				<article className="dashboard-panel dashboard-progress">
					<div className="dashboard-panel__heading">
						<div><p className="dashboard-panel__eyebrow">Seguimiento</p><h2>Avance por obra</h2></div>
						<span className="dashboard-panel__count">{obras.length} {obras.length === 1 ? 'obra' : 'obras'}</span>
					</div>
					{obras.length === 0 ? <p className="dashboard-empty">Todavía no hay obras para mostrar.</p> : (
						<div className="dashboard-progress__list">
							{obras.map((obra) => {
								const avance = leerPorcentaje(obra.porcentaje)
								return <div className="dashboard-progress__item" key={obra['id-obra']}>
									<div className="dashboard-progress__meta"><div><strong>Obra #{obra['id-obra']}</strong><span>{nombreCliente(obra)}</span></div><b>{avance}%</b></div>
									<div className="dashboard-progress__track" role="progressbar" aria-label={`Avance de la obra ${obra['id-obra']}`} aria-valuenow={avance} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${avance}%` }} /></div>
									<div className="dashboard-progress__foot"><span>{mostrarEstado(obra.Estado)}</span><span>{tareasDeObra(obra).length} tareas</span></div>
								</div>
							})}
						</div>
					)}
				</article>

				<aside className="dashboard-panel dashboard-investment">
					<p className="dashboard-panel__eyebrow">Costos registrados</p>
					<h2>Inversión ejecutada</h2>
					<strong className="dashboard-investment__amount">{formatearPesos(resumen.costoTotal)}</strong>
					<p>Suma de los costos reales cargados en las tareas.</p>
					<div className="dashboard-investment__rule" />
					<div className="dashboard-investment__foot"><span>{tareas.length} tareas registradas</span><span>ARS</span></div>
				</aside>
			</section>

			<section className="dashboard-panel dashboard-projects">
				<div className="dashboard-panel__heading">
					<div><p className="dashboard-panel__eyebrow">Vista rápida</p><h2>Obras recientes</h2></div>
					<span className="dashboard-panel__count">{obras.length} en total</span>
				</div>
				{obras.length === 0 ? <p className="dashboard-empty">Cuando registres una obra, vas a verla acá.</p> : (
					<div className="dashboard-projects__list">
						{obras.slice(0, 5).map((obra) => <article className="dashboard-project" key={obra['id-obra']}>
							<div className="dashboard-project__identity"><span className="dashboard-project__mark">{String(obra['id-obra']).padStart(2, '0')}</span><div><strong>Obra #{obra['id-obra']}</strong><span>{nombreCliente(obra)} · Lote {obra.nrolote || '—'}</span></div></div>
							<span className={`dashboard-status ${estadoNormalizado(obra.Estado).includes('pausa') ? 'dashboard-status--paused' : estadoNormalizado(obra.Estado).includes('ejecuci') ? 'dashboard-status--active' : 'dashboard-status--done'}`}><i />{mostrarEstado(obra.Estado)}</span>
							<div className="dashboard-project__progress"><div className="dashboard-progress__track"><span style={{ width: `${leerPorcentaje(obra.porcentaje)}%` }} /></div><span>{leerPorcentaje(obra.porcentaje)}%</span></div>
						</article>)}
					</div>
				)}
			</section>

			<div className={`dashboard-notice ${necesitaAtencion.length ? 'dashboard-notice--attention' : ''}`}>
				<span className="dashboard-notice__symbol" aria-hidden="true">{necesitaAtencion.length ? '!' : '✓'}</span>
				<div><strong>{necesitaAtencion.length ? 'Obras para revisar' : 'Todo en orden'}</strong><p>{necesitaAtencion.length ? `${necesitaAtencion.length} ${necesitaAtencion.length === 1 ? 'obra necesita' : 'obras necesitan'} seguimiento por su estado o avance.` : 'No hay obras pausadas ni con avance bajo en este momento.'}</p></div>
				{necesitaAtencion.length > 0 && <span className="dashboard-notice__number">{necesitaAtencion.length}</span>}
			</div>
		</div>
	)
}

export default PrincipalPage
