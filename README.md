# sistema-gestion-obras-labtecnologias
Esta es una version demo de nuestro sistema de gestion de obras.
Para poder utilizar esta demo hay que realizar los siguientes pasos:
Paso 1: Situarse en la direccion "..\sistema-gestion-obras-labtecnologias\frontend"
Paso 2: Correr en la terminal el siguiente comando "npm install" para instalar las dependencias
Paso 3: Levantar el servidor Vite con el comando "npm run dev"
Luego de esto podra acceder a la pagina desde el navegador mediante "http://localhost:5174/" o la direccion asociada a un puerto que usted tenga disponible

Datos requeridos para iniciar sesion:
Si usted desea iniciar como Cliente los datos son 
DNI: 7654321 
USUARIO: cliente123

Si usted desea iniciar como arquitecto los datos son:
DNI:1234567
USUARIO:admin

## Backend

El servidor Express se inicia desde `Back` con `npm run dev` (desarrollo) o `npm start`.
Configura PostgreSQL y el secreto JWT mediante `Back/.env`; no compartas ese archivo.
El script del esquema está en `Back/database/acettadb.sql`.

Los módulos siguen el recorrido **ruta → controller → service → repository → PostgreSQL**:

- La ruta define el método HTTP y los middlewares.
- El controller traduce la petición/respuesta HTTP y delega el trabajo.
- El service valida los datos y aplica reglas de negocio.
- El repository ejecuta consultas parametrizadas usando el pool de PostgreSQL.

La gestión de clientes utiliza `GET`, `POST`, `PUT` y `DELETE /api/clientes`; la cuenta se crea y vincula con `POST /api/auth/clientes/:id/usuario`. Estas operaciones requieren una sesión de arquitecto.

Las rutas privadas requieren `Authorization: Bearer <token>`. El token se obtiene con
`POST /api/auth/login`; `verificarToken` valida firma y vencimiento, y deja los datos
del usuario en `req.usuario`. Las escrituras de pagos y terrenos requieren además el
rol `arquitecto`.

### Pagos

Los pagos parciales se relacionan con una **subtarea** (`pagos_parciales.id_subtarea`),
no directamente con una tarea u obra. La obra y la tarea se devuelven en las consultas
a través de esa relación.

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/pagos` o `/api/pagos/:id` | Token |
| POST | `/api/pagos` | Arquitecto |
| PUT | `/api/pagos/:id` | Arquitecto |
| DELETE | `/api/pagos/:id` | Arquitecto |

Ejemplo de creación:

```json
{
  "id_subtarea": 4,
  "descripcion": "Adelanto de materiales",
  "monto": 500000
}
```

### Terrenos

`GET /api/terrenos` devuelve lotes con su dirección, mensuras, escrituras, propietarios
y obra asociada. `GET /api/terrenos/:id` devuelve un lote. Se pueden crear, actualizar
y eliminar lotes en `/api/terrenos`; los recursos relacionados tienen rutas CRUD bajo
`/api/terrenos/direcciones`, `/mensuras`, `/escrituras` y `/propietarios`.
Las asociaciones de propietarios a escrituras se administran en
`/api/terrenos/escrituras/:id/propietarios/:id_propietario`.

El alta de un lote admite dirección y mensura en la misma operación:

```json
{
  "nro_lote": "450",
  "direccion": {
    "calle": "Ejército de los Andes",
    "altura": "1234",
    "localidad": "San Luis",
    "provincia": "San Luis",
    "codigo_postal": "5700"
  },
  "mensura": {
    "ancho": 40,
    "largo": 20,
    "mts_cuadrados": 800
  }
}
```

> La autenticación de la interfaz sigue usando datos demo del front (`Back/data`).
> Es independiente del login JWT del backend; para consumir estas rutas desde la UI
> todavía hay que conectar el inicio de sesión y enviar el token en cada petición.

### Probar la API con Postman

Importá `postman/gestion-obras.postman_collection.json` en Postman. Iniciá el servidor,
configurá las variables `dni` y `contrasena` de la colección con credenciales existentes
en PostgreSQL y ejecutá primero **Autenticación → Login - guarda el token**. El resto de
las solicitudes hereda el token; para crear pagos, usá el ID de una subtarea existente
en `id_subtarea`. Las solicitudes de limpieza borran los registros de prueba creados.

La colección incluye obras porque sus rutas están montadas. Aunque los módulos de tareas
y subtareas tienen archivos de rutas, actualmente no están montados en `app.js`, por lo
que todavía no son accesibles desde HTTP.
