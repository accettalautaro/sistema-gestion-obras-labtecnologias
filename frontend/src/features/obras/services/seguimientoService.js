import { resumirAvanceTareas, porcentajeTarea } from '../../../shared/utils/avanceObra.js'
import { listarObras } from './obrasService.js'

function fechaLocal(fecha) {
	if (!fecha) return null
	const [anio, mes, dia] = String(fecha).split('-').map(Number)
	if (!anio || !mes || !dia) return null
	return new Date(anio, mes - 1, dia)
}

function construirCronograma(etapas) {
	const conFechas = etapas.map((tarea) => ({ tarea, inicio: fechaLocal(tarea['fecha-inicio']), fin: fechaLocal(tarea['fecha-fin']) }))
		.filter(({ inicio, fin }) => inicio && fin && fin >= inicio)
	if (!conFechas.length) return null
	const minimo = new Date(Math.min(...conFechas.map(({ inicio }) => inicio.getTime())))
	const maximo = new Date(Math.max(...conFechas.map(({ fin }) => fin.getTime())))
	const totalDias = Math.max(1, (maximo - minimo) / 86400000)
	return {
		inicio: minimo,
		fin: maximo,
		tareas: conFechas.map(({ tarea, inicio, fin }) => ({
			tarea,
			izquierda: ((inicio - minimo) / 86400000 / totalDias) * 100,
			ancho: Math.max(1, ((fin - inicio) / 86400000 / totalDias) * 100),
			avance: tarea.avance ?? porcentajeTarea(tarea),
		})),
	}
}

export async function obtenerSeguimientoObra(idObra) {
	const { obras, lotes } = await listarObras()
	const obra = obras.find((item) => String(item['id-obra']) === String(idObra))
	if (!obra) throw new Error(`No se encontró la obra #${idObra}.`)

	const { etapas, completadas, total, avance } = resumirAvanceTareas(obra.tareas)
	const lote = lotes.find((item) => String(item['id-lote']) === String(obra['id-lote']))
	const direccion = lote?.direccion
	const direccionCompleta = direccion
		? [direccion.calle && `${direccion.calle} ${direccion.altura ?? ''}`.trim(), direccion.localidad, direccion.provincia].filter(Boolean).join(', ')
		: 'Sin dirección registrada'

	return {
		id: obra['id-obra'],
		nrolote: obra.nrolote || '—',
		estado: obra.Estado ?? 'Sin estado',
		fechaInicio: obra['fecha-inicio'] ?? '',
		fechaFin: obra['fecha-fin'] ?? '',
		cliente: obra.clienteNombre || `Cliente #${obra['id-cliente']}`,
		arquitecto: obra.arquitectoNombre || `Arquitecto #${obra['id-arquitecto']}`,
		direccion: direccionCompleta,
		avance,
		completadas,
		total,
		etapas,
		cronograma: construirCronograma(etapas),
	}
}
