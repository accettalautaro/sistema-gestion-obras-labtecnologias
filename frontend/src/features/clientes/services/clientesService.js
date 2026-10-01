export async function listarClientes() {
	const respuesta = await fetch('/Back/data/clientes.json')
	if (!respuesta.ok) throw new Error('No se pudieron cargar los clientes.')
	const clientes = await respuesta.json()
	const listaClientes = (Array.isArray(clientes) ? clientes : []).map((cliente) => ({
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
