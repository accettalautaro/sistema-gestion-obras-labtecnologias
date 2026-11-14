-- Conserva las fechas existentes como estimadas y agrega las fechas reales.
BEGIN;

-- Los nombres de estas restricciones pueden variar entre instalaciones de PostgreSQL
-- (por ejemplo, tareas_check). Se eliminan por las columnas que validan, no por nombre.
DO $$
DECLARE
    restriccion RECORD;
BEGIN
    FOR restriccion IN
        SELECT conrelid::regclass AS tabla, conname
        FROM pg_constraint
        WHERE contype = 'c'
          AND conrelid IN ('obras'::regclass, 'tareas'::regclass, 'subtareas'::regclass)
          AND pg_get_constraintdef(oid) ILIKE '%fecha_inicio%'
          AND pg_get_constraintdef(oid) ILIKE '%fecha_fin%'
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', restriccion.tabla, restriccion.conname);
    END LOOP;
END $$;

ALTER TABLE obras RENAME COLUMN fecha_inicio TO fecha_inicio_estimada;
ALTER TABLE obras RENAME COLUMN fecha_fin TO fecha_fin_estimada;
ALTER TABLE obras
    ADD COLUMN fecha_inicio_real DATE,
    ADD COLUMN fecha_fin_real DATE;
ALTER TABLE obras
    ADD CONSTRAINT obras_fechas_estimadas_orden_check
        CHECK (fecha_inicio_estimada IS NULL OR fecha_fin_estimada IS NULL OR fecha_fin_estimada >= fecha_inicio_estimada),
    ADD CONSTRAINT obras_fechas_reales_orden_check
        CHECK (fecha_inicio_real IS NULL OR fecha_fin_real IS NULL OR fecha_fin_real >= fecha_inicio_real);

ALTER TABLE tareas RENAME COLUMN fecha_inicio TO fecha_inicio_estimada;
ALTER TABLE tareas RENAME COLUMN fecha_fin TO fecha_fin_estimada;
ALTER TABLE tareas
    ADD COLUMN fecha_inicio_real DATE,
    ADD COLUMN fecha_fin_real DATE;
ALTER TABLE tareas
    ADD CONSTRAINT tareas_fechas_estimadas_orden_check
        CHECK (fecha_inicio_estimada IS NULL OR fecha_fin_estimada IS NULL OR fecha_fin_estimada >= fecha_inicio_estimada),
    ADD CONSTRAINT tareas_fechas_reales_orden_check
        CHECK (fecha_inicio_real IS NULL OR fecha_fin_real IS NULL OR fecha_fin_real >= fecha_inicio_real);

ALTER TABLE subtareas RENAME COLUMN fecha_inicio TO fecha_inicio_estimada;
ALTER TABLE subtareas RENAME COLUMN fecha_fin TO fecha_fin_estimada;
ALTER TABLE subtareas
    ADD COLUMN fecha_inicio_real DATE,
    ADD COLUMN fecha_fin_real DATE;
ALTER TABLE subtareas
    ADD CONSTRAINT subtareas_fechas_estimadas_orden_check
        CHECK (fecha_inicio_estimada IS NULL OR fecha_fin_estimada IS NULL OR fecha_fin_estimada >= fecha_inicio_estimada),
    ADD CONSTRAINT subtareas_fechas_reales_orden_check
        CHECK (fecha_inicio_real IS NULL OR fecha_fin_real IS NULL OR fecha_fin_real >= fecha_inicio_real);

COMMIT;
