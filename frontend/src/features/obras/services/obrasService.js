async function leerJson(ruta, mensajeError) {
	const respuesta = await fetch(ruta)
	if (!respuesta.ok) throw new Error(mensajeError)
	const datos = await respuesta.json()
	return Array.isArray(datos) ? datos : []
}

function porcentajeCompletado(tareas, idObra) {
	const tareasObra = tareas.filter((tarea) => String(tarea['id-obra']) === String(idObra))
	if (!tareasObra.length) return '0%'
	const completadas = tareasObra.filter((tarea) => {
		const avance = Number.parseFloat(String(tarea.porcentaje ?? '0').replace('%', '')) || 0
		return avance >= 100
	}).length
	return `${Math.round((completadas / tareasObra.length) * 100)}%`
}

export async function listarObras() {
	const [obras, clientes, arquitectos, lotes, tareas] = await Promise.all([
		leerJson('/Back/data/obras.json', 'No se pudieron cargar las obras.'),
		leerJson('/Back/data/clientes.json', 'No se pudieron cargar los clientes.'),
		leerJson('/Back/data/arquitectos.json', 'No se pudieron cargar los arquitectos.'),
		leerJson('/Back/data/lotes.json', 'No se pudieron cargar los lotes.'),
		leerJson('/Back/data/tareas.json', 'No se pudieron cargar las tareas.'),
	])
	const obrasConAvance = obras.map((obra) => ({ ...obra, porcentaje: porcentajeCompletado(tareas, obra['id-obra']) }))
	return { obras: obrasConAvance, clientes, arquitectos, lotes }
}
