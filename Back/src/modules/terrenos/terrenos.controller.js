import * as service from './terrenos.service.js';

const controlar = (handler) => async (req, res, next) => {
    try {
        return await handler(req, res);
    } catch (error) {
        return next(error);
    }
};

const responderNoEncontrado = (res, entidad) => res.status(404).json({ error: `${entidad} no encontrado.` });

export const listarTerrenos = controlar(async (req, res) =>
    res.status(200).json(await service.listarTerrenos()));

export const obtenerTerreno = controlar(async (req, res) => {
    const terreno = await service.obtenerTerreno(req.params.id);
    if (!terreno) return responderNoEncontrado(res, 'Terreno');
    return res.status(200).json(terreno);
});

export const crearTerreno = controlar(async (req, res) =>
    res.status(201).json(await service.crearTerreno(req.body)));

export const actualizarTerreno = controlar(async (req, res) => {
    const terreno = await service.actualizarTerreno(req.params.id, req.body);
    if (!terreno) return responderNoEncontrado(res, 'Terreno');
    return res.status(200).json(terreno);
});

export const eliminarTerreno = controlar(async (req, res) => {
    const eliminado = await service.eliminarTerreno(req.params.id);
    if (!eliminado) return responderNoEncontrado(res, 'Terreno');
    return res.status(204).send();
});

export const listarDirecciones = controlar(async (req, res) =>
    res.status(200).json(await service.listarDirecciones()));

export const obtenerDireccion = controlar(async (req, res) => {
    const direccion = await service.obtenerDireccion(req.params.id);
    if (!direccion) return responderNoEncontrado(res, 'Dirección');
    return res.status(200).json(direccion);
});

export const crearDireccion = controlar(async (req, res) =>
    res.status(201).json(await service.crearDireccion(req.body)));

export const actualizarDireccion = controlar(async (req, res) => {
    const direccion = await service.actualizarDireccion(req.params.id, req.body);
    if (!direccion) return responderNoEncontrado(res, 'Dirección');
    return res.status(200).json(direccion);
});

export const eliminarDireccion = controlar(async (req, res) => {
    const eliminado = await service.eliminarDireccion(req.params.id);
    if (!eliminado) return responderNoEncontrado(res, 'Dirección');
    return res.status(204).send();
});

export const listarMensuras = controlar(async (req, res) =>
    res.status(200).json(await service.listarMensuras()));

export const obtenerMensura = controlar(async (req, res) => {
    const mensura = await service.obtenerMensura(req.params.id);
    if (!mensura) return responderNoEncontrado(res, 'Mensura');
    return res.status(200).json(mensura);
});

export const crearMensura = controlar(async (req, res) =>
    res.status(201).json(await service.crearMensura(req.body)));

export const actualizarMensura = controlar(async (req, res) => {
    const mensura = await service.actualizarMensura(req.params.id, req.body);
    if (!mensura) return responderNoEncontrado(res, 'Mensura');
    return res.status(200).json(mensura);
});

export const eliminarMensura = controlar(async (req, res) => {
    const eliminado = await service.eliminarMensura(req.params.id);
    if (!eliminado) return responderNoEncontrado(res, 'Mensura');
    return res.status(204).send();
});

export const listarEscrituras = controlar(async (req, res) =>
    res.status(200).json(await service.listarEscrituras()));

export const obtenerEscritura = controlar(async (req, res) => {
    const escritura = await service.obtenerEscritura(req.params.id);
    if (!escritura) return responderNoEncontrado(res, 'Escritura');
    return res.status(200).json(escritura);
});

export const crearEscritura = controlar(async (req, res) =>
    res.status(201).json(await service.crearEscritura(req.body)));

export const actualizarEscritura = controlar(async (req, res) => {
    const escritura = await service.actualizarEscritura(req.params.id, req.body);
    if (!escritura) return responderNoEncontrado(res, 'Escritura');
    return res.status(200).json(escritura);
});

export const eliminarEscritura = controlar(async (req, res) => {
    const eliminado = await service.eliminarEscritura(req.params.id);
    if (!eliminado) return responderNoEncontrado(res, 'Escritura');
    return res.status(204).send();
});

export const listarPropietarios = controlar(async (req, res) =>
    res.status(200).json(await service.listarPropietarios(req.query.id_documento)));

export const obtenerPropietario = controlar(async (req, res) => {
    const propietario = await service.obtenerPropietario(req.params.id);
    if (!propietario) return responderNoEncontrado(res, 'Propietario');
    return res.status(200).json(propietario);
});

export const crearPropietario = controlar(async (req, res) =>
    res.status(201).json(await service.crearPropietario(req.body)));

export const actualizarPropietario = controlar(async (req, res) => {
    const propietario = await service.actualizarPropietario(req.params.id, req.body);
    if (!propietario) return responderNoEncontrado(res, 'Propietario');
    return res.status(200).json(propietario);
});

export const eliminarPropietario = controlar(async (req, res) => {
    const eliminado = await service.eliminarPropietario(req.params.id);
    if (!eliminado) return responderNoEncontrado(res, 'Propietario');
    return res.status(204).send();
});

export const vincularPropietario = controlar(async (req, res) => {
    const vinculo = await service.vincularPropietario(
        req.params.id, req.params.id_propietario, req.body?.porcentaje,
    );
    if (!vinculo) return res.status(404).json({ error: 'Escritura o propietario no encontrado.' });
    return res.status(201).json(vinculo);
});

export const desvincularPropietario = controlar(async (req, res) => {
    const eliminado = await service.desvincularPropietario(req.params.id, req.params.id_propietario);
    if (!eliminado) return res.status(404).json({ error: 'Relación de propietario no encontrada.' });
    return res.status(204).send();
});