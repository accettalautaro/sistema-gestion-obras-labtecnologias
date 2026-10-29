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

El inventario de los **61 endpoints** montados en el backend, con método, acceso y descripción, está en [docs/endpoints.md](./docs/endpoints.md).

## Pruebas con Postman

Importá [postman/gestion-obras.postman_collection.json](./postman/gestion-obras.postman_collection.json). La colección incluye un caso exitoso y otro de error para cada endpoint, guarda los IDs y tokens de prueba, y agrupa al final una carpeta de limpieza.

Usá una base de desarrollo con el esquema y la semilla aplicados, y ejecutá la colección completa en el Runner respetando el orden de las carpetas. Las solicitudes crean datos y las de la carpeta **Limpieza (ejecutar al final)** los eliminan; no la ejecutes contra una base con datos que deban conservarse. Las variables principales (`baseUrl`, DNI y contraseña del arquitecto) están en la colección; cambialas si la configuración local es diferente.
