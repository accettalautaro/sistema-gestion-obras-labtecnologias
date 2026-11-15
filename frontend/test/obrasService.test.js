import test from 'node:test'
import assert from 'node:assert/strict'
import { convertirObra } from '../src/features/obras/services/obrasService.js'

test('calcula la duración estimada de la obra desde sus fechas, no sumando tareas solapadas', () => {
	const obra = convertirObra({
		id_obra: 1,
		id_cliente: 2,
		fecha_inicio_estimada: '2026-03-10',
		fecha_fin_estimada: '2026-03-12',
	}, [
		{ 'id-obra': '1', 'id-tarea': '1_11', 'duracion-estimada': 2 },
		{ 'id-obra': '1', 'id-tarea': '1_12', 'duracion-estimada': 2 },
	])

	assert.equal(obra.duracionEstimada, 3)
})

test('deja la duración estimada sin datos si falta alguna fecha de la obra', () => {
	const obra = convertirObra({
		id_obra: 1,
		id_cliente: 2,
		fecha_inicio_estimada: '2026-03-10',
	}, [])

	assert.equal(obra.duracionEstimada, null)
})

test('conserva el nombre de la obra para mostrarlo en el seguimiento', () => {
	const obra = convertirObra({
		id_obra: 1,
		id_cliente: 2,
		nombre: 'Vivienda unifamiliar',
	}, [])

	assert.equal(obra.nombre, 'Vivienda unifamiliar')
})
