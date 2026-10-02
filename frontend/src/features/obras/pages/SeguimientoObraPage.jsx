import { useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { useFetch } from '../../../shared/hooks/useFetch'
import { porcentajeTarea } from '../../../shared/utils/avanceObra.js'
import { obtenerSeguimientoObra } from '../services/seguimientoService.js'
import '../../../styles/SeguimientoObra.css'

function fechaCorta(valor) {
	if (!valor) return 'Sin fecha'
	const [anio, mes, dia] = String(valor).split('-').map(Number)
	if (!anio || !mes || !dia) return 'Sin fecha'
	return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(anio, mes - 1, dia))
}

function codigoVisible(id) { return String(id ?? '').replaceAll('-', '.').replaceAll(',', '.') }

function avanceTarea(tarea) {
	return porcentajeTarea(tarea)
}

function estaCompletada(tarea) {
	const estado = String(tarea.estado ?? '').toLowerCase()
	return ['finalizada', 'completada', 'completado'].includes(estado) || avanceTarea(tarea) >= 100
}

function tareaConEstado(tarea, completada) {
	return { ...tarea, porcentaje: completada ? '100%' : '0%', estado: completada ? 'finalizada' : 'sin comenzar' }
}

function SeguimientoObraPage() {
	const { esArquitecto } = useOutletContext()
	const { id } = useParams()
	const { datos: obra, cargando, error } = useFetch(obtenerSeguimientoObra, id)
	const [estadosPorObra, setEstadosPorObra] = useState({})
	const estadosTemporales = estadosPorObra[id] ?? {}

	if (esArquitecto === null) return <p className="seguimiento-obra__estado" role="status">Verificando acceso de arquitecto...</p>
	if (!esArquitecto) return <div className="alert alert-danger" role="alert">Esta pantalla está disponible únicamente para cuentas vinculadas a un arquitecto.</div>
	if (cargando) return <p className="seguimiento-obra__estado" role="status">Cargando seguimiento de obra...</p>
	if (error) return <div className="alert alert-danger" role="alert">{error.message}</div>
	if (!obra) return <div className="alert alert-warning" role="alert">No se encontró la obra solicitada.</div>

	const etapas = obra.etapas.map((etapa) => {
		const subtareas = etapa.subtareas.map((tarea) => tareaConEstado(tarea, estadosTemporales[tarea['id-tarea']] ?? estaCompletada(tarea)))
		const etapaEditada = tareaConEstado(etapa, estadosTemporales[etapa['id-tarea']] ?? estaCompletada(etapa))
		const unidades = subtareas.length ? subtareas : [etapaEditada]
		const completadasEtapa = unidades.filter(estaCompletada).length
		const avance = unidades.length ? Math.round((completadasEtapa / unidades.length) * 100) : 0
		return { ...etapaEditada, avance, subtareas, unidades }
	})
	const unidades = etapas.flatMap((etapa) => etapa.unidades)
	const completadas = unidades.filter(estaCompletada).length
	const avanceGeneral = unidades.length ? Math.round((completadas / unidades.length) * 100) : 0
	const alternarEstadoTarea = (tarea) => {
		setEstadosPorObra((actuales) => ({
			...actuales,
			[id]: {
				...(actuales[id] ?? {}),
				[tarea['id-tarea']]: !(estadosTemporales[tarea['id-tarea']] ?? estaCompletada(tarea)),
			},
		}))
	}

	return <section className="seguimiento-obra">
		<header className="seguimiento-obra__header">
			<Link to="/principal/obras" className="seguimiento-obra__volver" aria-label="Volver a gestión de obras">←</Link>
			<div className="seguimiento-obra__encabezado-texto"><p className="seguimiento-obra__eyebrow">Seguimiento de obra</p><h1>Obra #{obra.id} · Lote {obra.nrolote}</h1><p>{obra.direccion}</p></div>
			<span className={`seguimiento-obra__estado-badge ${obra.estado.toLowerCase().includes('final') ? 'seguimiento-obra__estado-badge--finalizada' : ''}`}>{obra.estado}</span>
		</header>

		<section className="seguimiento-obra__resumen" aria-label="Resumen del avance">
			<div className="seguimiento-obra__avance-card"><div className="seguimiento-obra__avance-cabecera"><div><p className="seguimiento-obra__eyebrow">Avance general</p><h2>{avanceGeneral}<span>%</span></h2></div><span className="seguimiento-obra__circulo" aria-hidden="true">↗</span></div>
				<div className="seguimiento-obra__barra" role="progressbar" aria-label={`Avance general de la obra ${obra.id}`} aria-valuenow={avanceGeneral} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${avanceGeneral}%` }} /></div>
				<p>{completadas} de {unidades.length} tareas de seguimiento completadas</p>
			</div>
			<div className="seguimiento-obra__dato"><span>Cliente</span><strong>{obra.cliente}</strong></div>
			<div className="seguimiento-obra__dato"><span>Arquitecto</span><strong>{obra.arquitecto}</strong></div>
			<div className="seguimiento-obra__dato"><span>Inicio previsto</span><strong>{fechaCorta(obra.fechaInicio)}</strong></div>
		</section>

		<section className="seguimiento-obra__panel" aria-labelledby="cronograma-titulo">
			<div className="seguimiento-obra__panel-encabezado"><div><p className="seguimiento-obra__eyebrow">Diagrama de avance</p><h2 id="cronograma-titulo">Cronograma de tareas</h2></div><p>El progreso se calcula con las tareas finales; las etapas que tienen subtareas se resumen a partir de ellas.</p></div>
			{obra.cronograma ? <div className="seguimiento-obra__gantt-scroll"><div className="seguimiento-obra__gantt">
				<div className="seguimiento-obra__gantt-fechas"><span>Tarea</span><div><span>{fechaCorta(obra.cronograma.inicio.toISOString().slice(0, 10))}</span><span>{fechaCorta(obra.cronograma.fin.toISOString().slice(0, 10))}</span></div></div>
				{etapas.map((etapa) => {
					const barra = obra.cronograma.tareas.find((item) => String(item.tarea['id-tarea']) === String(etapa['id-tarea']))
					if (!barra) return null
					const estado = etapa.avance >= 100 ? 'Finalizada' : etapa.avance > 0 ? 'En ejecución' : 'Sin comenzar'
					return <div className="seguimiento-obra__gantt-fila" key={etapa['id-tarea']}><div className="seguimiento-obra__gantt-label"><strong>{codigoVisible(etapa['id-tarea'])} · {etapa.nombre}</strong><span>{estado} · {etapa.avance}%</span></div><div className="seguimiento-obra__gantt-pista"><span className={`seguimiento-obra__gantt-barra ${etapa.avance >= 100 ? 'is-completa' : etapa.avance > 0 ? 'is-activa' : ''}`} style={{ left: `${barra.izquierda}%`, width: `${barra.ancho}%` }} title={`${etapa.nombre}: ${fechaCorta(etapa['fecha-inicio'])}–${fechaCorta(etapa['fecha-fin'])}`}><span style={{ width: `${etapa.avance}%` }} /></span></div></div>
				})}
			</div></div> : <div className="seguimiento-obra__sin-cronograma">No hay tareas con fechas de inicio y fin para dibujar el cronograma. Abajo podés consultar los avances que sí están cargados.</div>}
		</section>

		<section className="seguimiento-obra__panel" aria-labelledby="etapas-titulo">
			<div className="seguimiento-obra__panel-encabezado"><div><p className="seguimiento-obra__eyebrow">Detalle</p><h2 id="etapas-titulo">Etapas y subtareas</h2></div><span className="seguimiento-obra__contador">{etapas.length} etapas</span></div>
			{etapas.length ? <div className="seguimiento-obra__etapas">{etapas.map((etapa) => <details className="seguimiento-obra__etapa" key={etapa['id-tarea']}>
				<summary className="seguimiento-obra__etapa-cabecera"><div className="seguimiento-obra__etapa-titulo"><span>{codigoVisible(etapa['id-tarea'])}</span><div><h3>{etapa.nombre}</h3><small>{etapa.subtareas.length ? `${etapa.subtareas.length} subtareas · clic para ver` : 'Sin subtareas · clic para ver'}</small></div></div><div className="seguimiento-obra__etapa-avance"><strong>{etapa.avance}%</strong><div className="seguimiento-obra__barra seguimiento-obra__barra--pequena" role="progressbar" aria-label={`Avance de ${etapa.nombre}`} aria-valuenow={etapa.avance} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${etapa.avance}%` }} /></div></div></summary>
					<div className="seguimiento-obra__subtareas">{(etapa.subtareas.length ? etapa.subtareas : [etapa]).map((tarea) => {
						const completada = estaCompletada(tarea)
						return <div className="seguimiento-obra__subtarea" key={tarea['id-tarea']}><div><span className="seguimiento-obra__subtarea-codigo">{codigoVisible(tarea['id-tarea'])}</span><strong>{tarea.nombre}</strong></div><span className={`seguimiento-obra__estado-tarea ${completada ? 'is-completa' : 'is-pendiente'}`}>{completada ? 'Completada' : 'No completada'}</span><button className="btn btn-sm seguimiento-obra__editar-avance" type="button" onClick={() => alternarEstadoTarea(tarea)}>{completada ? 'Marcar no completada' : 'Marcar completada'}</button></div>
					})}</div>
			</details>)}</div> : <div className="seguimiento-obra__sin-cronograma">Esta obra todavía no tiene tareas cargadas.</div>}
		</section>
		<p className="seguimiento-obra__nota">El porcentaje de cada etapa y de la obra se calcula según la cantidad de subtareas completadas. Los cambios de estado duran mientras esta pantalla está abierta; sin backend, no se guardan en los JSON.</p>
	</section>
}

export default SeguimientoObraPage
