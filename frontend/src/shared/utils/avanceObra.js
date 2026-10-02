function partesCodigo(idTarea) {
	return String(idTarea ?? '').replace(/[,._-]/g, '.').split('.').map(Number)
}

export function compararCodigoTarea(a, b) {
	const partesA = partesCodigo(a['id-tarea'])
	const partesB = partesCodigo(b['id-tarea'])
	for (let indice = 0; indice < Math.max(partesA.length, partesB.length); indice += 1) {
		const diferencia = (partesA[indice] ?? -1) - (partesB[indice] ?? -1)
		if (diferencia !== 0) return diferencia
	}
	return 0
}

export function porcentajeTarea(tarea) {
	const porcentajeInformado = tarea.porcentaje !== undefined && tarea.porcentaje !== null && String(tarea.porcentaje).trim() !== ''
	if (!porcentajeInformado && String(tarea.estado ?? '').toLowerCase() === 'finalizada') return 100
	const valor = Number.parseFloat(String(tarea.porcentaje ?? '0').replace('%', ''))
	if (Number.isFinite(valor)) return Math.min(100, Math.max(0, valor))
	return String(tarea.estado ?? '').toLowerCase() === 'finalizada' ? 100 : 0
}

export function construirEtapas(tareas) {
	const ordenadas = [...tareas].sort(compararCodigoTarea)
	const principales = ordenadas.filter((tarea) => /^\d+$/.test(String(tarea['id-tarea'])))
	const subtareas = ordenadas.filter((tarea) => /^\d+[-_.,]\d+$/.test(String(tarea['id-tarea'])))
	const asignadas = new Set()
	const etapas = principales.map((principal) => {
		const codigo = String(principal['id-tarea'])
		const hijas = subtareas.filter((subtarea) => String(subtarea['id-tarea']).replace(/[,_\.]/g, '-').startsWith(`${codigo}-`))
		hijas.forEach((hija) => asignadas.add(hija))
		const unidades = hijas.length ? hijas : [principal]
		const avance = Math.round(unidades.reduce((total, unidad) => total + porcentajeTarea(unidad), 0) / unidades.length)
		return { ...principal, avance, subtareas: hijas, unidades }
	})

	const codigosPrincipales = new Set(principales.map((tarea) => String(tarea['id-tarea'])))
	const huerfanas = subtareas.filter((subtarea) => {
		const padre = String(subtarea['id-tarea']).match(/^(\d+)[-_.,]/)?.[1]
		return !codigosPrincipales.has(padre)
	})
	const otras = ordenadas.filter((tarea) => !principales.includes(tarea) && !subtareas.includes(tarea))
	for (const tarea of [...huerfanas, ...otras]) {
		if (asignadas.has(tarea)) continue
		etapas.push({ ...tarea, avance: porcentajeTarea(tarea), subtareas: [], unidades: [tarea] })
		asignadas.add(tarea)
	}
	return etapas.sort(compararCodigoTarea)
}

export function resumirAvanceTareas(tareas) {
	const etapas = construirEtapas(tareas)
	const unidades = etapas.flatMap((etapa) => etapa.unidades)
	const completadas = unidades.filter((tarea) => porcentajeTarea(tarea) >= 100).length
	return { etapas, unidades, completadas, total: unidades.length, avance: unidades.length ? Math.round((completadas / unidades.length) * 100) : 0 }
}
