-- Backfill de costos y porcentajes derivados desde pagos y subtareas.
BEGIN;

UPDATE subtareas s
SET costo_real = COALESCE((SELECT SUM(p.monto) FROM pagos_parciales p WHERE p.id_subtarea=s.id_subtarea), 0);

UPDATE tareas t
SET porcentaje = CASE WHEN EXISTS (SELECT 1 FROM subtareas s WHERE s.id_tarea=t.id_tarea)
        THEN (SELECT FLOOR(AVG(s.porcentaje)) FROM subtareas s WHERE s.id_tarea=t.id_tarea)
        ELSE t.porcentaje END,
    costo_estimado = CASE WHEN EXISTS (SELECT 1 FROM subtareas s WHERE s.id_tarea=t.id_tarea)
        THEN COALESCE((SELECT SUM(s.costo_estimado) FROM subtareas s WHERE s.id_tarea=t.id_tarea), 0)
        ELSE t.costo_estimado END,
    costo_real = CASE WHEN EXISTS (SELECT 1 FROM subtareas s WHERE s.id_tarea=t.id_tarea)
        THEN COALESCE((SELECT SUM(s.costo_real) FROM subtareas s WHERE s.id_tarea=t.id_tarea), 0)
        ELSE 0 END;

COMMIT;
