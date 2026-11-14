export const normalizarIdTarea = (id) => String(id ?? '').trim().replace(/[.,-]/g, '_').replace(/__+/g, '_')

const numero = (valor) => {
	const resultado = Number.parseFloat(String(valor ?? '0').replace('%', '').replace(',', '.'))
	return Number.isFinite(resultado) ? resultado : 0
}

function fechasDeDuracion(tarea, real = false) {
	const inicio = real ? tarea['fecha-inicio-real'] : tarea['fecha-inicio-estimada'] || tarea['fecha-inicio']
	const fin = real ? tarea['fecha-fin-real'] : tarea['fecha-fin-estimada'] || tarea['fecha-fin']
	if (!inicio || !fin) return null
	const inicioUtc = Date.parse(`${String(inicio).slice(0, 10)}T00:00:00Z`)
	const finUtc = Date.parse(`${String(fin).slice(0, 10)}T00:00:00Z`)
	return Number.isFinite(inicioUtc) && Number.isFinite(finUtc) && finUtc >= inicioUtc
		? Math.floor((finUtc - inicioUtc) / 86400000) + 1
		: null
}

function sumaDuraciones(tareas) {
	if (!tareas.length || tareas.some((tarea) => (
		(tarea['duracion-estimada'] == null || tarea['duracion-estimada'] === '')
		&& fechasDeDuracion(tarea) == null
	))) {
		return tareas.length ? null : 0
	}
	return tareas.reduce((total, tarea) => {
		const duracion = tarea['duracion-estimada']
		return total + numero(duracion == null || duracion === '' ? fechasDeDuracion(tarea) : duracion)
	}, 0)
}

function fechaMinima(tareas, campo) {
	return tareas.map((tarea) => tarea[campo]).filter(Boolean).map(String).sort()[0] ?? ''
}

function fechaMaxima(tareas, campo) {
	return tareas.map((tarea) => tarea[campo]).filter(Boolean).map(String).sort().at(-1) ?? ''
}

function duracionReal(inicio, fin) {
	if (!inicio || !fin) return null
	return fechasDeDuracion({ 'fecha-inicio-real': inicio, 'fecha-fin-real': fin }, true)
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

export function derivarTareas(tareas, pagos = []) {
	const lista = tareas.map((tarea) => ({ ...tarea }))
	const porId = new Map(lista.map((tarea) => [normalizarIdTarea(tarea['id-tarea'] ?? tarea.id), tarea]))
	const hijos = new Map()
	for (const tarea of lista) {
		const id = normalizarIdTarea(tarea['id-tarea'] ?? tarea.id)
		const separador = id.lastIndexOf('_')
		if (separador < 0) continue
		const padreId = id.slice(0, separador)
		if (!porId.has(padreId)) continue
		if (!hijos.has(padreId)) hijos.set(padreId, [])
		hijos.get(padreId).push(tarea)
	}

	const procesadas = new Set()
	const calcular = (tarea) => {
		const id = normalizarIdTarea(tarea['id-tarea'] ?? tarea.id)
		if (procesadas.has(id)) return tarea
		const subtareas = (hijos.get(id) ?? []).map(calcular)
		if (!subtareas.length) {
			const porcentaje = porcentajeTarea(tarea)
			const costoReal = pagos.length ? sumarPagos(tarea, pagos) : numero(tarea['costo-real'])
			const fechaInicioReal = tarea['fecha-inicio-real'] || ''
			const fechaFinReal = tarea['fecha-fin-real'] || ''
			const tareaDerivada = {
				...tarea,
				avance: porcentaje,
				porcentaje,
				estado: fechaFinReal ? 'finalizada' : fechaInicioReal ? 'en ejecucion' : 'sin comenzar',
				'duracion-estimada': tarea['duracion-estimada'] ?? fechasDeDuracion(tarea),
				'duracion-real': fechaFinReal ? duracionReal(fechaInicioReal, fechaFinReal) : null,
				'costo-real': costoReal,
				subtareas: [],
				unidadesFinales: [{
					...tarea,
					avance: porcentaje,
					porcentaje,
					estado: fechaFinReal ? 'finalizada' : fechaInicioReal ? 'en ejecucion' : 'sin comenzar',
					'duracion-estimada': tarea['duracion-estimada'] ?? fechasDeDuracion(tarea),
					'duracion-real': fechaFinReal ? duracionReal(fechaInicioReal, fechaFinReal) : null,
					'costo-real': costoReal,
				}],
				avanceCalculado: porcentaje,
				costoRealCalculado: costoReal,
				esUnidadFinal: true,
			}
			procesadas.add(id)
			Object.assign(tarea, tareaDerivada)
			return tarea
		}

		const avance = Math.floor(subtareas.reduce((total, subtarea) => total + subtarea.avanceCalculado, 0) / subtareas.length)
		const todasCompletas = subtareas.every((subtarea) => subtarea.avanceCalculado >= 100 && subtarea['fecha-fin-real'])
		const fechaInicioReal = fechaMinima(subtareas, 'fecha-inicio-real')
		const fechaFinReal = todasCompletas ? fechaMaxima(subtareas, 'fecha-fin-real') : ''
		const costoReal = subtareas.reduce((total, subtarea) => total + subtarea.costoRealCalculado, 0)
		const tareaDerivada = {
			...tarea,
			avance,
			porcentaje: avance,
			estado: todasCompletas ? 'finalizada' : fechaInicioReal ? 'en ejecucion' : 'sin comenzar',
			'duracion-estimada': sumaDuraciones(subtareas),
			'duracion-real': todasCompletas ? duracionReal(fechaInicioReal, fechaFinReal) : null,
			'fecha-inicio-real': fechaInicioReal,
			'fecha-fin-real': fechaFinReal,
			'costo-estimado': subtareas.reduce((total, subtarea) => total + numero(subtarea['costo-estimado']), 0),
			'costo-real': costoReal,
			subtareas,
			unidadesFinales: subtareas.flatMap((subtarea) => subtarea.unidadesFinales),
			avanceCalculado: avance,
			costoRealCalculado: costoReal,
			esUnidadFinal: false,
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
	const completadas = unidades.filter((tarea) => (
		porcentajeTarea(tarea) >= 100 && Boolean(tarea['fecha-fin-real'])
	)).length
	const avance = etapas.length
		? Math.floor(etapas.reduce((total, tarea) => total + tarea.avance, 0) / etapas.length)
		: 0
	return { etapas, unidades, completadas, total: unidades.length, avance }
}
