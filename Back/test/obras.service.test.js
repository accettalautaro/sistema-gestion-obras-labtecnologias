import test from 'node:test';
import assert from 'node:assert/strict';

if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'test-only-secret';
const { crearObra, derivarObra, derivarTarea, duracionInclusiva } = await import('../src/modules/obras/obras.service.js');

test('requiere un nombre para crear una obra', async () => {
    await assert.rejects(
        crearObra({ id_lote: 1, fecha_inicio_estimada: '2026-07-01', fecha_fin_estimada: '2026-07-02' }),
        { status: 400, message: 'El nombre de la obra es obligatorio.' },
    );
});

test('calcula duraciones contando el día inicial y final', () => {
    assert.equal(duracionInclusiva('2026-07-01', '2026-07-01'), 1);
    assert.equal(duracionInclusiva('2026-07-01', '2026-07-03'), 3);
    assert.equal(duracionInclusiva('2026-07-03', '2026-07-01'), null);
});

test('deriva la tarea con promedio truncado, sumas y fechas reales', () => {
    const tarea = derivarTarea([
        {
            porcentaje: 100, costo_estimado: 10, costo_real: 4,
            fecha_inicio_estimada: '2026-07-01', fecha_fin_estimada: '2026-07-02',
            fecha_inicio_real: '2026-07-03', fecha_fin_real: '2026-07-04',
        },
        {
            porcentaje: 100, costo_estimado: 20, costo_real: 5,
            fecha_inicio_estimada: '2026-07-03', fecha_fin_estimada: '2026-07-03',
            fecha_inicio_real: '2026-07-05', fecha_fin_real: '2026-07-05',
        },
        {
            porcentaje: 0, costo_estimado: 30, costo_real: 0,
            fecha_inicio_estimada: '2026-07-04', fecha_fin_estimada: '2026-07-04',
            fecha_inicio_real: null, fecha_fin_real: null,
        },
    ]);

    assert.equal(tarea.porcentaje, 66);
    assert.equal(tarea.duracion_estimada, 4);
    assert.equal(tarea.duracion_real, null);
    assert.equal(tarea.costo_estimado, 60);
    assert.equal(tarea.costo_real, 9);
    assert.equal(tarea.fecha_inicio_real, '2026-07-03');
    assert.equal(tarea.fecha_fin_real, null);
});

test('incluye las tareas vacías en el promedio y conserva la pausa manual', () => {
    const tareaIniciada = derivarTarea([{
        porcentaje: 100, costo_estimado: 10, costo_real: 10,
        fecha_inicio_estimada: '2026-07-01', fecha_fin_estimada: '2026-07-02',
        fecha_inicio_real: '2026-07-01', fecha_fin_real: '2026-07-02',
    }]);
    const tareaVacia = derivarTarea([]);
    const tareas = [tareaIniciada, tareaVacia].map((tarea) => ({
        ...tarea,
        fecha_inicio_real: tarea.fecha_inicio_real,
        fecha_fin_real: tarea.fecha_fin_real,
    }));

    assert.equal(derivarObra(tareas).porcentaje, 50);
    assert.equal(derivarObra(tareas).estado, 'En ejecución');
    assert.equal(derivarObra(tareas, true).estado, 'Pausada');
});

test('una subtarea iniciada mantiene la obra en ejecución aunque su avance sea cero', () => {
    const tarea = derivarTarea([{
        porcentaje: 0, costo_estimado: 10, costo_real: 0,
        fecha_inicio_estimada: '2026-07-01', fecha_fin_estimada: '2026-07-02',
        fecha_inicio_real: '2026-07-01', fecha_fin_real: null,
    }]);
    const resumen = derivarObra([{
        ...tarea,
        fecha_inicio_real: tarea.fecha_inicio_real,
        fecha_fin_real: tarea.fecha_fin_real,
    }]);

    assert.equal(resumen.porcentaje, 0);
    assert.equal(resumen.estado, 'En ejecución');
});

test('la obra finalizada calcula duración real desde su primer inicio al último fin', () => {
    const tarea = derivarTarea([{
        porcentaje: 100, costo_estimado: 10, costo_real: 10,
        fecha_inicio_estimada: '2026-07-01', fecha_fin_estimada: '2026-07-02',
        fecha_inicio_real: '2026-07-01', fecha_fin_real: '2026-07-03',
    }]);
    const resumen = derivarObra([{
        ...tarea,
        fecha_inicio_real: tarea.fecha_inicio_real,
        fecha_fin_real: tarea.fecha_fin_real,
    }]);

    assert.equal(resumen.estado, 'Finalizada');
    assert.equal(resumen.fecha_inicio_real, '2026-07-01');
    assert.equal(resumen.fecha_fin_real, '2026-07-03');
    assert.equal(resumen.duracion_real, 3);
});
