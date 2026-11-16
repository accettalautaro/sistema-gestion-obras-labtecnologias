
SET client_encoding TO 'UTF8';
BEGIN;


-- Cuentas de prueba (solo desarrollo): DNI 1234567/admin y 7654321/cliente.
-- Las credenciales de las cuentas de prueba están guardadas como hashes BCrypt.
-- Las credenciales heredadas en texto plano se migran al iniciar el backend.
INSERT INTO usuarios (id_usuario, nombre, dni, rol) OVERRIDING SYSTEM VALUE VALUES
  (1, '$2a$10$Py/gDCZQP2w17IT3qEYQueZ6SVcpC3Ij8v7Nt8bzN9lziQbqbb5JS', '1234567', 'arquitecto'), -- Usuario de prueba: admin
  (2, '$2a$10$Jr7dQkHbCwo3MZlT8CDFuuuCp1M7eQnTZ.HfAt1V4ZSmtrLIwJyi.', '7654321', 'cliente') -- Usuario de prueba: cliente
ON CONFLICT (id_usuario) DO UPDATE SET nombre=EXCLUDED.nombre, dni=EXCLUDED.dni, rol=EXCLUDED.rol;


-- Arquitectos
INSERT INTO arquitectos (id_arquitecto, nombre, apellido, dni, telefono, email, nro_matricula, id_usuario) OVERRIDING SYSTEM VALUE VALUES
  (1, 'Marcelo', 'Accetta', '1234567', '2664353535', 'marcelo.accetta@example.com', 7884566, 1)
ON CONFLICT (id_arquitecto) DO UPDATE SET nombre=EXCLUDED.nombre, apellido=EXCLUDED.apellido, dni=EXCLUDED.dni, telefono=EXCLUDED.telefono, email=EXCLUDED.email, nro_matricula=EXCLUDED.nro_matricula, id_usuario=EXCLUDED.id_usuario;


-- Clientes
INSERT INTO clientes (id_cliente, nombre, apellido, dni, telefono, email, id_usuario) OVERRIDING SYSTEM VALUE VALUES
  (1, 'Juan', 'Perez', '123456789', '2664404040', 'juan.perez@example.com', 2)
ON CONFLICT (id_cliente) DO UPDATE SET nombre=EXCLUDED.nombre, apellido=EXCLUDED.apellido, dni=EXCLUDED.dni, telefono=EXCLUDED.telefono, email=EXCLUDED.email, id_usuario=EXCLUDED.id_usuario;


-- Direcciones
INSERT INTO direcciones (id_direccion, provincia, codigo_postal, calle, altura, piso, departamento, localidad) OVERRIDING SYSTEM VALUE VALUES
  (1, 'San Luis', '5700', 'Ejercito de los Andes', '1234', NULL, NULL, 'San Luis'),
  (2, 'San Luis', '5700', 'Maipu', '1234', NULL, NULL, 'San Luis')
ON CONFLICT (id_direccion) DO UPDATE SET provincia=EXCLUDED.provincia, codigo_postal=EXCLUDED.codigo_postal, calle=EXCLUDED.calle, altura=EXCLUDED.altura, piso=EXCLUDED.piso, departamento=EXCLUDED.departamento, localidad=EXCLUDED.localidad;


-- Obras (deduplicadas por coincidencia de datos)
INSERT INTO obras (id_obra, nombre, id_cliente, id_arquitecto, fecha_inicio_estimada, fecha_fin_estimada, estado, descripcion) OVERRIDING SYSTEM VALUE VALUES
  (1, 'Vivienda unifamiliar', 1, 1, '2026-07-01', '2026-12-13', 'En Ejecución', 'Vivienda unifamiliar de 120 m². Obra en curso, con tareas iniciales y estructura finalizadas.'),
  (2, 'Ampliación residencial', 1, 1, '2026-11-10', '2027-01-15', 'No Inicio', 'Ampliación residencial planificada; inicio estimado para noviembre de 2026.'),
  (3, 'Vivienda terminada con sobrecostos', 1, 1, '2026-09-01', '2026-10-20', 'Finalizada', 'Obra de demostración: finalizada con atraso y por encima del presupuesto.')
ON CONFLICT (id_obra) DO UPDATE SET nombre=EXCLUDED.nombre, id_cliente=EXCLUDED.id_cliente, id_arquitecto=EXCLUDED.id_arquitecto, fecha_inicio_estimada=EXCLUDED.fecha_inicio_estimada, fecha_fin_estimada=EXCLUDED.fecha_fin_estimada, estado=EXCLUDED.estado, descripcion=EXCLUDED.descripcion;


-- Lotes
INSERT INTO lotes (id_lote, nro_lote, id_direccion) OVERRIDING SYSTEM VALUE VALUES
  (1, '450', 1),
  (2, '500', 2)
ON CONFLICT (id_lote) DO UPDATE SET nro_lote=EXCLUDED.nro_lote, id_direccion=EXCLUDED.id_direccion;

UPDATE obras SET id_lote=CASE id_obra WHEN 1 THEN 1 WHEN 2 THEN 2 WHEN 3 THEN 1 END
WHERE id_obra IN (1, 2, 3);


-- Documentos (mensuras y escrituras)
INSERT INTO documentos (id_documento, id_lote, nombre, descripcion, archivo) OVERRIDING SYSTEM VALUE VALUES
  (1, 1, 'Mensura', 'Plano de mensura aprobado del lote 450.', NULL),
  (2, 1, 'Escritura', 'Escritura traslativa de dominio del lote 450.', NULL),
  (3, 2, 'Escritura', 'Escritura traslativa de dominio del lote 500.', NULL)
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
INSERT INTO propietarios (id_propietario, apellido, dni, estado_civil, nombre) OVERRIDING SYSTEM VALUE VALUES
  (1, 'Perez', '123456789', 'Casado', 'Juan'),
  (2, 'Rios', '987654321', 'Casado', 'Maria')
ON CONFLICT (id_propietario) DO UPDATE SET apellido=EXCLUDED.apellido, dni=EXCLUDED.dni, estado_civil=EXCLUDED.estado_civil, nombre=EXCLUDED.nombre;


-- Relación entre escrituras y propietarios
INSERT INTO escritura_propietarios (id_documento, id_propietario, porcentaje) VALUES
  (2, 1, 50),
  (2, 2, 50),
  (3, 2, 100)
ON CONFLICT (id_documento, id_propietario) DO UPDATE SET porcentaje=EXCLUDED.porcentaje;


-- Tareas principales
INSERT INTO tareas (id_tarea, id_obra, nombre, descripcion, fecha_inicio_estimada, fecha_fin_estimada) OVERRIDING SYSTEM VALUE VALUES
  (1, 1, 'TRABAJOS PRELIMINARES', 'TRABAJOS PRELIMINARES', '2026-07-01', '2026-07-15'),
  (2, 1, 'ESTRUCTURA', 'ESTRUCTURA', '2026-07-16', '2026-07-26'),
  (3, 1, 'LOSA', 'LOSA', '2026-07-27', '2026-08-09'),
  (4, 1, 'MAMPOSTERIA', 'MAMPOSTERIA', '2026-08-10', '2026-08-21'),
  (5, 1, 'CONTRAPISO Y CARPETAS', 'CONTRAPISO Y CARPETAS', '2026-08-22', '2026-08-29'),
  (6, 1, 'PISOS, ZOCALOS Y UMBRALES', 'PISOS, ZOCALOS Y UMBRALES', '2026-08-30', '2026-09-04'),
  (7, 1, 'REVOQUES', 'REVOQUES', '2026-09-05', '2026-09-20'),
  (8, 1, 'CIELORRASO', 'CIELORRASO', '2026-09-21', '2026-09-24'),
  (9, 1, 'REVESTIMIENTOS', 'REVESTIMIENTOS', '2026-09-25', '2026-10-03'),
  (10, 1, 'PINTURAS', 'PINTURAS', '2026-10-04', '2026-10-10'),
  (11, 1, 'MARMOLERIA', 'MARMOLERIA', '2026-10-11', '2026-10-14'),
  (12, 1, 'ABERTURAS', 'ABERTURAS', '2026-10-15', '2026-10-28'),
  (13, 1, 'CARPINTERIA', 'CARPINTERIA', '2026-10-29', '2026-11-12'),
  (14, 1, 'INSTALACION SANITARIA', 'INSTALACION SANITARIA', '2026-11-13', '2026-11-17'),
  (15, 1, 'INSTALACION ELECTRICA', 'INSTALACION ELECTRICA', '2026-11-18', '2026-11-19'),
  (16, 1, 'EQUIPAMIENTOS', 'EQUIPAMIENTOS', '2026-11-20', '2026-12-02'),
  (17, 1, 'VARIOS', 'VARIOS', '2026-12-03', '2026-12-09'),
  (18, 1, 'PILETA', 'PILETA', '2026-12-10', '2026-12-13'),
  (19, 2, 'Limpieza del terreno', 'Limpieza y nivelación inicial del terreno', '2026-11-10', '2026-11-11'),
  (20, 3, 'Fundaciones y estructura', 'Ejecución de fundaciones y estructura principal.', '2026-09-01', '2026-09-20'),
  (21, 3, 'Cerramientos e instalaciones', 'Ejecución de mampostería e instalaciones.', '2026-09-21', '2026-10-10'),
  (22, 3, 'Terminaciones y entrega', 'Terminaciones finales y entrega de la vivienda.', '2026-10-11', '2026-10-20')
ON CONFLICT (id_tarea) DO UPDATE SET id_obra=EXCLUDED.id_obra, nombre=EXCLUDED.nombre, descripcion=EXCLUDED.descripcion, fecha_inicio_estimada=EXCLUDED.fecha_inicio_estimada, fecha_fin_estimada=EXCLUDED.fecha_fin_estimada;


-- Subtareas
INSERT INTO subtareas (id_subtarea, id_tarea, nombre, porcentaje, descripcion, costo_estimado, fecha_inicio_estimada, fecha_fin_estimada) OVERRIDING SYSTEM VALUE VALUES
  (1, 1, 'Replanteo', 100, 'Replanteo', 80000, '2026-07-01', '2026-07-02'),
  (2, 1, 'Limpieza y nivelación del terreno', 100, 'Retiro de vegetación y nivelación del terreno.', 117000, '2026-07-03', '2026-07-06'),
  (3, 1, 'Relleno y compactación del terreno', 100, 'Relleno y compactación del terreno', 154000, '2026-07-07', '2026-07-12'),
  (4, 1, 'Excavaciones para fundaciones', 100, 'Excavaciones para fundaciones', 191000, '2026-07-13', '2026-07-15'),
  (5, 2, 'Armado de armadura', 100, 'Armado de armadura', 228000, '2026-07-16', '2026-07-20'),
  (6, 2, 'Montaje de estructura', 100, 'Montaje de estructura', 265000, '2026-07-21', '2026-07-22'),
  (7, 2, 'Colado de hormigón', 100, 'Colado de hormigón', 302000, '2026-07-23', '2026-07-26'),
  (8, 3, 'Armado de losa', 100, 'Armado de losa', 339000, '2026-07-27', '2026-08-01'),
  (9, 3, 'Colado de hormigón para losa', 100, 'Colado de hormigón para losa', 376000, '2026-08-02', '2026-08-04'),
  (10, 3, 'Contratecho (carpeta de nivelación)', 100, 'Contratecho (carpeta de nivelación)', 413000, '2026-08-05', '2026-08-09'),
  (11, 4, 'De elevación s/ fundaciones hasta nivel de capa aisladora', 100, 'De elevación s/ fundaciones hasta nivel de capa aisladora', 450000, '2026-08-10', '2026-08-11'),
  (12, 4, 'Capa aisladora', 100, 'Capa aisladora', 487000, '2026-08-12', '2026-08-15'),
  (13, 4, 'Ladrillo cerámico (levantar paredes)', 100, 'Ladrillo cerámico (levantar paredes)', 104000, '2026-08-16', '2026-08-21'),
  (14, 5, 'Contrapiso pb', 100, 'Contrapiso pb', 141000, '2026-08-22', '2026-08-24'),
  (15, 5, 'De nivelación de concreto 2cm bajo solados', 100, 'De nivelación de concreto 2cm bajo solados', 178000, '2026-08-25', '2026-08-29'),
  (16, 6, 'Porcelanato', 100, 'Porcelanato', 215000, '2026-08-30', '2026-08-31'),
  (17, 6, 'Zócalo de porcelanato', 100, 'Zócalo de porcelanato', 252000, '2026-09-01', '2026-09-04'),
  (18, 7, 'Revoque grueso interior', 100, 'Revoque grueso interior', 289000, '2026-09-05', '2026-09-10'),
  (19, 7, 'Revoque grueso exterior', 100, 'Revoque grueso exterior', 326000, '2026-09-11', '2026-09-13'),
  (20, 7, 'Revoque fino o yeso (interior)', 100, 'Revoque fino o yeso (interior)', 363000, '2026-09-14', '2026-09-18'),
  (21, 7, 'Revoque plástico exterior o revoque fino exterior', 100, 'Revoque plástico exterior o revoque fino exterior', 400000, '2026-09-19', '2026-09-20'),
  (22, 8, 'Cielorraso', 100, 'Cielorraso', 437000, '2026-09-21', '2026-09-24'),
  (23, 9, 'Revestimiento cerámico baño', 100, 'Revestimiento cerámico baño', 474000, '2026-09-25', '2026-09-30'),
  (24, 9, 'Revestimiento de cocina', 100, 'Revestimiento de cocina', 91000, '2026-10-01', '2026-10-03'),
  (25, 10, 'Pintura exterior', 100, 'Pintura exterior', 128000, '2026-10-04', '2026-10-08'),
  (26, 10, 'Pintura interior', 100, 'Pintura interior', 165000, '2026-10-09', '2026-10-10'),
  (27, 11, 'Marmolería', 100, 'Marmolería', 202000, '2026-10-11', '2026-10-14'),
  (28, 12, 'Puertas interiores', 100, 'Puertas interiores', 239000, '2026-10-15', '2026-10-20'),
  (29, 12, 'Puertas entrada', 45, 'Puertas entrada', 276000, '2026-10-21', '2026-10-23'),
  (30, 12, 'Carpinterías s/planilla (ventanas, paños fijos, etc.)', 0, 'Carpinterías s/planilla (ventanas, paños fijos, etc.)', 313000, '2026-10-24', '2026-10-28'),
  (31, 13, 'Muebles cocina', 0, 'Muebles cocina', 350000, '2026-10-29', '2026-10-30'),
  (32, 13, 'Placares/vestidores', 0, 'Placares/vestidores', 387000, '2026-10-31', '2026-11-03'),
  (33, 13, 'Muebles baños', 0, 'Muebles baños', 424000, '2026-11-04', '2026-11-09'),
  (34, 13, 'Muebles varios', 0, 'Muebles varios', 461000, '2026-11-10', '2026-11-12'),
  (35, 14, 'Calefacción (por radiadores o losa radiante)', 0, 'Calefacción (por radiadores o losa radiante)', 498000, '2026-11-13', '2026-11-17'),
  (36, 15, 'Instalación aire acondicionado', 0, 'Instalación aire acondicionado', 115000, '2026-11-18', '2026-11-19'),
  (37, 16, 'Termotanque eléctrico 80lts', 0, 'Termotanque eléctrico 80lts', 152000, '2026-11-20', '2026-11-23'),
  (38, 16, 'Alarma', 0, 'Alarma', 189000, '2026-11-24', '2026-11-29'),
  (39, 16, 'Portón eléctrico', 0, 'Portón eléctrico', 226000, '2026-11-30', '2026-12-02'),
  (40, 17, 'Limpieza final fina (de la obra)', 0, 'Limpieza final fina (de la obra)', 263000, '2026-12-03', '2026-12-07'),
  (41, 17, 'Limpieza de obra', 0, 'Limpieza de obra', 300000, '2026-12-08', '2026-12-09'),
  (42, 18, 'Pileta', 0, 'Pileta', 337000, '2026-12-10', '2026-12-13'),
  (43, 20, 'Excavación y bases', 100, 'Excavación y ejecución de bases.', 500000, '2026-09-01', '2026-09-10'),
  (44, 20, 'Estructura de hormigón', 100, 'Armado y colado de la estructura.', 700000, '2026-09-11', '2026-09-20'),
  (45, 21, 'Mampostería', 100, 'Levantamiento de muros y cerramientos.', 600000, '2026-09-21', '2026-09-30'),
  (46, 21, 'Instalaciones', 100, 'Instalaciones sanitarias y eléctricas.', 400000, '2026-10-01', '2026-10-10'),
  (47, 22, 'Revestimientos y pintura', 100, 'Revestimientos interiores y pintura.', 450000, '2026-10-11', '2026-10-16'),
  (48, 22, 'Limpieza y entrega', 100, 'Limpieza final y entrega de obra.', 350000, '2026-10-17', '2026-10-20')
ON CONFLICT (id_subtarea) DO UPDATE SET id_tarea=EXCLUDED.id_tarea, nombre=EXCLUDED.nombre, porcentaje=EXCLUDED.porcentaje, descripcion=EXCLUDED.descripcion, costo_estimado=EXCLUDED.costo_estimado, fecha_inicio_estimada=EXCLUDED.fecha_inicio_estimada, fecha_fin_estimada=EXCLUDED.fecha_fin_estimada;

-- Pagos parciales de demostración; su suma define el costo real de cada subtarea.
INSERT INTO pagos_parciales (id_pago, id_subtarea, descripcion, monto) OVERRIDING SYSTEM VALUE VALUES
  (1, 1, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=1), 84800),
  (2, 2, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=2), 124020),
  (3, 3, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=3), 163240),
  (4, 4, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=4), 202460),
  (5, 5, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=5), 241680),
  (6, 6, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=6), 280900),
  (7, 7, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=7), 320120),
  (8, 8, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=8), 359340),
  (9, 9, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=9), 398560),
  (10, 10, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=10), 437780),
  (11, 11, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=11), 477000),
  (12, 12, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=12), 516220),
  (13, 13, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=13), 110240),
  (14, 14, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=14), 149460),
  (15, 15, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=15), 188680),
  (16, 16, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=16), 227900),
  (17, 17, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=17), 267120),
  (18, 18, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=18), 306340),
  (19, 19, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=19), 345560),
  (20, 20, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=20), 384780),
  (21, 21, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=21), 424000),
  (22, 22, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=22), 463220),
  (23, 23, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=23), 502440),
  (24, 24, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=24), 96460),
  (25, 25, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=25), 135680),
  (26, 26, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=26), 174900),
  (27, 27, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=27), 214120),
  (28, 28, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=28), 253340),
  (29, 29, 'Pago registrado por avance de: ' || (SELECT nombre FROM subtareas WHERE id_subtarea=29), 132480),
  (30, 43, 'Anticipo de excavación y bases', 300000),
  (31, 43, 'Saldo de excavación y bases', 300000),
  (32, 44, 'Anticipo de estructura de hormigón', 420000),
  (33, 44, 'Saldo de estructura de hormigón', 420000),
  (34, 45, 'Anticipo de mampostería', 360000),
  (35, 45, 'Saldo de mampostería', 360000),
  (36, 46, 'Anticipo de instalaciones', 240000),
  (37, 46, 'Saldo de instalaciones', 240000),
  (38, 47, 'Anticipo de revestimientos y pintura', 270000),
  (39, 47, 'Saldo de revestimientos y pintura', 270000),
  (40, 48, 'Anticipo de limpieza y entrega', 210000),
  (41, 48, 'Saldo de limpieza y entrega', 210000)
ON CONFLICT (id_pago) DO UPDATE SET id_subtarea=EXCLUDED.id_subtarea, descripcion=EXCLUDED.descripcion, monto=EXCLUDED.monto;


-- Fechas reales de ejemplo en las subtareas iniciadas o completadas.
UPDATE subtareas
SET fecha_inicio_real = CASE WHEN porcentaje > 0 THEN fecha_inicio_estimada ELSE NULL END,
    fecha_fin_real = CASE WHEN porcentaje = 100 THEN fecha_fin_estimada ELSE NULL END;

-- La obra 3 se terminó después de la fecha estimada y cada subtarea excedió su presupuesto.
UPDATE subtareas
SET fecha_inicio_real = fecha_inicio_estimada,
    fecha_fin_real = CASE id_subtarea
      WHEN 43 THEN '2026-09-12'::date
      WHEN 44 THEN '2026-09-25'::date
      WHEN 45 THEN '2026-10-05'::date
      WHEN 46 THEN '2026-10-15'::date
      WHEN 47 THEN '2026-10-22'::date
      WHEN 48 THEN '2026-11-05'::date
    END
WHERE id_subtarea BETWEEN 43 AND 48;

-- Recordatorios de seguimiento con fechas próximas al cronograma de las obras.
INSERT INTO recordatorios (id_recordatorio, id_obra, fecha, descripcion) OVERRIDING SYSTEM VALUE VALUES
  (1, 1, '2026-11-09 09:00:00-03', 'Confirmar entrega de carpinterías para la vivienda.'),
  (2, 2, '2026-11-09 10:00:00-03', 'Coordinar el acceso al lote antes del inicio de obra.'),
  (3, 2, '2026-11-10 08:00:00-03', 'Verificar limpieza y nivelación del terreno.'),
  (4, 1, '2026-11-12 16:00:00-03', 'Revisar el avance de carpintería y actualizar el cronograma.')
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
