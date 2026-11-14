import test from 'node:test'
import assert from 'node:assert/strict'
import { resumirAvanceTareas } from '../src/shared/utils/avanceObra.js'

test('resume tareas con promedio truncado y tareas vacías en el promedio de obra', () => {
	const resumen = resumirAvanceTareas([
		{ 'id-tarea': '1', 'id-obra': '9', nombre: 'Etapa' },
		{
			'id-tarea': '1_11', 'id-obra': '9', porcentaje: '100%',
			'fecha-inicio-estimada': '2026-07-01', 'fecha-fin-estimada': '2026-07-02',
			'fecha-inicio-real': '2026-07-03', 'fecha-fin-real': '2026-07-04',
			'costo-estimado': 10, 'costo-real': 4,
		},
		{
			'id-tarea': '1_12', 'id-obra': '9', porcentaje: '100%',
			'fecha-inicio-estimada': '2026-07-03', 'fecha-fin-estimada': '2026-07-06',
			'fecha-inicio-real': '2026-07-05', 'fecha-fin-real': '2026-07-05',
			'costo-estimado': 20, 'costo-real': 5,
		},
		{
			'id-tarea': '1_13', 'id-obra': '9', porcentaje: '0%',
			'fecha-inicio-estimada': '2026-07-07', 'fecha-fin-estimada': '2026-07-07',
			'costo-estimado': 30, 'costo-real': 0,
		},
		{ 'id-tarea': '2', 'id-obra': '9', nombre: 'Etapa sin subtareas' },
	])

	assert.equal(resumen.etapas[0].avance, 66)
	assert.equal(resumen.etapas[0]['duracion-estimada'], 7)
	assert.equal(resumen.etapas[0]['duracion-real'], null)
	assert.equal(resumen.avance, 33)
	assert.equal(resumen.total, 4)
});
