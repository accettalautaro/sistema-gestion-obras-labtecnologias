# Colección de Postman

## Importar

En Postman, usa **Import** e importa estos dos archivos:

- `Sistema-Gestion-de-Obras.postman_collection.json`
- `Sistema-Gestion-de-Obras.local.postman_environment.json`

Selecciona el environment **Sistema Gestión de Obras - Local**. El `baseUrl` inicial es `http://localhost:3000`; cámbialo si tu backend escucha en otra dirección o puerto.

## Autenticación

La colección configura `Bearer {{token}}` en las rutas protegidas. Ejecuta **Auth → Login** con `nombreUsuario` y `dniUsuario` configurados en el environment. Si el login responde correctamente, un script guarda el token recibido en la variable `token` del environment.

## IDs

Completa las variables `idObra`, `idCliente`, `idArquitecto`, `idTarea`, `idSubtarea`, `idPago`, `idRecordatorio`, `idLote`, `idDireccion`, `idDocumento` e `idPropietario` con IDs existentes antes de ejecutar las solicitudes que los usan. Los cuerpos son ejemplos y pueden requerir IDs válidos de tu base de datos.

La colección incluye las rutas registradas actualmente en `Back/src/app.js` y sus módulos: auth, obras, tareas, subtareas, pagos, clientes, recordatorios y terrenos (direcciones, mensuras, escrituras y propietarios).
