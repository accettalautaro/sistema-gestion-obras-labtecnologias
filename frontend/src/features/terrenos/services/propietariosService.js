async function leerJson(ruta, etiqueta) {
	const respuesta = await fetch(ruta)
	if (!respuesta.ok) throw new Error(`No se pudieron cargar ${etiqueta}.`)
	const datos = await respuesta.json()
	return Array.isArray(datos) ? datos : []
}

export async function listarDatosPropietarios(nrolote) {
	const [lotes, escrituras, propietarios] = await Promise.all([
		leerJson('/Back/data/lotes.json', 'los lotes'),
		leerJson('/Back/data/escrituras.json', 'las escrituras'),
		leerJson('/Back/data/propietarios.json', 'los propietarios'),
	])

	const lote = lotes.find((l) => String(l.nrolote) === String(nrolote))
	if (!lote) throw new Error('Lote no encontrado')

	// Buscar escrituras del lote
	const escriturasLote = escrituras.filter((e) => String(e.nrolote) === String(nrolote))
	
	// Todos los propietarios asignados a estas escrituras (los propietarios actuales del lote)
	const propietariosLote = propietarios.filter((p) => 
		escriturasLote.some((e) => String(e.nroescritura) === String(p.nroescritura))
	)

	// Extraer personas únicas de toda la base para autocompletado
	// Filtramos por DNI para que sean únicos
	const personasUnicasMap = new Map()
	propietarios.forEach(p => {
		if (p.dni && !personasUnicasMap.has(String(p.dni))) {
			personasUnicasMap.set(String(p.dni), {
				nombre: p.nombre,
				apellido: p.apellido,
				dni: p.dni,
				estadocivil: p.estadocivil
			})
		}
	})
	const personasUnicas = Array.from(personasUnicasMap.values())

	return {
		lote,
		escriturasLote,
		propietariosLote,
		personasUnicas
	}
}
