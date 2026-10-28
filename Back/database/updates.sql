UPDATE usuarios 
SET nombre = '$2b$10$PXQsThnkEc7iectRBAaMh.spIkUPevvJ1UuYv3ljbReOZJRThgeqy'
WHERE dni = '1234';

-- Si hay varias vinculaciones, conserva en cada obra el lote de menor ID y libera los demás.
WITH lotes_repetidos AS (
    SELECT id_lote,
           ROW_NUMBER() OVER (PARTITION BY id_obra ORDER BY id_lote) AS posicion
    FROM lotes
    WHERE id_obra IS NOT NULL
)
UPDATE lotes AS lote
SET id_obra = NULL
FROM lotes_repetidos AS repetido
WHERE lote.id_lote = repetido.id_lote
  AND repetido.posicion > 1;

CREATE UNIQUE INDEX IF NOT EXISTS lotes_id_obra_unico
    ON lotes(id_obra)
    WHERE id_obra IS NOT NULL;
