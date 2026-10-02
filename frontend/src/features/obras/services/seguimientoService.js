import { resumirAvanceTareas, porcentajeTarea } from '../../../shared/utils/avanceObra.js'

const URL_BASE = '/Back/data'

async function leerJson(nombre) {
	const respuesta = await fetch(`${URL_BASE}/${nombre}.json`)
	if (!respuesta.ok) throw new Error(`No se pudieron cargar los datos de ${nombre}.`)
	const datos = await respuesta.json()
	return Array.isArray(datos) ? datos : []
}

function fechaLocal(fecha) {
	if (!fecha) return null
	const [anio, mes, dia] = String(fecha).split('-').map(Number)
	if (!anio || !mes || !dia) return null
	return new Date(anio, mes - 1, dia)
}

function construirCronograma(etapas) {
	const tareas = etapas
	const conFechas = tareas.map((tarea) => ({ tarea, inicio: fechaLocal(tarea['fecha-inicio']), fin: fechaLocal(tarea['fecha-fin']) }))
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
	const [obras, clientes, arquitectos, direcciones, tareas] = await Promise.all([
		leerJson('obras'),
		leerJson('clientes'),
		leerJson('arquitectos'),
		leerJson('direcciones'),
		leerJson('tareas'),
	])
	const obra = obras.find((item) => String(item['id-obra']) === String(idObra))
	if (!obra) throw new Error(`No se encontró la obra #${idObra}.`)

	const tareasObra = tareas.filter((tarea) => String(tarea['id-obra']) === String(obra['id-obra']))
	const { etapas, completadas, total, avance } = resumirAvanceTareas(tareasObra)
	const cliente = clientes.find((item) => String(item['id-cliente']) === String(obra['id-cliente']))
	const arquitecto = arquitectos.find((item) => String(item['id-arquitecto']) === String(obra['id-arquitecto']))
	const direccion = direcciones.find((item) => String(item.nrolote) === String(obra.nrolote))
	const direccionCompleta = direccion
		? [direccion.calle && `${direccion.calle} ${direccion.altura ?? ''}`.trim(), direccion.localidad, direccion.provincia].filter(Boolean).join(', ')
		: 'Sin dirección registrada'

	return {
		id: obra['id-obra'],
		nrolote: obra.nrolote,
		estado: obra.Estado ?? 'Sin estado',
		fechaInicio: obra['fecha-inicio'] ?? '',
		fechaFin: obra['fecha-fin'] ?? '',
		cliente: cliente ? `${cliente.nombre ?? ''} ${cliente.apellido ?? ''}`.trim() : 'Sin cliente asignado',
		arquitecto: arquitecto ? `${arquitecto.nombre ?? ''} ${arquitecto.apellido ?? ''}`.trim() : 'Sin arquitecto asignado',
		direccion: direccionCompleta,
		avance,
		completadas,
		total,
		etapas,
		cronograma: construirCronograma(etapas),
	}
}
