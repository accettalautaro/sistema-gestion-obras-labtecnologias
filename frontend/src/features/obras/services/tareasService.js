const URL_TAREAS = '/Back/data/tareas.json'
const CLAVE_CAMBIOS = 'gestion-obras:tareas:v1'

export async function listarNomenclador() {
	const respuesta = await fetch(URL_TAREAS)
	if (!respuesta.ok) throw new Error('No se pudo cargar el nomenclador de tareas.')
	return respuesta.json()
}

export async function listarTareas() {
	const tareasBase = await listarNomenclador()
	const cambios = JSON.parse(localStorage.getItem(CLAVE_CAMBIOS) || '{}')
	const tareasPorObra = new Map(Object.entries(cambios))
	const obrasConCambios = new Set(tareasPorObra.keys())
	return [...tareasBase.filter((tarea) => !obrasConCambios.has(String(tarea['id-obra']))), ...[...tareasPorObra.values()].flat()]
}

export function guardarTareasObra(idObra, tareasObra) {
	const cambios = JSON.parse(localStorage.getItem(CLAVE_CAMBIOS) || '{}')
	cambios[String(idObra)] = tareasObra
	localStorage.setItem(CLAVE_CAMBIOS, JSON.stringify(cambios))
}
