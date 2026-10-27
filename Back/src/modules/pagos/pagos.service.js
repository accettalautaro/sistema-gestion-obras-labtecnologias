import * as repository from './pagos.repository.js';

const crearError = (mensaje) => Object.assign(new Error(mensaje), { status: 400 });
const esIdValido = (id) => /^\d{1,19}$/.test(String(id))
    && BigInt(id) > 0n
    && BigInt(id) <= 9223372036854775807n;

const validarPago = (pago) => {
    if (!pago || !esIdValido(pago.id_subtarea)) {
        throw crearError('id_subtarea debe ser un identificador válido.');
    }
    if (pago.monto === '' || pago.monto === null || pago.monto === undefined
        || !Number.isFinite(Number(pago.monto)) || Number(pago.monto) < 0) {
        throw crearError('monto debe ser un número mayor o igual a cero.');
    }
    if (pago.descripcion !== undefined && pago.descripcion !== null && typeof pago.descripcion !== 'string') {
        throw crearError('descripcion debe ser texto.');
    }
    return {
        id_subtarea: String(pago.id_subtarea),
        descripcion: pago.descripcion?.trim() || null,
        monto: Number(pago.monto),
    };
};

export const listarPagos = () => repository.listarTodos();

export const obtenerPago = (id) => {
    if (!esIdValido(id)) throw crearError('El identificador del pago no es válido.');
    return repository.obtenerPorId(String(id));
};

export const crearPago = (pago) => repository.crear(validarPago(pago));

export const actualizarPago = (id, pago) => {
    if (!esIdValido(id)) throw crearError('El identificador del pago no es válido.');
    return repository.actualizar(String(id), validarPago(pago));
};

export const eliminarPago = (id) => {
    if (!esIdValido(id)) throw crearError('El identificador del pago no es válido.');
    return repository.eliminar(String(id));
};