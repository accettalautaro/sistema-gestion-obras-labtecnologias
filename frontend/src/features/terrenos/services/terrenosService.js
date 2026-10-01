async function leerJson(ruta, etiqueta) {
	const respuesta = await fetch(ruta)
	if (!respuesta.ok) throw new Error(`No se pudieron cargar ${etiqueta}.`)
	const datos = await respuesta.json()
	return Array.isArray(datos) ? datos : []
}

export async function listarTerrenos() {
	const [lotes, direcciones, mensuras, escrituras, propietarios, obras] = await Promise.all([
		leerJson('/Back/data/lotes.json', 'los lotes'),
		leerJson('/Back/data/direcciones.json', 'las direcciones'),
		leerJson('/Back/data/mensuras.json', 'las mensuras'),
		leerJson('/Back/data/escrituras.json', 'las escrituras'),
		leerJson('/Back/data/propietarios.json', 'los propietarios'),
		leerJson('/Back/data/obras.json', 'las obras'),
	])

	return lotes.map((lote) => {
		const idLote = String(lote.nrolote)
		const escriturasLote = escrituras.filter((escritura) => String(escritura.nrolote) === idLote)

		return {
			...lote,
			direcciones: direcciones.filter((direccion) => String(direccion.nrolote) === idLote),
			mensuras: mensuras.filter((mensura) => String(mensura.nrolote) === idLote),
			escrituras: escriturasLote.map((escritura) => ({
				...escritura,
				propietarios: propietarios.filter((propietario) => String(propietario.nroescritura) === String(escritura.nroescritura)),
			})),
			obras: obras.filter((obra) => String(obra.nrolote) === idLote),
		}
	})
}
