import { useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { useFetch } from '../../../shared/hooks/useFetch'
import { porcentajeTarea } from '../../../shared/utils/avanceObra.js'
import { obtenerSeguimientoObra } from '../services/seguimientoService.js'
import { actualizarEstadoSeguimiento } from '../services/obrasService.js'
import { actualizarEstadoTarea } from '../services/tareasService.js'
import { NOMENCLADOR_TAREAS } from '../data/nomencladorTareas.js'
import '../../../styles/SeguimientoObra.css'

function fechaCorta(valor) {
	if (!valor) return 'Sin fecha'
	const [anio, mes, dia] = String(valor).split('-').map(Number)
	if (!anio || !mes || !dia) return 'Sin fecha'
	return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(anio, mes - 1, dia))
}

function fechaLocalISO(fecha) {
	return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

function formatoOracion(valor) {
	const texto = String(valor ?? '').trim().toLocaleLowerCase('es-AR')
	return texto ? texto.charAt(0).toLocaleUpperCase('es-AR') + texto.slice(1) : ''
}

const formatMoneda = (valor) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(valor || 0)

function codigoVisible(tarea, padre = null) {
	const normalizar = (nombre) => String(nombre ?? '').trim().toLocaleLowerCase('es')
	const catalogoPadre = NOMENCLADOR_TAREAS.find((item) => normalizar(item.nombre) === normalizar(padre?.nombre))
	if (catalogoPadre) {
		const indiceSubtarea = catalogoPadre.subtareas.findIndex((nombre) => normalizar(nombre) === normalizar(tarea?.nombre))
		if (indiceSubtarea >= 0) return `${catalogoPadre.codigo}-${indiceSubtarea + 1}`
	}
	const codigoNomenclador = NOMENCLADOR_TAREAS.find((item) => normalizar(item.nombre) === normalizar(tarea?.nombre))?.codigo
	return codigoNomenclador ?? String(tarea?.['id-tarea'] ?? tarea ?? '').replaceAll('-', '.').replaceAll(',', '.')
}

function claseEstadoObra(estado) {
	const normalizado = String(estado ?? '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
	if (normalizado.includes('cancel')) return 'seguimiento-obra__estado-badge--cancelada'
	if (normalizado.includes('pausa') || normalizado.includes('suspend') || normalizado.includes('pendiente')) return 'seguimiento-obra__estado-badge--neutral'
	if (normalizado.includes('atras')) return 'seguimiento-obra__estado-badge--atrasada'
	if (normalizado.includes('final') || normalizado.includes('complet')) return 'seguimiento-obra__estado-badge--finalizada'
	if (normalizado.includes('ejecuci') || normalizado.includes('progreso')) return 'seguimiento-obra__estado-badge--activa'
	return 'seguimiento-obra__estado-badge--neutral'
}

function avanceTarea(tarea) {
	return porcentajeTarea(tarea)
}

function estaCompletada(tarea) {
	return avanceTarea(tarea) >= 100 && Boolean(tarea['fecha-fin-real'])
}

function claseAvance(valor) {
	if (valor >= 100) return 'is-completa'
	if (valor > 0) return 'is-activa'
	return 'is-pendiente'
}

function SeguimientoObraPage() {
	const { esArquitecto } = useOutletContext()
	const { id } = useParams()
	const { datos, cargando, error } = useFetch(obtenerSeguimientoObra, id)
	const [obraActualizada, setObraActualizada] = useState(null)
	const [guardandoTarea, setGuardandoTarea] = useState(false)
	const [errorMutacion, setErrorMutacion] = useState('')
	const obra = obraActualizada ?? datos

	if (esArquitecto === null) return <p className="seguimiento-obra__estado" role="status">Verificando acceso de arquitecto...</p>
	if (!esArquitecto) return <div className="alert alert-danger" role="alert">Esta pantalla está disponible únicamente para cuentas vinculadas a un arquitecto.</div>
	if (cargando) return <p className="seguimiento-obra__estado" role="status">Cargando seguimiento de obra...</p>
	if (error) return <div className="alert alert-danger" role="alert">{error.message}</div>
	if (!obra) return <div className="alert alert-warning" role="alert">No se encontró la obra solicitada.</div>

	const etapas = obra.etapas.map((etapa, indice) => {
		const subtareas = etapa.subtareas
		const etapaEditada = etapa
		const unidades = subtareas.length ? subtareas : [etapaEditada]
		const avance = avanceTarea(etapaEditada)
		return { ...etapaEditada, numeroOrden: indice + 1, avance, subtareas, unidades }
	})
	const unidades = etapas.flatMap((etapa) => etapa.unidades)
	const completadas = unidades.filter(estaCompletada).length
	const avanceGeneral = Number(obra.avance) || 0
	const porcentajeAbonado = obra.costoEstimadoTotal > 0
		? Math.min(100, Math.max(0, (obra.montoAbonado / obra.costoEstimadoTotal) * 100))
		: 0
	const diferenciaPresupuesto = obra.costoEstimadoTotal - obra.montoAbonado
	const estadoPresupuesto = obra.costoEstimadoTotal <= 0
		? 'Sin estimación de costos'
		: obra.montoAbonado > obra.costoEstimadoTotal
			? `Excedido por ${formatMoneda(Math.abs(diferenciaPresupuesto))}`
			: obra.montoAbonado === obra.costoEstimadoTotal
				? 'Presupuesto completado exactamente.'
				: `Dentro del presupuesto (Faltan abonar ${formatMoneda(Math.abs(diferenciaPresupuesto))})`
	const colorPresupuesto = obra.costoEstimadoTotal <= 0 ? 'text-muted' : obra.montoAbonado > obra.costoEstimadoTotal ? 'text-danger' : 'seguimiento-obra__presupuesto-ok'
	const actualizarEstadoTareaSeguimiento = async (tarea, accion) => {
		setGuardandoTarea(true); setErrorMutacion('')
		try {
			await actualizarEstadoTarea(id, tarea, accion)
			setObraActualizada(await obtenerSeguimientoObra(id))
		} catch (motivo) { setErrorMutacion(motivo.message || 'No se pudo actualizar el avance.') }
		finally { setGuardandoTarea(false) }
	}
	const alternarPausaObra = async () => {
		setGuardandoTarea(true); setErrorMutacion('')
		try {
			const pausada = String(obra.estado ?? '').toLowerCase().includes('paus') || String(obra.estado ?? '').toLowerCase().includes('suspend')
			await actualizarEstadoSeguimiento(id, pausada ? 'reanudar' : 'pausar')
			setObraActualizada(await obtenerSeguimientoObra(id))
		} catch (motivo) { setErrorMutacion(motivo.message || 'No se pudo actualizar el estado de la obra.') }
		finally { setGuardandoTarea(false) }
	}

	return <section className="seguimiento-obra cliente-detalle cliente-detalle-obra">
		<header className="seguimiento-obra__header">
			<div className="seguimiento-obra__encabezado-texto"><p className="seguimiento-obra__eyebrow">Seguimiento de obra</p><h1>Obra #{obra.id} · Lote {obra.nrolote}</h1><p>{obra.direccion}</p></div>
			<div className="seguimiento-obra__header-acciones"><span className={`seguimiento-obra__estado-badge ${claseEstadoObra(obra.estado)}`}><span aria-hidden="true" />{obra.estado}</span><button className="btn btn-sm btn-outline-dark rounded-pill" type="button" disabled={guardandoTarea} onClick={alternarPausaObra}>{String(obra.estado ?? '').toLowerCase().includes('paus') || String(obra.estado ?? '').toLowerCase().includes('suspend') ? 'Reanudar obra' : 'Pausar obra'}</button></div>
		</header>

		<div className="row g-4 mb-4">
			<div className="col-12 col-md-4"><div className="card border-0 shadow-sm rounded-3 h-100"><div className="card-body p-4"><div className="seguimiento-obra__tarjeta-titulo"><h6 className="text-muted fw-bold">INFORMACIÓN GENERAL</h6></div><ul className="list-unstyled mb-0"><li className="seguimiento-obra__dato-lote"><span className="seguimiento-obra__dato-general"><i className="bi bi-map" /><span><span className="seguimiento-obra__dato-etiqueta">Lote:</span> <strong className="seguimiento-obra__dato-valor">{obra.nrolote ?? 'Sin lote'}</strong></span></span>{obra.nrolote && obra.nrolote !== '—' && <Link to={`/principal/terrenos/${obra.nrolote}`} className="seguimiento-obra__enlace-lote">Ver información</Link>}</li><li className="seguimiento-obra__dato-general"><i className="bi bi-person" /><span><span className="seguimiento-obra__dato-etiqueta">Cliente:</span> <strong className="seguimiento-obra__dato-valor">{obra.cliente}</strong></span></li><li className="seguimiento-obra__dato-general"><i className="bi bi-person-workspace" /><span><span className="seguimiento-obra__dato-etiqueta">Arquitecto:</span> <strong className="seguimiento-obra__dato-valor">{obra.arquitecto}</strong></span></li><li className="seguimiento-obra__dato-general"><i className="bi bi-calendar-event" /><span><span className="seguimiento-obra__dato-etiqueta">Inicio estimado:</span> <strong className="seguimiento-obra__dato-valor">{fechaCorta(obra.fechaInicioEstimada)}</strong></span></li>{obra.fechaFinEstimada && <li className="seguimiento-obra__dato-general"><i className="bi bi-calendar-check" /><span><span className="seguimiento-obra__dato-etiqueta">Fin estimado:</span> <strong className="seguimiento-obra__dato-valor">{fechaCorta(obra.fechaFinEstimada)}</strong></span></li>}{obra.fechaInicioReal && <li className="seguimiento-obra__dato-general"><i className="bi bi-play-circle" /><span><span className="seguimiento-obra__dato-etiqueta">Inicio real:</span> <strong className="seguimiento-obra__dato-valor">{fechaCorta(obra.fechaInicioReal)}</strong></span></li>}{obra.fechaFinReal && <li className="seguimiento-obra__dato-general"><i className="bi bi-check-circle" /><span><span className="seguimiento-obra__dato-etiqueta">Fin real:</span> <strong className="seguimiento-obra__dato-valor">{fechaCorta(obra.fechaFinReal)}</strong></span></li>}</ul></div></div></div>
			<div className="col-12 col-md-4"><div className="card border-0 shadow-sm rounded-3 h-100"><div className="card-body p-4 d-flex flex-column"><h6 className="text-muted fw-bold">ESTADO DE PRESUPUESTO</h6><div className="mb-3"><span className="seguimiento-obra__finanzas-etiqueta">Costo estimado</span><strong className="seguimiento-obra__finanzas-valor fs-4">{formatMoneda(obra.costoEstimadoTotal)}</strong></div><div className="mb-3"><span className="seguimiento-obra__finanzas-etiqueta">Monto abonado</span><strong className="seguimiento-obra__finanzas-valor fs-5">{formatMoneda(obra.montoAbonado)}</strong><div className="seguimiento-obra__barra-presupuesto mt-2" role="progressbar" aria-label="Porcentaje del costo estimado abonado" aria-valuenow={Math.round(porcentajeAbonado)} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${porcentajeAbonado}%` }} /></div></div><div className={`seguimiento-obra__presupuesto-estado ${colorPresupuesto}`}>{estadoPresupuesto}</div></div></div></div>
			<div className="col-12 col-md-4"><div className="card border-0 shadow-sm rounded-3 h-100"><div className="card-body p-4 d-flex flex-column"><h6 className="text-muted fw-bold">ESTADO DE TIEMPO Y AVANCE</h6><div className="mb-4"><div className="d-flex justify-content-between align-items-center mb-1"><span className="seguimiento-obra__finanzas-etiqueta">Avance general</span><strong className="seguimiento-obra__finanzas-valor small">{avanceGeneral}%</strong></div><div className="progress" style={{ height: 10 }}><div className="progress-bar bg-dark" role="progressbar" style={{ width: `${avanceGeneral}%` }} aria-valuenow={avanceGeneral} aria-valuemin="0" aria-valuemax="100" /></div></div><div className="mb-3"><span className="seguimiento-obra__finanzas-etiqueta">Duración estimada · Duración real</span><strong className="seguimiento-obra__finanzas-valor fw-semibold">{obra.duracionEstimada ?? 'Sin datos'}{obra.duracionEstimada != null ? ' días' : ''} · {obra.duracionReal ?? 'Pendiente'}{obra.duracionReal != null ? ' días' : ''}</strong></div><div className="mb-3"><span className="seguimiento-obra__finanzas-etiqueta">Atraso de obra</span>{obra.diasAtrasoTotal > 0 ? <strong className="seguimiento-obra__finanzas-valor text-danger">Atrasada por {obra.diasAtrasoTotal} día{obra.diasAtrasoTotal !== 1 ? 's' : ''}</strong> : <span className="seguimiento-obra__tiempo-badge">A tiempo</span>}</div><p className="text-muted small mb-0 mt-auto">{completadas} de {unidades.length} tareas completadas</p></div></div></div>
		</div>

		<section className="seguimiento-obra__panel" aria-labelledby="cronograma-titulo">
			<div className="seguimiento-obra__panel-encabezado"><div><p className="seguimiento-obra__eyebrow">Diagrama de avance</p><h2 id="cronograma-titulo">Cronograma de tareas</h2></div><p>El progreso se calcula con las tareas finales; las etapas que tienen subtareas se resumen a partir de ellas.</p></div>
			{obra.cronograma ? <div className="seguimiento-obra__gantt-scroll"><div className="seguimiento-obra__gantt">
				<div className="seguimiento-obra__gantt-fechas"><span>Tarea</span><div><span>{fechaCorta(fechaLocalISO(obra.cronograma.inicio))}</span><span>{fechaCorta(fechaLocalISO(obra.cronograma.fin))}</span></div></div>
				{obra.cronograma.tareas.map(({ tarea, izquierda, ancho, avance }) => {
					const estado = avance >= 100 ? 'Finalizada' : avance > 0 ? 'En ejecución' : 'Sin comenzar'
					const detalleUrl = `/principal/obras/${obra.id}/avance/tareas/${encodeURIComponent(tarea['id-tarea'])}`
					const estadoOrigen = { volverA: `/principal/obras/${obra.id}/avance` }
					return <div className="seguimiento-obra__gantt-fila" key={tarea['id-tarea']}><div className="seguimiento-obra__gantt-label"><Link className="seguimiento-obra__tarea-link" state={estadoOrigen} to={detalleUrl}><strong>{tarea.numeroOrden} · {formatoOracion(tarea.nombre)}</strong></Link><span className={`seguimiento-obra__gantt-estado ${claseAvance(avance)}`}><span>{estado}</span> · <b>{avance}%</b></span></div><div className="seguimiento-obra__gantt-pista"><Link state={estadoOrigen} to={detalleUrl} aria-label={`Ver detalle de ${formatoOracion(tarea.nombre)}`} className={`seguimiento-obra__gantt-barra ${claseAvance(avance)}`} style={{ left: `${izquierda}%`, width: `${ancho}%` }} title={`${formatoOracion(tarea.nombre)}: ${fechaCorta(tarea['fecha-inicio-estimada'])}–${fechaCorta(tarea['fecha-fin-estimada'])}`}><span style={{ width: `${avance}%` }} /></Link></div></div>
				})}
			</div></div> : <div className="seguimiento-obra__sin-cronograma">No hay tareas con fechas de inicio y fin para dibujar el cronograma. Abajo podés consultar los avances que sí están cargados.</div>}
		</section>

		<section className="seguimiento-obra__panel" aria-labelledby="etapas-titulo">
			{errorMutacion && <div className="alert alert-danger" role="alert">{errorMutacion}</div>}
			<div className="seguimiento-obra__panel-encabezado"><div><p className="seguimiento-obra__eyebrow">Detalle</p><h2 id="etapas-titulo">Etapas y subtareas</h2></div><span className="seguimiento-obra__contador">{etapas.length} etapas</span></div>
			{etapas.length ? <div className="seguimiento-obra__etapas">{etapas.map((etapa) => <details className={`seguimiento-obra__etapa ${claseAvance(etapa.avance)}`} key={etapa['id-tarea']}>
				<summary className="seguimiento-obra__etapa-cabecera"><div className="seguimiento-obra__etapa-titulo"><span>{etapa.numeroOrden}</span><div><h3><Link className="seguimiento-obra__tarea-link" state={{ volverA: `/principal/obras/${obra.id}/avance` }} to={`/principal/obras/${obra.id}/avance/tareas/${encodeURIComponent(etapa['id-tarea'])}`}>{formatoOracion(etapa.nombre)}</Link></h3><small>{etapa.subtareas.length ? `${etapa.subtareas.length} subtareas · desplegar para ver` : 'Sin subtareas · Ver detalle'}</small></div></div><div className={`seguimiento-obra__etapa-avance ${claseAvance(etapa.avance)}`}><strong>{etapa.avance}%</strong><div className={`seguimiento-obra__barra seguimiento-obra__barra--pequena ${claseAvance(etapa.avance)}`} role="progressbar" aria-label={`Avance de ${formatoOracion(etapa.nombre)}`} aria-valuenow={etapa.avance} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${etapa.avance}%` }} /></div></div></summary>
				<div className="seguimiento-obra__subtareas">{etapa.subtareas.length ? etapa.subtareas.map((tarea) => {
					const completada = estaCompletada(tarea)
					const inicioReal = tarea['fecha-inicio-real'] && tarea['fecha-inicio-real'] !== 'Sin fecha' ? tarea['fecha-inicio-real'] : ''
					const finReal = tarea['fecha-fin-real'] && tarea['fecha-fin-real'] !== 'Sin fecha' ? tarea['fecha-fin-real'] : ''
					const iniciada = Boolean(inicioReal)
					return <div className="seguimiento-obra__subtarea" key={tarea['id-tarea']}><div><span className="seguimiento-obra__subtarea-codigo">{codigoVisible(tarea, etapa)}</span><div className="d-flex flex-column"><Link className="seguimiento-obra__tarea-link" state={{ volverA: `/principal/obras/${obra.id}/avance` }} to={`/principal/obras/${obra.id}/avance/tareas/${encodeURIComponent(tarea['id-tarea'])}`}><strong>{formatoOracion(tarea.nombre)}</strong></Link>{!inicioReal && !finReal ? <small className="seguimiento-obra__fechas-vacias">Sin fechas reales cargadas</small> : <small className="text-muted">Inicio real: {inicioReal ? fechaCorta(inicioReal) : 'Pendiente'} · Fin real: {finReal ? fechaCorta(finReal) : 'Pendiente'}</small>}</div></div><span className={`seguimiento-obra__estado-tarea ${completada ? 'is-completa' : 'is-pendiente'}`}>{completada ? 'Completada' : inicioReal ? 'En ejecución' : 'No iniciada'}</span><div className="d-flex gap-2">{!iniciada && <button className="btn btn-sm seguimiento-obra__editar-avance" type="button" disabled={guardandoTarea} onClick={() => actualizarEstadoTareaSeguimiento(tarea, 'iniciar')}>Iniciar tarea</button>}{iniciada && <button className="btn btn-sm seguimiento-obra__editar-avance" type="button" disabled={guardandoTarea} onClick={() => actualizarEstadoTareaSeguimiento(tarea, completada ? 'reabrir' : 'completar')}>{completada ? 'Marcar no completada' : 'Marcar como completada'}</button>}</div></div>
				}) : <div className="alert alert-info mb-0 d-flex flex-wrap align-items-center justify-content-between gap-2"><span>Esta tarea no tiene subtareas. Su avance permanece en 0% hasta que agregues una.</span><Link className="btn btn-sm btn-outline-dark rounded-pill" to={`/principal/obras/${obra.id}/tareas`}>Agregar subtareas</Link></div>}</div>
			</details>)}</div> : <div className="seguimiento-obra__sin-cronograma">Esta obra todavía no tiene tareas cargadas.</div>}
		</section>
		<p className="seguimiento-obra__nota">El cronograma resume las fechas estimadas y el progreso de cada etapa.</p>
	</section>
}

export default SeguimientoObraPage
