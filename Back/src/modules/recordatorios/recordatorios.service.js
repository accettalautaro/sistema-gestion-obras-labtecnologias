import * as repository from './recordatorios.repository.js';

export const listarRecordatorios = async (req) => {
    const { id_obra } = req.query;
    const recordatorios = await repository.listarTodos();

    if (id_obra) {
        return recordatorios.filter((recordatorio) => recordatorio.id_obra === id_obra);
    }
    return recordatorios;
};

export const crearRecordatorio = async (recordatorio) => {
    return repository.crearRecordatorio(recordatorio);
};

export const obtenerRecordatorio = async (id) => {
    return repository.obtenerRecordatorio(id);
};

export const actualizarRecordatorio = async (id, recordatorio) => {
    const { id_obra, fecha, descripcion } = recordatorio;
    return repository.actualizarRecordatorio(id, id_obra, fecha, descripcion);
};

export const eliminarRecordatorio = async (id) => {
    return repository.eliminarRecordatorio(id);
};
