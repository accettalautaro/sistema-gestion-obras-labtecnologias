BEGIN;

ALTER TABLE escritura_propietarios
    ADD COLUMN porcentaje NUMERIC(5,2);

UPDATE escritura_propietarios ep
SET porcentaje = p.porcentaje
FROM propietarios p
WHERE p.id_propietario = ep.id_propietario;

ALTER TABLE escritura_propietarios
    ALTER COLUMN porcentaje SET NOT NULL,
    ADD CONSTRAINT escritura_propietarios_porcentaje_check
        CHECK (porcentaje BETWEEN 0 AND 100);

ALTER TABLE propietarios
    DROP COLUMN porcentaje;

COMMIT;
