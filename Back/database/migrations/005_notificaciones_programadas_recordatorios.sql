-- Guarda los dos avisos de correo (7 y 1 días antes) para poder retomarlos
-- después de reiniciar la aplicación y evitar duplicados.
BEGIN;

CREATE TABLE notificaciones_recordatorio (
    id_notificacion BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_recordatorio BIGINT NOT NULL REFERENCES recordatorios(id_recordatorio) ON DELETE CASCADE,
    dias_anticipacion SMALLINT NOT NULL CHECK (dias_anticipacion IN (7, 1)),
    fecha_envio_programada TIMESTAMP WITH TIME ZONE NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'procesando', 'enviada', 'fallida', 'omitida')),
    intentos INTEGER NOT NULL DEFAULT 0 CHECK (intentos >= 0),
    reclamado_en TIMESTAMP WITH TIME ZONE,
    enviado_en TIMESTAMP WITH TIME ZONE,
    ultimo_error VARCHAR(1000),
    UNIQUE (id_recordatorio, dias_anticipacion)
);

CREATE INDEX notificaciones_recordatorio_pendientes_idx
    ON notificaciones_recordatorio (estado, fecha_envio_programada);

COMMIT;
