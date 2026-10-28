
SET client_encoding TO 'UTF8';
CREATE DATABASE accettadb;

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
    id_cliente BIGINT NOT NULL REFERENCES clientes(id_cliente),
    id_arquitecto BIGINT REFERENCES arquitectos(id_arquitecto),
    fecha_inicio DATE,
    fecha_fin DATE,
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
    descripcion TEXT
);

CREATE TABLE lotes (
    id_lote BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nro_lote VARCHAR(30) NOT NULL,
    id_direccion BIGINT REFERENCES direcciones(id_direccion),
    id_obra BIGINT REFERENCES obras(id_obra),
    UNIQUE (id_direccion, nro_lote)
);

-- Una obra puede estar vinculada como máximo a un lote; los lotes sin obra siguen permitidos.
CREATE UNIQUE INDEX lotes_id_obra_unico ON lotes(id_obra) WHERE id_obra IS NOT NULL;

CREATE TABLE tareas (
    id_tarea BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_obra BIGINT NOT NULL REFERENCES obras(id_obra),
    nombre VARCHAR(150) NOT NULL,
    duracion_estimada NUMERIC(10,2),
    porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0,
    descripcion TEXT,
    duracion_real NUMERIC(10,2),
    costo_estimado NUMERIC(14,2),
    costo_real NUMERIC(14,2),
    fecha_inicio DATE,
    fecha_fin DATE,

    CHECK (porcentaje BETWEEN 0 AND 100),
    CHECK (duracion_estimada IS NULL OR duracion_estimada >= 0),
    CHECK (duracion_real IS NULL OR duracion_real >= 0),
    CHECK (costo_estimado IS NULL OR costo_estimado >= 0),
    CHECK (costo_real IS NULL OR costo_real >= 0),
    CONSTRAINT tareas_fechas_orden_check
        CHECK (fecha_inicio IS NULL OR fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

CREATE TABLE subtareas (
    id_subtarea BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_tarea BIGINT NOT NULL REFERENCES tareas(id_tarea),
    nombre VARCHAR(150) NOT NULL,
    duracion_estimada NUMERIC(10,2),
    porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0,
    descripcion TEXT,
    duracion_real NUMERIC(10,2),
    costo_estimado NUMERIC(14,2),
    costo_real NUMERIC(14,2),
    fecha_inicio DATE,
    fecha_fin DATE,

    CHECK (porcentaje BETWEEN 0 AND 100),
    CHECK (duracion_estimada IS NULL OR duracion_estimada >= 0),
    CHECK (duracion_real IS NULL OR duracion_real >= 0),
    CHECK (costo_estimado IS NULL OR costo_estimado >= 0),
    CHECK (costo_real IS NULL OR costo_real >= 0),
    CONSTRAINT subtareas_fechas_orden_check
        CHECK (fecha_inicio IS NULL OR fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

CREATE TABLE pagos_parciales (
    id_pago BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_subtarea BIGINT NOT NULL REFERENCES subtareas(id_subtarea),
    descripcion TEXT,
    monto NUMERIC(14,2) NOT NULL CHECK (monto >= 0)
);

CREATE TABLE recordatorios (
    id_recordatorio BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_obra BIGINT NOT NULL REFERENCES obras(id_obra),
    fecha TIMESTAMP WITH TIME ZONE NOT NULL,
    descripcion TEXT NOT NULL
);

CREATE TABLE documentos (
    id_documento BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_lote BIGINT NOT NULL REFERENCES lotes(id_lote),
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    archivo TEXT
);

CREATE TABLE mensuras (
    id_documento BIGINT PRIMARY KEY REFERENCES documentos(id_documento),
    largo NUMERIC(10,2),
    mts_cuadrados NUMERIC(12,2),
    ancho NUMERIC(10,2),

    CHECK (largo IS NULL OR largo >= 0),
    CHECK (mts_cuadrados IS NULL OR mts_cuadrados >= 0),
    CHECK (ancho IS NULL OR ancho >= 0)
);

CREATE TABLE escrituras (
    id_documento BIGINT PRIMARY KEY REFERENCES documentos(id_documento),
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
    id_documento BIGINT NOT NULL REFERENCES escrituras(id_documento),
    id_propietario BIGINT NOT NULL REFERENCES propietarios(id_propietario),
    PRIMARY KEY (id_documento, id_propietario)
);
