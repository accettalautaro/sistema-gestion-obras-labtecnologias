-- Invocar una sola vez sobre una base creada con el esquema anterior.
-- Conserva la asignación actual, y luego mueve la clave foránea a obras.
BEGIN;

ALTER TABLE obras ADD COLUMN id_lote BIGINT;

UPDATE obras AS o
SET id_lote = l.id_lote
FROM lotes AS l
WHERE l.id_obra = o.id_obra;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM obras WHERE id_lote IS NULL) THEN
        RAISE EXCEPTION 'Hay obras sin lote asociado. Asignales un lote antes de aplicar esta migración.';
    END IF;
END
$$;

ALTER TABLE obras ALTER COLUMN id_lote SET NOT NULL;
ALTER TABLE obras
    ADD CONSTRAINT obras_id_lote_fkey
    FOREIGN KEY (id_lote) REFERENCES lotes(id_lote) ON DELETE RESTRICT;
CREATE INDEX obras_id_lote_idx ON obras(id_lote);

DROP INDEX IF EXISTS lotes_id_obra_unico;
ALTER TABLE lotes DROP COLUMN id_obra;

COMMIT;
