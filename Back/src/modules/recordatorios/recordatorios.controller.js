import * as service from './recordatorios.service.js';

// GET /api/recordatorios
export const listarRecordatorios = async (req, res, next) => {
    try {
        const recordatorios = await service.listarRecordatorios(req);
        return res.status(200).json(recordatorios);
    } catch (error) {
        next(error);
    }
};

// GET /api/recordatorios/:id
export const obtenerRecordatorio = async (req, res, next) => {
    try {
        const recordatorio = await service.obtenerRecordatorio(req.params.id);
        if (!recordatorio) {
            return res.status(404).json({ error: 'Recordatorio no encontrado' });
        }
        return res.status(200).json(recordatorio);
    } catch (error) {
        next(error);
    }
};

// POST /api/recordatorios
export const crearRecordatorio = async (req, res, next) => {
    try {
        const { id_obra, fecha, descripcion } = req.body ?? {};
        if (!id_obra || !fecha || !descripcion) {
            return res.status(400).json({ error: 'id_obra, fecha y descripcion son obligatorios' });
        }

        const recordatorio = await service.crearRecordatorio({ id_obra, fecha, descripcion });
        return res.status(201).json(recordatorio);
    } catch (error) {
        next(error);
    }
};

// PUT /api/recordatorios/:id
export const actualizarRecordatorio = async (req, res, next) => {
    try {
        const { id_obra, fecha, descripcion } = req.body ?? {};
        if (!id_obra || !fecha || !descripcion) {
            return res.status(400).json({ error: 'id_obra, fecha y descripcion son obligatorios' });
        }

        const recordatorio = await service.actualizarRecordatorio(
            req.params.id,
            { id_obra, fecha, descripcion }
        );
        if (!recordatorio) {
            return res.status(404).json({ error: 'Recordatorio no encontrado' });
        }
        return res.status(200).json(recordatorio);
    } catch (error) {
        next(error);
    }
};

// DELETE /api/recordatorios/:id
export const eliminarRecordatorio = async (req, res, next) => {
    try {
        const eliminado = await service.eliminarRecordatorio(req.params.id);
        if (!eliminado) {
            return res.status(404).json({ error: 'Recordatorio no encontrado' });
        }
        return res.status(204).send();
    } catch (error) {
        next(error);
    }
};
