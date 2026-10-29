import * as repository from './recordatorios.repository.js';

const errorCliente = (mensaje) => Object.assign(new Error(mensaje), { status: 400 });
const esIdValido = (id) => /^\d{1,19}$/.test(String(id))
    && BigInt(id) > 0n
    && BigInt(id) <= 9223372036854775807n;

const validarRecordatorio = (recordatorio) => {
    if (!recordatorio || typeof recordatorio !== 'object' || Array.isArray(recordatorio)) {
        throw errorCliente('Los datos del recordatorio deben ser un objeto.');
    }
    if (!esIdValido(recordatorio.id_obra)) {
        throw errorCliente('id_obra debe ser un identificador válido.');
    }
    if (typeof recordatorio.fecha !== 'string' || Number.isNaN(Date.parse(recordatorio.fecha))) {
        throw errorCliente('fecha debe ser una fecha válida.');
    }
    if (typeof recordatorio.descripcion !== 'string' || !recordatorio.descripcion.trim()) {
        throw errorCliente('descripcion es obligatoria.');
    }
    return {
        id_obra: String(recordatorio.id_obra),
        fecha: recordatorio.fecha,
        descripcion: recordatorio.descripcion.trim(),
    };
};

export const listarRecordatorios = async (req) => {
    const { id_obra } = req.query;
    if (Object.keys(req.query).some((parametro) => parametro !== 'id_obra')) {
        throw errorCliente('El filtro de recordatorios indicado no es válido.');
    }
    if (id_obra !== undefined && !esIdValido(id_obra)) {
        throw errorCliente('id_obra debe ser un identificador válido.');
    }
    const recordatorios = await repository.listarTodos();

    if (id_obra) {
        return recordatorios.filter((recordatorio) => String(recordatorio.id_obra) === String(id_obra));
    }
    return recordatorios;
};

export const crearRecordatorio = async (recordatorio) => {
    return repository.crearRecordatorio(validarRecordatorio(recordatorio));
};

export const obtenerRecordatorio = async (id) => {
    if (!esIdValido(id)) throw errorCliente('El identificador del recordatorio no es válido.');
    return repository.obtenerRecordatorio(String(id));
};

export const actualizarRecordatorio = async (id, recordatorio) => {
    if (!esIdValido(id)) throw errorCliente('El identificador del recordatorio no es válido.');
    const datos = validarRecordatorio(recordatorio);
    return repository.actualizarRecordatorio(String(id), datos.id_obra, datos.fecha, datos.descripcion);
};

export const eliminarRecordatorio = async (id) => {
    if (!esIdValido(id)) throw errorCliente('El identificador del recordatorio no es válido.');
    return repository.eliminarRecordatorio(String(id));
};
