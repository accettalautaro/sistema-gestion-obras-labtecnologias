import { resumirAvanceTareas } from '../../../shared/utils/avanceObra.js'
import { listarTareas } from './tareasService.js'

async function leerJson(ruta, mensajeError) {
	const respuesta = await fetch(ruta)
	if (!respuesta.ok) throw new Error(mensajeError)
	const datos = await respuesta.json()
	return Array.isArray(datos) ? datos : []
}

export async function listarObras() {
	const [obras, clientes, arquitectos, lotes, tareas] = await Promise.all([
		leerJson('/Back/data/obras.json', 'No se pudieron cargar las obras.'),
		leerJson('/Back/data/clientes.json', 'No se pudieron cargar los clientes.'),
		leerJson('/Back/data/arquitectos.json', 'No se pudieron cargar los arquitectos.'),
		leerJson('/Back/data/lotes.json', 'No se pudieron cargar los lotes.'),
		listarTareas(),
	])
	const obrasConAvance = obras.map((obra) => {
		const tareasObra = tareas.filter((tarea) => String(tarea['id-obra']) === String(obra['id-obra']))
		return { ...obra, porcentaje: `${resumirAvanceTareas(tareasObra).avance}%` }
	})
	return { obras: obrasConAvance, clientes, arquitectos, lotes }
}
