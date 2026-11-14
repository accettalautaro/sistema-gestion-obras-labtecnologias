-- Sustituye duraciones ingresadas manualmente por duraciones derivadas de fechas.
BEGIN;

UPDATE subtareas
SET duracion_estimada = CASE
        WHEN fecha_inicio_estimada IS NOT NULL AND fecha_fin_estimada IS NOT NULL
            THEN (fecha_fin_estimada - fecha_inicio_estimada + 1)::numeric
        ELSE NULL
    END,
    duracion_real = CASE
        WHEN fecha_inicio_real IS NOT NULL AND fecha_fin_real IS NOT NULL
            THEN (fecha_fin_real - fecha_inicio_real + 1)::numeric
        ELSE NULL
    END;

UPDATE tareas t
SET duracion_estimada = CASE
        WHEN EXISTS (SELECT 1 FROM subtareas s WHERE s.id_tarea = t.id_tarea)
            THEN CASE
                WHEN EXISTS (SELECT 1 FROM subtareas s WHERE s.id_tarea = t.id_tarea AND s.duracion_estimada IS NULL)
                    THEN NULL
                ELSE (SELECT SUM(s.duracion_estimada) FROM subtareas s WHERE s.id_tarea = t.id_tarea)
            END
        WHEN t.fecha_inicio_estimada IS NOT NULL AND t.fecha_fin_estimada IS NOT NULL
            THEN (t.fecha_fin_estimada - t.fecha_inicio_estimada + 1)::numeric
        ELSE NULL
    END,
    duracion_real = CASE
        WHEN t.fecha_inicio_real IS NOT NULL AND t.fecha_fin_real IS NOT NULL
            THEN (t.fecha_fin_real - t.fecha_inicio_real + 1)::numeric
        ELSE NULL
    END;

COMMIT;
