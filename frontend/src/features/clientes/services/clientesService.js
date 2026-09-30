const CLIENTES_KEY = 'gestion-clientes:clientes:v1'
const USUARIOS_KEY = 'gestion-clientes:usuarios:v1'

async function leerColeccion(key, url) {
	const guardado = localStorage.getItem(key)
	if (guardado !== null) return JSON.parse(guardado)

	const response = await fetch(url)
	if (!response.ok) throw new Error('No se pudieron cargar los datos iniciales.')
	const data = await response.json()
	localStorage.setItem(key, JSON.stringify(data))
	return data
}

function validarPerfil(datos, incluirPassword = false) {
	const perfil = {
		nombre: String(datos.nombre ?? '').trim(),
		apellido: String(datos.apellido ?? '').trim(),
		dni: String(datos.dni ?? '').trim(),
		telefono: String(datos.telefono ?? '').trim(),
		email: String(datos.email ?? '').trim(),
	}

	if (Object.values(perfil).some((valor) => !valor)) throw new Error('Completá todos los datos del cliente.')
	if (!/^\d+$/.test(perfil.dni)) throw new Error('El DNI debe contener solo números.')
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(perfil.email)) throw new Error('Ingresá un email válido.')
	if (incluirPassword && String(datos.password ?? '').trim().length < 8) {
		throw new Error('La contraseña inicial debe tener al menos 8 caracteres.')
	}

	return perfil
}

function validarDniDisponible(perfil, clientes, usuarios, clienteActual, usuarioActual) {
	const existeCliente = clientes.some((cliente) =>
		String(cliente['id-cliente']) !== String(clienteActual?.['id-cliente']) && String(cliente.dni) === perfil.dni,
	)
	const existeUsuario = usuarios.some((usuario) =>
		String(usuario.id) !== String(usuarioActual?.id) && String(usuario.dni) === perfil.dni,
	)
	if (existeCliente || existeUsuario) throw new Error('Ya existe otra cuenta o perfil con ese DNI.')
}

function guardarColecciones(clientes, usuarios) {
	const anteriores = [localStorage.getItem(CLIENTES_KEY), localStorage.getItem(USUARIOS_KEY)]
	try {
		localStorage.setItem(CLIENTES_KEY, JSON.stringify(clientes))
		localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuarios))
	} catch (error) {
		for (const [index, key] of [CLIENTES_KEY, USUARIOS_KEY].entries()) {
			if (anteriores[index] === null) localStorage.removeItem(key)
			else localStorage.setItem(key, anteriores[index])
		}
		throw error
	}
}

function siguienteId(registros, campo) {
	return Math.max(0, ...registros.map((registro) => Number(registro[campo]) || 0)) + 1
}

async function leerObras() {
	const response = await fetch('/Back/data/obras.json')
	if (!response.ok) throw new Error('No se pudieron verificar las obras asociadas.')
	const data = await response.json()
	return Array.isArray(data) ? data : (data.obras ?? [])
}

export async function listarClientes() {
	const clientes = await leerColeccion(CLIENTES_KEY, '/Back/data/clientes.json')
	const listaClientes = clientes.map((cliente) => ({
		'id-cliente': cliente['id-cliente'],
		'id-usuario': cliente['id-usuario'],
		nombre: cliente.nombre,
		apellido: cliente.apellido,
		dni: cliente.dni,
		telefono: cliente.telefono,
		email: cliente.email,
	}))
	return { listaClientes }
}

export async function crearCliente(datos) {
	const perfil = validarPerfil(datos, true)
	const [clientes, usuarios] = await Promise.all([
		leerColeccion(CLIENTES_KEY, '/Back/data/clientes.json'),
		leerColeccion(USUARIOS_KEY, '/Back/data/usuarios.json'),
	])
	validarDniDisponible(perfil, clientes, usuarios)

	const idCliente = siguienteId(clientes, 'id-cliente')
	const idUsuario = siguienteId(usuarios, 'id')
	const cliente = { 'id-cliente': idCliente, 'id-usuario': idUsuario, ...perfil }
	const usuario = {
		id: idUsuario,
		nombre: perfil.nombre,
		dni: perfil.dni,
		password: String(datos.password),
		rol: 'cliente',
	}
	guardarColecciones([...clientes, cliente], [...usuarios, usuario])
	return cliente
}

export async function actualizarCliente(id, datos) {
	const perfil = validarPerfil(datos)
	const [clientes, usuarios] = await Promise.all([
		leerColeccion(CLIENTES_KEY, '/Back/data/clientes.json'),
		leerColeccion(USUARIOS_KEY, '/Back/data/usuarios.json'),
	])
	const cliente = clientes.find((item) => String(item['id-cliente']) === String(id))
	if (!cliente) throw new Error('No se encontró el perfil de cliente.')
	const usuario = usuarios.find((item) => String(item.id) === String(cliente['id-usuario']))
	if (!usuario) throw new Error('Este perfil no tiene una cuenta local asociada.')
	validarDniDisponible(perfil, clientes, usuarios, cliente, usuario)

	const actualizado = { ...cliente, ...perfil }
	guardarColecciones(
		clientes.map((item) => item === cliente ? actualizado : item),
		usuarios.map((item) => String(item.id) === String(usuario.id)
			? { ...item, nombre: perfil.nombre, dni: perfil.dni }
			: item),
	)
	return actualizado
}

export async function eliminarCliente(id) {
	const [clientes, usuarios, obras] = await Promise.all([
		leerColeccion(CLIENTES_KEY, '/Back/data/clientes.json'),
		leerColeccion(USUARIOS_KEY, '/Back/data/usuarios.json'),
		leerObras(),
	])
	const cliente = clientes.find((item) => String(item['id-cliente']) === String(id))
	if (!cliente) throw new Error('No se encontró el perfil de cliente.')
	const obrasAsociadas = obras.filter((obra) => String(obra['id-cliente']) === String(cliente['id-cliente']))
	if (obrasAsociadas.length) {
		throw new Error(`No se puede eliminar: el cliente tiene ${obrasAsociadas.length} obra(s) asociada(s).`)
	}

	guardarColecciones(
		clientes.filter((item) => item !== cliente),
		usuarios.filter((item) => String(item.id) !== String(cliente['id-usuario'])),
	)
}