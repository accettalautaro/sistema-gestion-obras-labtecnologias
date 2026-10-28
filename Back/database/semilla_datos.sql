
SET client_encoding TO 'UTF8';
BEGIN;


-- Cuentas de prueba (solo desarrollo): DNI 1234567/admin y 7654321/cliente123.
-- El campo nombre almacena el hash bcrypt que valida la contraseña.
INSERT INTO usuarios (id_usuario, nombre, dni, rol) OVERRIDING SYSTEM VALUE VALUES
  (1, '$2b$10$hh59rhhtaWGvJgJhpAf04ul.PL6rquGxM.H6I2ZcAu.oKb5cgHLyi', '1234567', 'arquitecto'), --Contraseña: admin
  (2, '$2b$10$nEl/yE1w/FmROeRYaStY1u8tzILb1jayE0wKqrF1AcfPTd1o0GaPW', '7654321', 'cliente'), --Contraseña: cliente123
  (3, '$2b$10$NOJ4NuXKOJNYsiwtqJoUrOLLd6tYCDb2PUQkLXteffO255fdOYUHG', '1234', 'arquitecto')
ON CONFLICT (id_usuario) DO UPDATE SET nombre=EXCLUDED.nombre, dni=EXCLUDED.dni, rol=EXCLUDED.rol;


-- Arquitectos
INSERT INTO arquitectos (id_arquitecto, nombre, apellido, dni, telefono, email, nro_matricula, id_usuario) OVERRIDING SYSTEM VALUE VALUES
  (1, 'Marcelo', 'Accetta', '1234567', '2657353535', NULL, 7884566, 1),
  (2, 'Lautaro', 'Accetta', '2424244', '2664202020', NULL, 1234567, 3)
ON CONFLICT (id_arquitecto) DO UPDATE SET nombre=EXCLUDED.nombre, apellido=EXCLUDED.apellido, dni=EXCLUDED.dni, telefono=EXCLUDED.telefono, email=EXCLUDED.email, nro_matricula=EXCLUDED.nro_matricula, id_usuario=EXCLUDED.id_usuario;


-- Clientes
INSERT INTO clientes (id_cliente, nombre, apellido, dni, telefono, email, id_usuario) OVERRIDING SYSTEM VALUE VALUES
  (1, 'Juan', 'Perez', '123456789', '2664404040', 'juanperez@gmail.com', 2)
ON CONFLICT (id_cliente) DO UPDATE SET nombre=EXCLUDED.nombre, apellido=EXCLUDED.apellido, dni=EXCLUDED.dni, telefono=EXCLUDED.telefono, email=EXCLUDED.email, id_usuario=EXCLUDED.id_usuario;


-- Direcciones
INSERT INTO direcciones (id_direccion, provincia, codigo_postal, calle, altura, piso, departamento, localidad) OVERRIDING SYSTEM VALUE VALUES
  (1, 'San Luis', '5700', 'Ejercito de los Andes', '1234', NULL, NULL, 'San Luis'),
  (2, 'San Luis', '5700', 'Maipu', '1234', NULL, NULL, 'San Luis')
ON CONFLICT (id_direccion) DO UPDATE SET provincia=EXCLUDED.provincia, codigo_postal=EXCLUDED.codigo_postal, calle=EXCLUDED.calle, altura=EXCLUDED.altura, piso=EXCLUDED.piso, departamento=EXCLUDED.departamento, localidad=EXCLUDED.localidad;


-- Obras (deduplicadas por coincidencia de datos)
INSERT INTO obras (id_obra, id_cliente, id_arquitecto, fecha_inicio, fecha_fin, estado, descripcion) OVERRIDING SYSTEM VALUE VALUES
  (1, 1, 1, '2026-10-01', NULL, 'En ejecución', NULL),
  (2, 1, 1, '2026-11-01', '2027-01-01', 'Finalizada', NULL)
ON CONFLICT (id_obra) DO UPDATE SET id_cliente=EXCLUDED.id_cliente, id_arquitecto=EXCLUDED.id_arquitecto, fecha_inicio=EXCLUDED.fecha_inicio, fecha_fin=EXCLUDED.fecha_fin, estado=EXCLUDED.estado, descripcion=EXCLUDED.descripcion;


-- Lotes (asociados a la primera obra del mismo lote)
INSERT INTO lotes (id_lote, nro_lote, id_direccion, id_obra) OVERRIDING SYSTEM VALUE VALUES
  (1, '450', 1, 1),
  (2, '500', 2, 2)
ON CONFLICT (id_lote) DO UPDATE SET nro_lote=EXCLUDED.nro_lote, id_direccion=EXCLUDED.id_direccion, id_obra=EXCLUDED.id_obra;


-- Documentos (mensuras y escrituras)
INSERT INTO documentos (id_documento, id_lote, nombre, descripcion, archivo) OVERRIDING SYSTEM VALUE VALUES
  (1, 1, 'Mensura', 'Mensura del lote', NULL),
  (2, 1, 'Escritura', 'Escritura 1', NULL),
  (3, 2, 'Escritura', 'Escritura 2', NULL)
ON CONFLICT (id_documento) DO UPDATE SET id_lote=EXCLUDED.id_lote, nombre=EXCLUDED.nombre, descripcion=EXCLUDED.descripcion, archivo=EXCLUDED.archivo;


-- Mensuras
INSERT INTO mensuras (id_documento, largo, mts_cuadrados, ancho) VALUES
  (1, 20, 800, 40)
ON CONFLICT (id_documento) DO UPDATE SET largo=EXCLUDED.largo, mts_cuadrados=EXCLUDED.mts_cuadrados, ancho=EXCLUDED.ancho;


-- Escrituras
INSERT INTO escrituras (id_documento, nro_escritura) VALUES
  (2, '1'),
  (3, '2')
ON CONFLICT (id_documento) DO UPDATE SET nro_escritura=EXCLUDED.nro_escritura;


-- Propietarios (un registro por DNI)
INSERT INTO propietarios (id_propietario, apellido, dni, estado_civil, porcentaje, nombre) OVERRIDING SYSTEM VALUE VALUES
  (1, 'Perez', '123456789', 'Casado', 50, 'Juan'),
  (2, 'Rios', '987654321', 'Casado', 50, 'Maria')
ON CONFLICT (id_propietario) DO UPDATE SET apellido=EXCLUDED.apellido, dni=EXCLUDED.dni, estado_civil=EXCLUDED.estado_civil, porcentaje=EXCLUDED.porcentaje, nombre=EXCLUDED.nombre;


-- Relación entre escrituras y propietarios
INSERT INTO escritura_propietarios (id_documento, id_propietario) VALUES
  (2, 1),
  (2, 2),
  (3, 2)
ON CONFLICT (id_documento, id_propietario) DO NOTHING;


-- Tareas principales
INSERT INTO tareas (id_tarea, id_obra, nombre, duracion_estimada, porcentaje, descripcion, duracion_real, costo_estimado, costo_real, fecha_inicio, fecha_fin) OVERRIDING SYSTEM VALUE VALUES
  (1, 1, 'TRABAJOS PRELIMINARES', 15, 100, 'TRABAJOS PRELIMINARES', 15, 542000, 574520, '2026-07-01', '2026-07-15'),
  (2, 1, 'ESTRUCTURA', 11, 100, 'ESTRUCTURA', 11, 795000, 842700, '2026-07-16', '2026-07-26'),
  (3, 1, 'LOSA', 14, 100, 'LOSA', 14, 1128000, 1195680, '2026-07-27', '2026-08-09'),
  (4, 1, 'MAMPOSTERIA', 12, 100, 'MAMPOSTERIA', 12, 1041000, 1103460, '2026-08-10', '2026-08-21'),
  (5, 1, 'CONTRAPISO Y CARPETAS', 8, 100, 'CONTRAPISO Y CARPETAS', 8, 319000, 338140, '2026-08-22', '2026-08-29'),
  (6, 1, 'PISOS, ZOCALOS Y UMBRALES', 6, 100, 'PISOS, ZOCALOS Y UMBRALES', 6, 467000, 495020, '2026-08-30', '2026-09-04'),
  (7, 1, 'REVOQUES', 16, 100, 'REVOQUES', 16, 1378000, 1460680, '2026-09-05', '2026-09-20'),
  (8, 1, 'CIELORRASO', 4, 100, 'CIELORRASO', 4, 437000, 463220, '2026-09-21', '2026-09-24'),
  (9, 1, 'REVESTIMIENTOS', 9, 100, 'REVESTIMIENTOS', 9, 565000, 598900, '2026-09-25', '2026-10-03'),
  (10, 1, 'PINTURAS', 7, 100, 'PINTURAS', 7, 293000, 310580, '2026-10-04', '2026-10-10'),
  (11, 1, 'MARMOLERIA', 4, 100, 'MARMOLERIA', 4, 202000, 214120, '2026-10-11', '2026-10-14'),
  (12, 1, 'ABERTURAS', 14, 45, 'ABERTURAS', 0, 828000, 385820, '2026-10-15', '2026-10-28'),
  (13, 1, 'CARPINTERIA', 15, 0, 'CARPINTERIA', 0, 1622000, 0, '2026-10-29', '2026-11-12'),
  (14, 1, 'INSTALACION SANITARIA', 5, 0, 'INSTALACION SANITARIA', 0, 498000, 0, '2026-11-13', '2026-11-17'),
  (15, 1, 'INSTALACION ELECTRICA', 2, 0, 'INSTALACION ELECTRICA', 0, 115000, 0, '2026-11-18', '2026-11-19'),
  (16, 1, 'EQUIPAMIENTOS', 13, 0, 'EQUIPAMIENTOS', 0, 567000, 0, '2026-11-20', '2026-12-02'),
  (17, 1, 'VARIOS', 7, 0, 'VARIOS', 0, 563000, 0, '2026-12-03', '2026-12-09'),
  (18, 1, 'PILETA', 4, 0, 'PILETA', 0, 337000, 0, '2026-12-10', '2026-12-13'),
  (19, 2, 'Limpieza del terreno', 2, 0, 'Limpieza y nivelación inicial del terreno', 2, 50000, 50000, '2026-11-01', '2026-11-03')
ON CONFLICT (id_tarea) DO UPDATE SET id_obra=EXCLUDED.id_obra, nombre=EXCLUDED.nombre, duracion_estimada=EXCLUDED.duracion_estimada, porcentaje=EXCLUDED.porcentaje, descripcion=EXCLUDED.descripcion, duracion_real=EXCLUDED.duracion_real, costo_estimado=EXCLUDED.costo_estimado, costo_real=EXCLUDED.costo_real, fecha_inicio=EXCLUDED.fecha_inicio, fecha_fin=EXCLUDED.fecha_fin;


-- Subtareas
INSERT INTO subtareas (id_subtarea, id_tarea, nombre, duracion_estimada, porcentaje, descripcion, duracion_real, costo_estimado, costo_real, fecha_inicio, fecha_fin) OVERRIDING SYSTEM VALUE VALUES
  (1, 1, 'Replanteo', 2, 100, 'Replanteo', 2, 80000, 84800, '2026-07-01', '2026-07-02'),
  (2, 1, 'Limpieza y nivelación del terreno', 4, 100, NULL, 4, 117000, 124020, '2026-07-03', '2026-07-06'),
  (3, 1, 'Relleno y compactación del terreno', 6, 100, 'Relleno y compactación del terreno', 6, 154000, 163240, '2026-07-07', '2026-07-12'),
  (4, 1, 'Excavaciones para fundaciones', 3, 100, 'Excavaciones para fundaciones', 3, 191000, 202460, '2026-07-13', '2026-07-15'),
  (5, 2, 'Armado de armadura', 5, 100, 'Armado de armadura', 5, 228000, 241680, '2026-07-16', '2026-07-20'),
  (6, 2, 'Montaje de estructura', 2, 100, 'Montaje de estructura', 2, 265000, 280900, '2026-07-21', '2026-07-22'),
  (7, 2, 'Colado de hormigón', 4, 100, 'Colado de hormigón', 4, 302000, 320120, '2026-07-23', '2026-07-26'),
  (8, 3, 'Armado de losa', 6, 100, 'Armado de losa', 6, 339000, 359340, '2026-07-27', '2026-08-01'),
  (9, 3, 'Colado de hormigón para losa', 3, 100, 'Colado de hormigón para losa', 3, 376000, 398560, '2026-08-02', '2026-08-04'),
  (10, 3, 'Contratecho (carpeta de nivelación)', 5, 100, 'Contratecho (carpeta de nivelación)', 5, 413000, 437780, '2026-08-05', '2026-08-09'),
  (11, 4, 'De elevación s/ fundaciones hasta nivel de capa aisladora', 2, 100, 'De elevación s/ fundaciones hasta nivel de capa aisladora', 2, 450000, 477000, '2026-08-10', '2026-08-11'),
  (12, 4, 'Capa aisladora', 4, 100, 'Capa aisladora', 4, 487000, 516220, '2026-08-12', '2026-08-15'),
  (13, 4, 'Ladrillo cerámico (levantar paredes)', 6, 100, 'Ladrillo cerámico (levantar paredes)', 6, 104000, 110240, '2026-08-16', '2026-08-21'),
  (14, 5, 'Contrapiso pb', 3, 100, 'Contrapiso pb', 3, 141000, 149460, '2026-08-22', '2026-08-24'),
  (15, 5, 'De nivelación de concreto 2cm bajo solados', 5, 100, 'De nivelación de concreto 2cm bajo solados', 5, 178000, 188680, '2026-08-25', '2026-08-29'),
  (16, 6, 'Porcelanato', 2, 100, 'Porcelanato', 2, 215000, 227900, '2026-08-30', '2026-08-31'),
  (17, 6, 'Zócalo de porcelanato', 4, 100, 'Zócalo de porcelanato', 4, 252000, 267120, '2026-09-01', '2026-09-04'),
  (18, 7, 'Revoque grueso interior', 6, 100, 'Revoque grueso interior', 6, 289000, 306340, '2026-09-05', '2026-09-10'),
  (19, 7, 'Revoque grueso exterior', 3, 100, 'Revoque grueso exterior', 3, 326000, 345560, '2026-09-11', '2026-09-13'),
  (20, 7, 'Revoque fino o yeso (interior)', 5, 100, 'Revoque fino o yeso (interior)', 5, 363000, 384780, '2026-09-14', '2026-09-18'),
  (21, 7, 'Revoque plástico exterior o revoque fino exterior', 2, 100, 'Revoque plástico exterior o revoque fino exterior', 2, 400000, 424000, '2026-09-19', '2026-09-20'),
  (22, 8, 'Cielorraso', 4, 100, 'Cielorraso', 4, 437000, 463220, '2026-09-21', '2026-09-24'),
  (23, 9, 'Revestimiento cerámico baño', 6, 100, 'Revestimiento cerámico baño', 6, 474000, 502440, '2026-09-25', '2026-09-30'),
  (24, 9, 'Revestimiento de cocina', 3, 100, 'Revestimiento de cocina', 3, 91000, 96460, '2026-10-01', '2026-10-03'),
  (25, 10, 'Pintura exterior', 5, 100, 'Pintura exterior', 5, 128000, 135680, '2026-10-04', '2026-10-08'),
  (26, 10, 'Pintura interior', 2, 100, 'Pintura interior', 2, 165000, 174900, '2026-10-09', '2026-10-10'),
  (27, 11, 'Marmolería', 4, 100, 'Marmolería', 4, 202000, 214120, '2026-10-11', '2026-10-14'),
  (28, 12, 'Puertas interiores', 6, 100, 'Puertas interiores', 6, 239000, 253340, '2026-10-15', '2026-10-20'),
  (29, 12, 'Puertas entrada', 3, 45, 'Puertas entrada', 0, 276000, 132480, '2026-10-21', '2026-10-23'),
  (30, 12, 'Carpinterías s/planilla (ventanas, paños fijos, etc.)', 5, 0, 'Carpinterías s/planilla (ventanas, paños fijos, etc.)', 0, 313000, 0, '2026-10-24', '2026-10-28'),
  (31, 13, 'Muebles cocina', 2, 0, 'Muebles cocina', 0, 350000, 0, '2026-10-29', '2026-10-30'),
  (32, 13, 'Placares/vestidores', 4, 0, 'Placares/vestidores', 0, 387000, 0, '2026-10-31', '2026-11-03'),
  (33, 13, 'Muebles baños', 6, 0, 'Muebles baños', 0, 424000, 0, '2026-11-04', '2026-11-09'),
  (34, 13, 'Muebles varios', 3, 0, 'Muebles varios', 0, 461000, 0, '2026-11-10', '2026-11-12'),
  (35, 14, 'Calefacción (por radiadores o losa radiante)', 5, 0, 'Calefacción (por radiadores o losa radiante)', 0, 498000, 0, '2026-11-13', '2026-11-17'),
  (36, 15, 'Instalación aire acondicionado', 2, 0, 'Instalación aire acondicionado', 0, 115000, 0, '2026-11-18', '2026-11-19'),
  (37, 16, 'Termotanque eléctrico 80lts', 4, 0, 'Termotanque eléctrico 80lts', 0, 152000, 0, '2026-11-20', '2026-11-23'),
  (38, 16, 'Alarma', 6, 0, 'Alarma', 0, 189000, 0, '2026-11-24', '2026-11-29'),
  (39, 16, 'Portón eléctrico', 3, 0, 'Portón eléctrico', 0, 226000, 0, '2026-11-30', '2026-12-02'),
  (40, 17, 'Limpieza final fina (de la obra)', 5, 0, 'Limpieza final fina (de la obra)', 0, 263000, 0, '2026-12-03', '2026-12-07'),
  (41, 17, 'Limpieza de obra', 2, 0, 'Limpieza de obra', 0, 300000, 0, '2026-12-08', '2026-12-09'),
  (42, 18, 'Pileta', 4, 0, 'Pileta', 0, 337000, 0, '2026-12-10', '2026-12-13')
ON CONFLICT (id_subtarea) DO UPDATE SET id_tarea=EXCLUDED.id_tarea, nombre=EXCLUDED.nombre, duracion_estimada=EXCLUDED.duracion_estimada, porcentaje=EXCLUDED.porcentaje, descripcion=EXCLUDED.descripcion, duracion_real=EXCLUDED.duracion_real, costo_estimado=EXCLUDED.costo_estimado, costo_real=EXCLUDED.costo_real, fecha_inicio=EXCLUDED.fecha_inicio, fecha_fin=EXCLUDED.fecha_fin;


-- Pagos parciales (3 válidos; 1 referencias inválidas omitidas)
INSERT INTO pagos_parciales (id_pago, id_subtarea, descripcion, monto) OVERRIDING SYSTEM VALUE VALUES
  (1, 1, 'pago de la primera etapa', 1000000),
  (2, 5, 'pago de la segunda etapa', 2000000),
  (3, 5, 'pago de la segunda etapa', 2000000)
ON CONFLICT (id_pago) DO UPDATE SET id_subtarea=EXCLUDED.id_subtarea, descripcion=EXCLUDED.descripcion, monto=EXCLUDED.monto;


-- Recordatorios (la fecha JSON se interpreta a medianoche de Argentina)
INSERT INTO recordatorios (id_recordatorio, id_obra, fecha, descripcion) OVERRIDING SYSTEM VALUE VALUES
  (1, 1, '2026-09-29 00:00:00-03', 'Recordatorio de tarea ejemplo 1'),
  (2, 2, '2026-09-29 00:00:00-03', 'Recordatorio de tarea ejemplo 2'),
  (3, 2, '2026-10-05 00:00:00-03', 'Recordatorio de tarea ejemplo 3'),
  (4, 2, '2026-10-29 00:00:00-03', 'Recordatorio de tarea ejemplo 4')
ON CONFLICT (id_recordatorio) DO UPDATE SET id_obra=EXCLUDED.id_obra, fecha=EXCLUDED.fecha, descripcion=EXCLUDED.descripcion;


-- Ajustar las secuencias de columnas identity para que los siguientes INSERT generen IDs nuevos.

SELECT setval(pg_get_serial_sequence('usuarios', 'id_usuario'), COALESCE((SELECT MAX(id_usuario) FROM usuarios), 1), EXISTS (SELECT 1 FROM usuarios));
SELECT setval(pg_get_serial_sequence('arquitectos', 'id_arquitecto'), COALESCE((SELECT MAX(id_arquitecto) FROM arquitectos), 1), EXISTS (SELECT 1 FROM arquitectos));
SELECT setval(pg_get_serial_sequence('clientes', 'id_cliente'), COALESCE((SELECT MAX(id_cliente) FROM clientes), 1), EXISTS (SELECT 1 FROM clientes));
SELECT setval(pg_get_serial_sequence('direcciones', 'id_direccion'), COALESCE((SELECT MAX(id_direccion) FROM direcciones), 1), EXISTS (SELECT 1 FROM direcciones));
SELECT setval(pg_get_serial_sequence('obras', 'id_obra'), COALESCE((SELECT MAX(id_obra) FROM obras), 1), EXISTS (SELECT 1 FROM obras));
SELECT setval(pg_get_serial_sequence('lotes', 'id_lote'), COALESCE((SELECT MAX(id_lote) FROM lotes), 1), EXISTS (SELECT 1 FROM lotes));
SELECT setval(pg_get_serial_sequence('documentos', 'id_documento'), COALESCE((SELECT MAX(id_documento) FROM documentos), 1), EXISTS (SELECT 1 FROM documentos));
SELECT setval(pg_get_serial_sequence('propietarios', 'id_propietario'), COALESCE((SELECT MAX(id_propietario) FROM propietarios), 1), EXISTS (SELECT 1 FROM propietarios));
SELECT setval(pg_get_serial_sequence('tareas', 'id_tarea'), COALESCE((SELECT MAX(id_tarea) FROM tareas), 1), EXISTS (SELECT 1 FROM tareas));
SELECT setval(pg_get_serial_sequence('subtareas', 'id_subtarea'), COALESCE((SELECT MAX(id_subtarea) FROM subtareas), 1), EXISTS (SELECT 1 FROM subtareas));
SELECT setval(pg_get_serial_sequence('pagos_parciales', 'id_pago'), COALESCE((SELECT MAX(id_pago) FROM pagos_parciales), 1), EXISTS (SELECT 1 FROM pagos_parciales));
SELECT setval(pg_get_serial_sequence('recordatorios', 'id_recordatorio'), COALESCE((SELECT MAX(id_recordatorio) FROM recordatorios), 1), EXISTS (SELECT 1 FROM recordatorios));

COMMIT;
