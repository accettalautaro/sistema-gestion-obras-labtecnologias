import { obtenerSesion } from '../../login/service/authService.js'

const URL_BASE = (import.meta.env?.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '')

const normalizarCliente = (cliente) => {
	if (!cliente || typeof cliente !== 'object') {
		throw new Error('El servidor devolvió un cliente inválido.')
	}
	const normalizado = {
		'id-cliente': cliente.id_cliente ?? cliente['id-cliente'],
		'id-usuario': cliente.id_usuario ?? cliente['id-usuario'] ?? null,
		nombre: cliente.nombre,
		apellido: cliente.apellido,
		dni: cliente.dni,
		telefono: cliente.telefono ?? '',
		email: cliente.email ?? '',
	}
	if (normalizado['id-cliente'] == null) {
		throw new Error('El servidor devolvió un cliente sin identificador.')
	}
	return normalizado
}

async function solicitar(ruta, opciones = {}) {
	const sesion = obtenerSesion()
	if (!sesion?.token) throw new Error('La sesión no está disponible. Iniciá sesión nuevamente.')

	let respuesta
	try {
		respuesta = await fetch(`${URL_BASE}${ruta}`, {
			...opciones,
			headers: {
				Authorization: `Bearer ${sesion.token}`,
				...(opciones.body ? { 'Content-Type': 'application/json' } : {}),
				...opciones.headers,
			},
		})
	} catch {
		throw new Error('No se pudo conectar con el servidor. Intentá más tarde.')
	}

	const texto = await respuesta.text()
	let datos = null
	if (texto) {
		try {
			datos = JSON.parse(texto)
		} catch {
			throw new Error('El servidor devolvió una respuesta inválida.')
		}
	}
	if (!respuesta.ok) {
		throw Object.assign(new Error(datos?.error || 'No se pudo completar la solicitud.'), {
			status: respuesta.status,
		})
	}
	return datos
}

export async function listarClientes() {
	const respuesta = await solicitar('/clientes')
	if (!Array.isArray(respuesta)) throw new Error('El servidor devolvió una lista de clientes inválida.')
	return { listaClientes: respuesta.map(normalizarCliente) }
}

export async function obtenerPerfilCliente() {
	return normalizarCliente(await solicitar('/clientes/perfil'))
}

export async function crearCliente(cliente) {
	return normalizarCliente(await solicitar('/clientes', {
		method: 'POST',
		body: JSON.stringify(cliente),
	}))
}

export async function actualizarCliente(id, cliente) {
	return normalizarCliente(await solicitar(`/clientes/${encodeURIComponent(id)}`, {
		method: 'PUT',
		body: JSON.stringify(cliente),
	}))
}

export async function eliminarCliente(id) {
	await solicitar(`/clientes/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function crearUsuarioCliente(id, usuario) {
	return normalizarCliente(await solicitar(`/auth/clientes/${encodeURIComponent(id)}/usuario`, {
		method: 'POST',
		body: JSON.stringify({ usuario }),
	}))
}
