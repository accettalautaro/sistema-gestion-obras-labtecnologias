export const crearErrorHttp = (mensaje, status = 500) => Object.assign(new Error(mensaje), {
    status,
    statusCode: status,
});
