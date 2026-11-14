BEGIN;

ALTER TABLE obras
    ADD COLUMN id_lote BIGINT REFERENCES lotes(id_lote) ON DELETE SET NULL;

UPDATE obras o
SET id_lote = l.id_lote
FROM lotes l
WHERE l.id_obra = o.id_obra;

DROP INDEX IF EXISTS lotes_id_obra_unico;
ALTER TABLE lotes DROP COLUMN id_obra;

COMMIT;
