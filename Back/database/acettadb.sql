
SET client_encoding TO 'UTF8';

CREATE TABLE usuarios (
    id_usuario BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    dni VARCHAR(20) UNIQUE NOT NULL,
    rol VARCHAR(30) NOT NULL
);

CREATE TABLE arquitectos (
    id_arquitecto BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    dni VARCHAR(20) UNIQUE NOT NULL,
    telefono VARCHAR(30),
    email VARCHAR(254) UNIQUE,
    nro_matricula INTEGER,
    id_usuario BIGINT UNIQUE REFERENCES usuarios(id_usuario)
);

CREATE TABLE clientes (
    id_cliente BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    dni VARCHAR(20) UNIQUE NOT NULL,
    telefono VARCHAR(30),
    email VARCHAR(254) UNIQUE,
    id_usuario BIGINT UNIQUE REFERENCES usuarios(id_usuario)
);

CREATE TABLE direcciones (
    id_direccion BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    provincia VARCHAR(100),
    codigo_postal VARCHAR(20),
    calle VARCHAR(150) NOT NULL,
    altura VARCHAR(20),
    piso VARCHAR(20),
    departamento VARCHAR(20),
    localidad VARCHAR(100)
);

CREATE TABLE obras (
    id_obra BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(150),
    id_cliente BIGINT NOT NULL REFERENCES clientes(id_cliente),
    id_arquitecto BIGINT REFERENCES arquitectos(id_arquitecto),
    fecha_inicio_estimada DATE,
    fecha_fin_estimada DATE,
    fecha_inicio_real DATE,
    fecha_fin_real DATE,
    estado VARCHAR(30) NOT NULL DEFAULT 'No Inicio',
    descripcion TEXT,
    CONSTRAINT obras_fechas_estimadas_orden_check
        CHECK (fecha_inicio_estimada IS NULL OR fecha_fin_estimada IS NULL OR fecha_fin_estimada >= fecha_inicio_estimada),
    CONSTRAINT obras_fechas_reales_orden_check
        CHECK (fecha_inicio_real IS NULL OR fecha_fin_real IS NULL OR fecha_fin_real >= fecha_inicio_real)
);

CREATE TABLE lotes (
    id_lote BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nro_lote VARCHAR(30) NOT NULL,
    id_direccion BIGINT REFERENCES direcciones(id_direccion),
    UNIQUE (id_direccion, nro_lote)
);

ALTER TABLE obras
    ADD COLUMN id_lote BIGINT REFERENCES lotes(id_lote) ON DELETE SET NULL;

CREATE TABLE tareas (
    id_tarea BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_obra BIGINT NOT NULL REFERENCES obras(id_obra) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    fecha_inicio_estimada DATE,
    fecha_fin_estimada DATE,
    fecha_inicio_real DATE,
    fecha_fin_real DATE,

    CONSTRAINT tareas_fechas_orden_check
        CHECK (fecha_inicio_estimada IS NULL OR fecha_fin_estimada IS NULL OR fecha_fin_estimada >= fecha_inicio_estimada),
    CONSTRAINT tareas_fechas_reales_orden_check
        CHECK (fecha_inicio_real IS NULL OR fecha_fin_real IS NULL OR fecha_fin_real >= fecha_inicio_real)
);

CREATE TABLE subtareas (
    id_subtarea BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_tarea BIGINT NOT NULL REFERENCES tareas(id_tarea) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0,
    descripcion TEXT,
    costo_estimado NUMERIC(14,2),
    fecha_inicio_estimada DATE,
    fecha_fin_estimada DATE,
    fecha_inicio_real DATE,
    fecha_fin_real DATE,

    CHECK (porcentaje BETWEEN 0 AND 100),
    CHECK (costo_estimado IS NULL OR costo_estimado >= 0),
    CONSTRAINT subtareas_fechas_orden_check
        CHECK (fecha_inicio_estimada IS NULL OR fecha_fin_estimada IS NULL OR fecha_fin_estimada >= fecha_inicio_estimada),
    CONSTRAINT subtareas_fechas_reales_orden_check
        CHECK (fecha_inicio_real IS NULL OR fecha_fin_real IS NULL OR fecha_fin_real >= fecha_inicio_real)
);

CREATE TABLE pagos_parciales (
    id_pago BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_subtarea BIGINT NOT NULL REFERENCES subtareas(id_subtarea) ON DELETE CASCADE,
    descripcion TEXT,
    monto NUMERIC(14,2) NOT NULL CHECK (monto >= 0)
);

CREATE TABLE recordatorios (
    id_recordatorio BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_obra BIGINT NOT NULL REFERENCES obras(id_obra) ON DELETE CASCADE,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL,
    descripcion TEXT NOT NULL
);

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

CREATE TABLE documentos (
    id_documento BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_lote BIGINT NOT NULL REFERENCES lotes(id_lote) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    archivo TEXT
);

CREATE TABLE mensuras (
    id_documento BIGINT PRIMARY KEY REFERENCES documentos(id_documento) ON DELETE CASCADE,
    largo NUMERIC(10,2),
    mts_cuadrados NUMERIC(12,2),
    ancho NUMERIC(10,2),

    CHECK (largo IS NULL OR largo >= 0),
    CHECK (mts_cuadrados IS NULL OR mts_cuadrados >= 0),
    CHECK (ancho IS NULL OR ancho >= 0)
);

CREATE TABLE escrituras (
    id_documento BIGINT PRIMARY KEY REFERENCES documentos(id_documento) ON DELETE CASCADE,
    nro_escritura VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE propietarios (
    id_propietario BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    apellido VARCHAR(100) NOT NULL,
    dni VARCHAR(20) UNIQUE NOT NULL,
    estado_civil VARCHAR(30),
    porcentaje NUMERIC(5,2) NOT NULL CHECK (porcentaje BETWEEN 0 AND 100),
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE escritura_propietarios (
    id_documento BIGINT NOT NULL REFERENCES escrituras(id_documento) ON DELETE CASCADE,
    id_propietario BIGINT NOT NULL REFERENCES propietarios(id_propietario),
    PRIMARY KEY (id_documento, id_propietario)
);
