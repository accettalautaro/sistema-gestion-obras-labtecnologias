import * as service from './pagos.service.js';

export const listarPagos = async (req, res, next) => {
    try {
        return res.status(200).json(await service.listarPagos());
    } catch (error) {
        return next(error);
    }
};

export const obtenerPago = async (req, res, next) => {
    try {
        const pago = await service.obtenerPago(req.params.id);
        if (!pago) return res.status(404).json({ error: 'Pago no encontrado.' });
        return res.status(200).json(pago);
    } catch (error) {
        return next(error);
    }
};

export const crearPago = async (req, res, next) => {
    try {
        return res.status(201).json(await service.crearPago(req.body));
    } catch (error) {
        return next(error);
    }
};

export const actualizarPago = async (req, res, next) => {
    try {
        const pago = await service.actualizarPago(req.params.id, req.body);
        if (!pago) return res.status(404).json({ error: 'Pago no encontrado.' });
        return res.status(200).json(pago);
    } catch (error) {
        return next(error);
    }
};

export const eliminarPago = async (req, res, next) => {
    try {
        const eliminado = await service.eliminarPago(req.params.id);
        if (!eliminado) return res.status(404).json({ error: 'Pago no encontrado.' });
        return res.status(204).send();
    } catch (error) {
        return next(error);
    }
};