-- Elimina métricas derivadas que ahora se calculan en las consultas de los DAO.
-- Se conservan en subtareas el porcentaje y el costo estimado porque son valores fuente.
BEGIN;

ALTER TABLE tareas
    DROP COLUMN IF EXISTS duracion_estimada,
    DROP COLUMN IF EXISTS porcentaje,
    DROP COLUMN IF EXISTS duracion_real,
    DROP COLUMN IF EXISTS costo_estimado,
    DROP COLUMN IF EXISTS costo_real;

ALTER TABLE subtareas
    DROP COLUMN IF EXISTS duracion_estimada,
    DROP COLUMN IF EXISTS duracion_real,
    DROP COLUMN IF EXISTS costo_real;

COMMIT;
