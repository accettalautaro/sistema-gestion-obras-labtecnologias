const OBRAS_KEY = 'gestion-obras:obras:v1'
const CLIENTES_KEY = 'gestion-clientes:clientes:v1'

async function leerJson(ruta, mensajeError) {
	const respuesta = await fetch(ruta)
	if (!respuesta.ok) throw new Error(mensajeError)
	return respuesta.json()
}

async function leerColeccionInicial(clave, ruta, mensajeError) {
	const guardado = localStorage.getItem(clave)
	if (guardado !== null) return JSON.parse(guardado)
	const datos = await leerJson(ruta, mensajeError)
	const coleccion = Array.isArray(datos) ? datos : []
	localStorage.setItem(clave, JSON.stringify(coleccion))
	return coleccion
}

function siguienteId(obras) {
	return Math.max(0, ...obras.map((obra) => Number(obra['id-obra']) || 0)) + 1
}

function validarObra(datos, clientes, arquitectos, lotes) {
	const idCliente = String(datos['id-cliente'] ?? '').trim()
	const idArquitecto = String(datos['id-arquitecto'] ?? '').trim()
	const nroLote = String(datos.nrolote ?? '').trim()
	const estado = String(datos.Estado ?? '').trim()
	if (!idCliente || !idArquitecto || !nroLote || !estado) throw new Error('Completá todos los datos de la obra.')
	if (!clientes.some((cliente) => String(cliente['id-cliente']) === idCliente)) throw new Error('Seleccioná un cliente existente.')
	if (!arquitectos.some((arquitecto) => String(arquitecto['id-arquitecto']) === idArquitecto)) throw new Error('Seleccioná un arquitecto existente.')
	if (!lotes.some((lote) => String(lote.nrolote) === nroLote)) throw new Error('Seleccioná un lote existente.')
	const convertirId = (valor) => Number.isNaN(Number(valor)) ? valor : Number(valor)
	return {
		'id-cliente': convertirId(idCliente),
		'id-arquitecto': convertirId(idArquitecto),
		nrolote: convertirId(nroLote),
		Estado: estado,
	}
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

function agregarAvanceDerivado(obras, tareas) {
	return obras.map((obra) => ({ ...obra, porcentaje: porcentajeCompletado(tareas, obra['id-obra']) }))
}

export async function listarObras() {
	const [obras, clientes, arquitectos, lotes, tareas] = await Promise.all([
		leerColeccionInicial(OBRAS_KEY, '/Back/data/obras.json', 'No se pudieron cargar las obras.'),
		leerColeccionInicial(CLIENTES_KEY, '/Back/data/clientes.json', 'No se pudieron cargar los clientes.'),
		leerJson('/Back/data/arquitectos.json', 'No se pudieron cargar los arquitectos.'),
		leerJson('/Back/data/lotes.json', 'No se pudieron cargar los lotes.'),
		leerJson('/Back/data/tareas.json', 'No se pudieron cargar las tareas.'),
	])
	return { obras: agregarAvanceDerivado(obras, tareas), clientes, arquitectos, lotes }
}

export async function crearObra(datos) {
	const [obras, clientes, arquitectos, lotes] = await Promise.all([
		leerColeccionInicial(OBRAS_KEY, '/Back/data/obras.json', 'No se pudieron cargar las obras.'),
		leerColeccionInicial(CLIENTES_KEY, '/Back/data/clientes.json', 'No se pudieron verificar los clientes.'),
		leerJson('/Back/data/arquitectos.json', 'No se pudieron verificar los arquitectos.'),
		leerJson('/Back/data/lotes.json', 'No se pudieron verificar los lotes.'),
	])
	const obra = { 'id-obra': siguienteId(obras), ...validarObra(datos, clientes, arquitectos, lotes) }
	localStorage.setItem(OBRAS_KEY, JSON.stringify([...obras, obra]))
	return obra
}

export async function actualizarObra(id, datos) {
	const [obras, clientes, arquitectos, lotes] = await Promise.all([
		leerColeccionInicial(OBRAS_KEY, '/Back/data/obras.json', 'No se pudieron cargar las obras.'),
		leerColeccionInicial(CLIENTES_KEY, '/Back/data/clientes.json', 'No se pudieron verificar los clientes.'),
		leerJson('/Back/data/arquitectos.json', 'No se pudieron verificar los arquitectos.'),
		leerJson('/Back/data/lotes.json', 'No se pudieron verificar los lotes.'),
	])
	const existente = obras.find((obra) => String(obra['id-obra']) === String(id))
	if (!existente) throw new Error('No se encontró la obra que querés editar.')
	const actualizada = { ...existente, ...validarObra(datos, clientes, arquitectos, lotes) }
	localStorage.setItem(OBRAS_KEY, JSON.stringify(obras.map((obra) => obra === existente ? actualizada : obra)))
	return actualizada
}

export async function eliminarObra(id) {
	const obras = await leerColeccionInicial(OBRAS_KEY, '/Back/data/obras.json', 'No se pudieron cargar las obras.')
	const obra = obras.find((item) => String(item['id-obra']) === String(id))
	if (!obra) throw new Error('No se encontró la obra que querés eliminar.')
	const tareas = await leerJson('/Back/data/tareas.json', 'No se pudieron verificar las tareas asociadas.')
	if (tareas.some((tarea) => String(tarea['id-obra']) === String(id))) throw new Error('No se puede eliminar esta obra porque tiene tareas asociadas.')
	localStorage.setItem(OBRAS_KEY, JSON.stringify(obras.filter((item) => item !== obra)))
}
