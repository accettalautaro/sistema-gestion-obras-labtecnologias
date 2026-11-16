import { obtenerSesion } from '../../login/service/authService.js'
import { resumirAvanceTareas } from '../../../shared/utils/avanceObra.js'

function tokenActual() {
	const token = obtenerSesion()?.token
	if (!token) throw new Error('Tu sesión venció. Volvé a iniciar sesión.')
	return token
}

async function solicitar(ruta, opciones = {}) {
	let respuesta
	try {
		respuesta = await fetch(`/api${ruta}`, {
			...opciones,
			headers: {
				...(opciones.body ? { 'Content-Type': 'application/json' } : {}),
				...(opciones.token ? { Authorization: `Bearer ${opciones.token}` } : {}),
				...opciones.headers,
			},
		})
	} catch {
		throw new Error('No se pudo conectar con el servidor. Verificá que el backend esté iniciado.')
	}
	if (respuesta.status === 204) return null
	const datos = await respuesta.json().catch(() => ({}))
	if (!respuesta.ok) {
		const error = new Error(datos.error || 'No se pudo completar la operación de obras.')
		error.status = respuesta.status
		throw error
	}
	return datos
}

function normalizarFechaTarea(valor) {
	if (!valor) return ''
	const texto = valor instanceof Date ? (Number.isNaN(valor.getTime()) ? '' : valor.toISOString()) : String(valor)
	const fecha = texto.slice(0, 10)
	if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return ''
	const validada = new Date(`${fecha}T00:00:00Z`)
	return Number.isNaN(validada.getTime()) || validada.toISOString().slice(0, 10) !== fecha ? '' : fecha
}

function convertirTareas(obraApi) {
	return (obraApi?.tareas ?? []).flatMap((tarea) => {
		const inicioRealTarea = normalizarFechaTarea(tarea.fecha_inicio_real_tarea)
		const finRealTarea = normalizarFechaTarea(tarea.fecha_fin_real_tarea)
		const principal = {
			'id-obra': String(obraApi.id_obra), 'id-tarea': String(tarea.id_tarea),
			nombre: tarea.nombre_tarea, descripcion: tarea.descripcion_tarea,
			porcentaje: `${Number(tarea.porcentaje_tarea) || 0}%`,
			estado: finRealTarea ? 'finalizada' : inicioRealTarea ? 'en ejecucion' : 'sin comenzar',
			'fecha-inicio': normalizarFechaTarea(tarea.fecha_inicio_tarea), 'fecha-fin': normalizarFechaTarea(tarea.fecha_fin_tarea),
			'fecha-inicio-estimada': normalizarFechaTarea(tarea.fecha_inicio_tarea), 'fecha-fin-estimada': normalizarFechaTarea(tarea.fecha_fin_tarea),
			'fecha-inicio-real': inicioRealTarea, 'fecha-fin-real': finRealTarea,
			'duracion-estimada': tarea.duracion_estimada_tarea, 'duracion-real': tarea.duracion_real_tarea,
			'costo-estimado': tarea.costo_estimado_tarea, 'costo-real': tarea.costo_real_tarea,
			_persistida: true,
		}
		const subtareas = (tarea.subtareas ?? []).map((subtarea) => {
			const inicioReal = normalizarFechaTarea(subtarea.fecha_inicio_real_subtarea)
			const finReal = normalizarFechaTarea(subtarea.fecha_fin_real_subtarea)
			return {
				...principal, 'id-tarea': `${tarea.id_tarea}_${subtarea.id_subtarea}`,
				nombre: subtarea.nombre_subtarea, descripcion: subtarea.descripcion_subtarea,
				porcentaje: `${Number(subtarea.porcentaje_subtarea) || 0}%`,
				estado: finReal ? 'finalizada' : inicioReal ? 'en ejecucion' : 'sin comenzar',
				'fecha-inicio': normalizarFechaTarea(subtarea.fecha_inicio_subtarea), 'fecha-fin': normalizarFechaTarea(subtarea.fecha_fin_subtarea),
				'fecha-inicio-estimada': normalizarFechaTarea(subtarea.fecha_inicio_subtarea), 'fecha-fin-estimada': normalizarFechaTarea(subtarea.fecha_fin_subtarea),
				'fecha-inicio-real': inicioReal, 'fecha-fin-real': finReal,
				'duracion-estimada': subtarea.duracion_estimada_subtarea, 'duracion-real': subtarea.duracion_real_subtarea,
				'costo-estimado': subtarea.costo_estimado_subtarea, 'costo-real': subtarea.costo_real_subtarea,
				_dbSubtareaId: subtarea.id_subtarea,
			}
		})
		return [principal, ...subtareas]
	})
}

export function convertirObra(obra, tareas = []) {
	const resumen = resumirAvanceTareas(tareas)
	const avance = resumen.avance
	const estadoOriginal = String(obra.estado ?? '').trim()
	const estadoNormalizado = estadoOriginal.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
	const unidades = resumen.unidades
	const fechaInicioEstimada = normalizarFechaTarea(obra.fecha_inicio_estimada)
	const fechaFinEstimada = normalizarFechaTarea(obra.fecha_fin_estimada)
	const fechaMinima = (campo) => unidades.map((tarea) => tarea[campo]).filter(Boolean).sort()[0] ?? ''
	const fechaMaxima = (campo) => unidades.map((tarea) => tarea[campo]).filter(Boolean).sort().at(-1) ?? ''
	const todasCompletas = resumen.etapas.length > 0 && resumen.etapas.every((tarea) => tarea.avance >= 100)
	const fechaInicioReal = fechaMinima('fecha-inicio-real')
	const fechaFinReal = todasCompletas ? fechaMaxima('fecha-fin-real') : ''
	const duracionInclusiva = (inicio, fin) => {
		if (!inicio || !fin) return null
		const dias = (Date.parse(`${fin}T00:00:00Z`) - Date.parse(`${inicio}T00:00:00Z`)) / 86400000
		return Number.isFinite(dias) && dias >= 0 ? dias + 1 : null
	}
	const duracionEstimada = duracionInclusiva(fechaInicioEstimada, fechaFinEstimada)
	const estado = estadoNormalizado.includes('paus') || estadoNormalizado.includes('suspend')
		? 'Pausada'
		: estadoNormalizado.includes('cancel')
			? 'Cancelada'
			: todasCompletas
				? 'Finalizada'
				: fechaInicioReal
					? 'En ejecución'
					: 'No Inicio'
	return {
		'id-obra': String(obra.id_obra), 'id-cliente': String(obra.id_cliente),
		'id-arquitecto': obra.id_arquitecto == null ? '' : String(obra.id_arquitecto),
		'id-lote': obra.id_lote == null ? '' : String(obra.id_lote),
		_loteId: obra.id_lote == null ? '' : String(obra.id_lote),
		nrolote: obra.nro_lote ?? '', 'fecha-inicio': fechaInicioEstimada,
		'fecha-fin': fechaFinEstimada,
		'fecha-inicio-estimada': fechaInicioEstimada,
		'fecha-fin-estimada': fechaFinEstimada,
		'fecha-inicio-real': fechaInicioReal, 'fecha-fin-real': fechaFinReal,
		Estado: estado, nombre: obra.nombre ?? '', Descripcion: obra.descripcion ?? '',
		descripcion: obra.descripcion ?? '', porcentaje: `${avance}%`,
		costoEstimadoTotal: unidades.reduce((total, tarea) => total + (Number(tarea['costo-estimado']) || 0), 0),
		montoAbonado: unidades.reduce((total, tarea) => total + (Number(tarea['costo-real']) || 0), 0),
		duracionEstimada: duracionEstimada,
		duracionReal: duracionInclusiva(fechaInicioReal, fechaFinReal),
		clienteNombre: [obra.cliente_nombre, obra.cliente_apellido].filter(Boolean).join(' '),
		arquitectoNombre: [obra.arquitecto_nombre, obra.arquitecto_apellido].filter(Boolean).join(' '),
		tareas,
	}
}

async function obtenerTareasObra(idObra, token) {
	try {
		return convertirTareas(await solicitar(`/obras/${idObra}/tareas`, { token }))
	} catch (error) {
		if (error.status === 404) return []
		throw error
	}
}

export async function listarObras() {
	const token = tokenActual()
	const [obrasApi, clientesApi, terrenosApi] = await Promise.all([
		solicitar('/obras'), solicitar('/clientes', { token }), solicitar('/terrenos', { token }),
	])
	const obras = await Promise.all(obrasApi.map(async (obra) => convertirObra(obra, await obtenerTareasObra(obra.id_obra, token))))
	const clientes = clientesApi.map((cliente) => ({
		'id-cliente': String(cliente.id_cliente), nombre: cliente.nombre, apellido: cliente.apellido,
	}))
	const arquitectos = [...new Map(obrasApi.filter((obra) => obra.id_arquitecto != null).map((obra) => [
		String(obra.id_arquitecto), {
			'id-arquitecto': String(obra.id_arquitecto), nombre: obra.arquitecto_nombre, apellido: obra.arquitecto_apellido,
		},
	])).values()]
	const lotes = terrenosApi.map((lote) => ({
		id: String(lote.id_lote), 'id-lote': String(lote.id_lote), nrolote: lote.nro_lote,
		direccion: lote.direccion,
	}))
	return { obras, clientes, arquitectos, lotes }
}

function payloadObra(formulario) {
	return {
		nombre: String(formulario.nombre ?? '').trim(),
		id_cliente: Number(formulario['id-cliente']), id_arquitecto: Number(formulario['id-arquitecto']),
		id_lote: (formulario['id-lote'] ?? formulario.loteId) ? Number(formulario['id-lote'] ?? formulario.loteId) : null,
		fecha_inicio_estimada: formulario['fecha-inicio'] || formulario['fecha-inicio-estimada'] || null,
		fecha_fin_estimada: formulario['fecha-fin'] || formulario['fecha-fin-estimada'] || null,
		descripcion: formulario.descripcion || formulario.Descripcion || null,
	}
}

export async function crearObra(formulario) {
	return solicitar('/obras', { method: 'POST', token: tokenActual(), body: JSON.stringify(payloadObra(formulario)) })
}

export async function actualizarObra(id, formulario) {
	return solicitar(`/obras/${id}`, { method: 'PUT', token: tokenActual(), body: JSON.stringify(payloadObra(formulario)) })
}

export async function eliminarObra(id) {
	return solicitar(`/obras/${id}`, { method: 'DELETE', token: tokenActual() })
}

export async function obtenerObra(id) {
	return solicitar(`/obras/${id}`)
}

export async function listarTareasDeObra(id) {
	const obras = await listarObras()
	return obras.obras.find((obra) => String(obra['id-obra']) === String(id))?.tareas ?? []
}

export async function actualizarEstadoSeguimiento(id, accion) {
	return solicitar(`/obras/${id}/estado`, {
		method: 'PATCH',
		token: tokenActual(),
		body: JSON.stringify({ accion }),
	})
}
