# Sistema de gestión de obras

Datos requeridos para iniciar sesion:
Si usted desea iniciar como Cliente los datos son 
DNI: 7654321 
CONTRASEÑA: cliente123

Si usted desea iniciar como arquitecto los datos son:
DNI:1234567
CONTRASEÑA: admin

El esquema y la base de datos son pasos distintos. `Back/database/acettadb.sql` crea las tablas en la base a la que ya está conectado `psql`; no crea ni selecciona una base por sí solo. Para preparar una base nueva, desde la raíz del repositorio:

```powershell
createdb -U postgres accettadb
psql -U postgres -d accettadb -f Back/database/acettadb.sql
psql -U postgres -d accettadb -f Back/database/semilla_datos.sql
```

`acettadb.sql` ya define el esquema actualizado, por lo que no hay que ejecutar las migraciones sobre una base recién creada con ese archivo. Si tenés una base existente con el esquema anterior (fechas `fecha_inicio`/`fecha_fin`, métricas persistidas y `lotes.id_obra`), ejecutá las migraciones una sola vez y en este orden, desde la raíz del repositorio. La migración 009 es segura aunque la columna que elimina no exista; la 010 agrega `obras.nombre`:

```powershell
psql -v ON_ERROR_STOP=1 -U postgres -d accettadb -f Back/database/migrations/001_fechas_estimadas_y_reales.sql
psql -v ON_ERROR_STOP=1 -U postgres -d accettadb -f Back/database/migrations/002_duraciones_calculadas.sql
psql -v ON_ERROR_STOP=1 -U postgres -d accettadb -f Back/database/migrations/003_calculos_jerarquicos.sql
psql -v ON_ERROR_STOP=1 -U postgres -d accettadb -f Back/database/migrations/004_estado_derivado_de_obra.sql
psql -v ON_ERROR_STOP=1 -U postgres -d accettadb -f Back/database/migrations/005_notificaciones_programadas_recordatorios.sql
psql -v ON_ERROR_STOP=1 -U postgres -d accettadb -f Back/database/migrations/006_metricas_calculadas_no_persistidas.sql
psql -v ON_ERROR_STOP=1 -U postgres -d accettadb -f Back/database/migrations/007_lote_compartido_entre_obras.sql
psql -v ON_ERROR_STOP=1 -U postgres -d accettadb -f Back/database/migrations/009_eliminar_marca_cambio_contrasena.sql
psql -v ON_ERROR_STOP=1 -U postgres -d accettadb -f Back/database/migrations/010_agregar_nombre_a_obras.sql
```

Cada comando se detiene ante un error. La migración 007 transfiere las asignaciones existentes de `lotes.id_obra` a `obras.id_lote`; las obras que no tenían lote quedan sin asignación. Al terminar, un lote puede estar asociado a varias obras. No ejecutes esta secuencia si alguna de estas migraciones ya fue aplicada a la base.

La migración 009 elimina la columna heredada `debe_cambiar_contrasena` si existe. El cambio inicial se detecta comparando la contraseña ingresada con el hash guardado y verificando que coincida con los últimos cuatro dígitos del DNI. Las cuentas existentes con otra contraseña no deben cambiarla al iniciar sesión.



En `.env` dentro de `Back`, configurá `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD` y `PGDATABASE=accettadb` para que el pool de Node se conecte a esa misma base. También son necesarios `JWT_SECRET` y, opcionalmente, `JWT_EXPIRES_IN`, `PORT` y `CORS_ORIGIN`. No subas el `.env` al repositorio ni compartas sus secretos.

Las credenciales incluidas por la semilla son solo para desarrollo:

- Arquitecto: DNI `1234567`, contraseña `admin`.
- Cliente: DNI `7654321`, contraseña `cliente123`.

La semilla crea una única cuenta de arquitecto. El flujo de alta disponible en la API crea cuentas únicamente para clientes existentes y les asigna el rol `cliente`.

## Iniciar la aplicación

Backend:

```powershell
cd Back
npm install
npm run dev
```

Frontend, en otra terminal:

```powershell
cd frontend
npm install
npm run dev
```

Vite muestra en la terminal la URL local del frontend. El backend escucha en el puerto indicado por `PORT` (por defecto, `3000`).

## Backend y API

Los módulos siguen el recorrido **ruta → controller → service → repository → PostgreSQL**:

- La ruta define el método HTTP y los middlewares de autenticación/autorización.
- El controller traduce la petición y respuesta HTTP.
- El service valida datos y aplica reglas de negocio.
- El repository ejecuta consultas parametrizadas mediante el pool de PostgreSQL.

Las rutas no existentes responden `404`. Los cuerpos JSON malformados y los datos de entrada inválidos responden `400`; los errores de autenticación/autorización conservan sus códigos `401`/`403`.

El inventario de los **63 endpoints** montados en el backend, con método, acceso y descripción, está en [docs/endpoints.md](./docs/endpoints.md).

## Pruebas con Postman

Importá [pruebas-postman/gestion-obras.postman_collection.json](./pruebas-postman/gestion-obras.postman_collection.json). La colección cubre los endpoints de tareas, subtareas, pagos, recordatorios y recursos de terrenos que el frontend aún no consume desde la API. Las lecturas usan IDs de `Back/database/semilla_datos.sql`; las escrituras crean registros temporales, guardan sus IDs en variables de colección y los eliminan al final de cada flujo.

Usá una base de desarrollo con el esquema y la semilla aplicados. Ejecutá la colección completa en el Runner y en orden: la primera solicitud inicia sesión como arquitecto y guarda el token para las demás. La colección crea y borra datos temporales; no la ejecutes contra una base con datos que deban conservarse. Las variables principales (`baseUrl`, DNI y contraseña del arquitecto) están en la colección; cambialas si la configuración local es diferente.
