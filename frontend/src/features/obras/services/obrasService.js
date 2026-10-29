import { obtenerSesion } from '../../login/service/authService.js'
import { resumirAvanceTareas } from '../../../shared/utils/avanceObra.js'

const API_URL = (import.meta.env?.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '')

function tokenActual() {
	const token = obtenerSesion()?.token
	if (!token) throw new Error('Tu sesión venció. Volvé a iniciar sesión.')
	return token
}

async function solicitar(ruta, opciones = {}) {
	let respuesta
	try {
		respuesta = await fetch(`${API_URL}${ruta}`, {
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

function convertirTareas(obraApi) {
	return (obraApi?.tareas ?? []).flatMap((tarea) => {
		const principal = {
			'id-obra': String(obraApi.id_obra), 'id-tarea': String(tarea.id_tarea),
			nombre: tarea.nombre_tarea, descripcion: tarea.descripcion_tarea,
			porcentaje: tarea.porcentaje_tarea, estado: tarea.estado,
			'fecha-inicio': tarea.fecha_inicio_tarea, 'fecha-fin': tarea.fecha_fin_tarea,
			'duracion-estimada': tarea.duracion_estimada_tarea, 'duracion-real': tarea.duracion_real_tarea,
			'costo-estimado': tarea.costo_estimado_tarea, 'costo-real': tarea.costo_real_tarea,
		}
		const subtareas = (tarea.subtareas ?? []).map((subtarea) => ({
			...principal, 'id-tarea': `${tarea.id_tarea}_${subtarea.id_subtarea}`,
			nombre: subtarea.nombre_subtarea, descripcion: subtarea.descripcion_subtarea,
			porcentaje: subtarea.porcentaje_subtarea, estado: subtarea.estado,
			'fecha-inicio': subtarea.fecha_inicio_subtarea, 'fecha-fin': subtarea.fecha_fin_subtarea,
			'duracion-estimada': subtarea.duracion_estimada_subtarea, 'duracion-real': subtarea.duracion_real_subtarea,
			'costo-estimado': subtarea.costo_estimado_subtarea, 'costo-real': subtarea.costo_real_subtarea,
		}))
		return [principal, ...subtareas]
	})
}

function convertirObra(obra, tareas = []) {
	const avance = resumirAvanceTareas(tareas).avance
	const fechaParaFormulario = (fecha) => {
		if (!fecha) return ''
		const valor = fecha instanceof Date ? fecha.toISOString() : String(fecha)
		return valor.slice(0, 10)
	}
	return {
		'id-obra': String(obra.id_obra), 'id-cliente': String(obra.id_cliente),
		'id-arquitecto': obra.id_arquitecto == null ? '' : String(obra.id_arquitecto),
		'id-lote': obra.id_lote == null ? '' : String(obra.id_lote),
		nrolote: obra.nro_lote ?? '', 'fecha-inicio': fechaParaFormulario(obra.fecha_inicio),
		'fecha-fin': fechaParaFormulario(obra.fecha_fin), Estado: obra.estado ?? 'pendiente',
		descripcion: obra.descripcion ?? '', porcentaje: `${avance}%`,
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
		'id-lote': String(lote.id_lote), nrolote: lote.nro_lote,
		idObra: lote.id_obra == null ? '' : String(lote.id_obra), direccion: lote.direccion,
	}))
	return { obras, clientes, arquitectos, lotes }
}

function payloadObra(formulario) {
	return {
		id_cliente: Number(formulario['id-cliente']), id_arquitecto: Number(formulario['id-arquitecto']),
		id_lote: formulario['id-lote'] ? Number(formulario['id-lote']) : null,
		fecha_inicio: formulario['fecha-inicio'] || null, fecha_fin: formulario['fecha-fin'] || null,
		estado: formulario.Estado, descripcion: formulario.descripcion || null,
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
