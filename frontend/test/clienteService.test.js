import test from 'node:test'
import assert from 'node:assert/strict'
import { calcularDiasAtrasoObra } from '../src/shared/utils/atrasoObra.js'

test('calcula los días de atraso de una obra en curso desde su fecha estimada de fin', () => {
  assert.equal(calcularDiasAtrasoObra('2026-11-10', '', false, '2026-11-15'), 5)
})

test('no marca como atrasada una obra en curso que aún está dentro del plazo', () => {
  assert.equal(calcularDiasAtrasoObra('2026-11-15', '', false, '2026-11-15'), 0)
})

test('para una obra finalizada calcula el atraso hasta la fecha real de fin', () => {
  assert.equal(calcularDiasAtrasoObra('2026-11-10', '2026-11-13', true, '2026-11-20'), 3)
})

test('detecta el atraso de una obra completada aunque todas sus tareas estén terminadas', () => {
  assert.equal(calcularDiasAtrasoObra('2026-10-20', '2026-11-05', true), 16)
})
