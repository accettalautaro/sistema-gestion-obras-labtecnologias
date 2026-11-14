-- Normaliza los estados existentes con las reglas del seguimiento de obra.
-- Los estados de pausa se conservan como pausa manual.
BEGIN;

ALTER TABLE obras ALTER COLUMN estado SET DEFAULT 'No Inicio';

UPDATE obras o
SET estado = CASE
    WHEN LOWER(o.estado) IN ('pausa', 'pausada', 'suspendida', 'suspendido') THEN 'Pausada'
    WHEN NOT EXISTS (
        SELECT 1 FROM tareas t
        WHERE t.id_obra = o.id_obra AND t.fecha_inicio_real IS NOT NULL
    ) THEN 'No Inicio'
    WHEN EXISTS (SELECT 1 FROM tareas t WHERE t.id_obra = o.id_obra)
         AND NOT EXISTS (
             SELECT 1 FROM tareas t
             WHERE t.id_obra = o.id_obra
               AND (t.porcentaje < 100 OR t.fecha_fin_real IS NULL)
         ) THEN 'Finalizada'
    ELSE 'En ejecución'
END;

COMMIT;
