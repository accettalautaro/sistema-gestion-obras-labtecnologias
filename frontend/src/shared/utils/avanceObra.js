export const normalizarIdTarea = (id) => String(id ?? '').trim().replace(/[.,-]/g, '_').replace(/__+/g, '_')

const numero = (valor) => {
	const resultado = Number.parseFloat(String(valor ?? '0').replace('%', '').replace(',', '.'))
	return Number.isFinite(resultado) ? resultado : 0
}

export function compararCodigoTarea(a, b) {
	return String(a['id-tarea'] ?? '').localeCompare(String(b['id-tarea'] ?? ''), 'es', { numeric: true, sensitivity: 'base' })
}

export function porcentajeTarea(tarea) {
	const estado = String(tarea.estado ?? '').toLowerCase()
	if (['finalizada', 'completada', 'completado'].includes(estado)) return 100
	return Math.min(100, Math.max(0, numero(tarea.porcentaje)))
}

const sumarPagos = (tarea, pagos) => pagos
	.filter((pago) => String(pago['id-obra'] ?? pago.obraId) === String(tarea['id-obra'] ?? tarea.obraId)
		&& normalizarIdTarea(pago['id-tarea'] ?? pago.tareaId) === normalizarIdTarea(tarea['id-tarea'] ?? tarea.id))
	.reduce((total, pago) => total + numero(pago.monto), 0)

/** Devuelve tareas con sus campos calculados desde sus subtareas y pagos parciales. */
export function derivarTareas(tareas, pagos = []) {
	const lista = tareas.map((tarea) => ({ ...tarea }))
	const porId = new Map(lista.map((tarea) => [normalizarIdTarea(tarea['id-tarea'] ?? tarea.id), tarea]))
	const hijos = new Map()
	const padres = new Set()
	for (const tarea of lista) {
		const id = normalizarIdTarea(tarea['id-tarea'] ?? tarea.id)
		const separador = id.lastIndexOf('_')
		if (separador < 0) continue
		const padreId = id.slice(0, separador)
		if (!porId.has(padreId)) continue
		padres.add(id)
		if (!hijos.has(padreId)) hijos.set(padreId, [])
		hijos.get(padreId).push(tarea)
	}
	const procesadas = new Set()
	const calcular = (tarea) => {
		const id = normalizarIdTarea(tarea['id-tarea'] ?? tarea.id)
		if (procesadas.has(id)) return tarea
		const subtareas = hijos.get(id) ?? []
		const descendientes = subtareas.map(calcular)
		const terminales = descendientes.length ? descendientes.flatMap((hijo) => hijo.unidadesFinales) : [tarea]
		const completada = porcentajeTarea(tarea) >= 100
		const avance = descendientes.length
			? Math.round(descendientes.filter((hijo) => hijo.avanceCalculado >= 100).length / descendientes.length * 100)
			: (padres.has(id) ? (completada ? 100 : 0) : porcentajeTarea(tarea))
		const costoReal = sumarPagos(tarea, pagos) + descendientes.reduce((suma, hijo) => suma + hijo.costoRealCalculado, 0)
		const tareaDerivada = {
			...tarea,
			avance,
			porcentaje: avance,
			estado: descendientes.length ? (avance >= 100 ? 'finalizada' : 'en_progreso') : tarea.estado,
			'duracion-estimada': descendientes.length ? descendientes.reduce((suma, hijo) => suma + numero(hijo['duracion-estimada']), 0) : tarea['duracion-estimada'],
			'duracion-real': descendientes.length ? descendientes.reduce((suma, hijo) => suma + numero(hijo['duracion-real']), 0) : tarea['duracion-real'],
			'costo-real': costoReal,
		subtareas: descendientes,
		unidadesFinales: terminales,
		avanceCalculado: avance,
		costoRealCalculado: costoReal,
		esUnidadFinal: descendientes.length === 0,
			esSubtarea: padres.has(id),
		}
		procesadas.add(id)
		Object.assign(tarea, tareaDerivada)
		return tarea
	}
	lista.forEach(calcular)
	return lista.sort(compararCodigoTarea)
}

export function construirEtapas(tareas, pagos = []) {
	const derivadas = derivarTareas(tareas, pagos)
	const ids = new Set(derivadas.map((tarea) => normalizarIdTarea(tarea['id-tarea'] ?? tarea.id)))
	return derivadas.filter((tarea) => {
		const id = normalizarIdTarea(tarea['id-tarea'] ?? tarea.id)
		const corte = id.lastIndexOf('_')
		return corte < 0 || !ids.has(id.slice(0, corte))
	})
}

export function resumirAvanceTareas(tareas, pagos = []) {
	const etapas = construirEtapas(tareas, pagos)
	const unidades = etapas.flatMap((etapa) => etapa.unidadesFinales)
	const completadas = unidades.filter((tarea) => porcentajeTarea(tarea) >= 100).length
	return { etapas, unidades, completadas, total: unidades.length, avance: unidades.length ? Math.round(completadas / unidades.length * 100) : 0 }
}
