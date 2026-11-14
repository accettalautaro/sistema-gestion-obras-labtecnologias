import * as repository from './subtareas.repository.js';
import { derivarSubtarea } from '../obras/obras.service.js';

const errorCliente = (mensaje) => Object.assign(new Error(mensaje), { status: 400 });
const MAX_BIGINT = 9223372036854775807n;

const validarId = (id, campo = 'identificador') => {
    const texto = String(id ?? '');
    if (!/^\d{1,19}$/.test(texto) || BigInt(texto) < 1n || BigInt(texto) > MAX_BIGINT) {
        throw errorCliente(`${campo} no es válido.`);
    }
    return texto;
};

const validarFecha = (valor, campo) => {
    if (valor === null || valor === undefined || valor === '') return null;
    if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)
        || Number.isNaN(Date.parse(`${valor}T00:00:00Z`))
        || new Date(`${valor}T00:00:00Z`).toISOString().slice(0, 10) !== valor) {
        throw errorCliente(`${campo} debe ser una fecha válida con formato YYYY-MM-DD.`);
    }
    return valor;
};

const validarDatos = (subtarea) => {
    if (!subtarea || typeof subtarea !== 'object' || Array.isArray(subtarea)) {
        throw errorCliente('Los datos de la subtarea deben ser un objeto.');
    }
    if (typeof subtarea.nombre !== 'string' || !subtarea.nombre.trim()) {
        throw errorCliente('nombre es obligatorio.');
    }
    let costo_estimado = null;
    if (subtarea.costo_estimado !== null && subtarea.costo_estimado !== undefined && subtarea.costo_estimado !== '') {
        costo_estimado = Number(subtarea.costo_estimado);
        if (!Number.isFinite(costo_estimado) || costo_estimado < 0) {
            throw errorCliente('costo_estimado debe ser un número no negativo.');
        }
    }
    const fecha_inicio_estimada = validarFecha(subtarea.fecha_inicio_estimada, 'fecha_inicio_estimada');
    const fecha_fin_estimada = validarFecha(subtarea.fecha_fin_estimada, 'fecha_fin_estimada');
    if (fecha_inicio_estimada && fecha_fin_estimada && fecha_fin_estimada < fecha_inicio_estimada) {
        throw errorCliente('fecha_fin_estimada no puede ser anterior a fecha_inicio_estimada.');
    }
    return {
        id_tarea: validarId(subtarea.id_tarea, 'id_tarea'),
        nombre: subtarea.nombre.trim(),
        descripcion: subtarea.descripcion ?? null,
        costo_estimado,
        fecha_inicio_estimada,
        fecha_fin_estimada,
    };
};

export const crearSubtarea = async (subtarea) => repository.crearSubtarea(validarDatos(subtarea));

export const obtenerSubtarea = async (id) => {
    const filas = await repository.obtenerSubtarea(validarId(id, 'id_subtarea'));
    if (filas.length === 0) {
        throw Object.assign(new Error('Subtarea no encontrada.'), { status: 404 });
    }
    const fila = filas[0];
    const pagos = filas.filter((item) => item.id_pago != null).map((item) => ({
        id_pago: item.id_pago,
        descripcion: item.descripcion_pago,
        monto: Number(item.monto_pago) || 0,
    }));
    return derivarSubtarea({
        id_subtarea: fila.id_subtarea,
        id_tarea: fila.id_tarea,
        nombre: fila.nombre,
        descripcion: fila.descripcion,
        porcentaje: fila.porcentaje,
        costo_estimado: fila.costo_estimado,
        costo_real: pagos.reduce((total, pago) => total + pago.monto, 0),
        fecha_inicio_estimada: fila.fecha_inicio_estimada,
        fecha_fin_estimada: fila.fecha_fin_estimada,
        fecha_inicio_real: fila.fecha_inicio_real,
        fecha_fin_real: fila.fecha_fin_real,
        pagos,
    });
};

export const actualizarSubtarea = async (id, subtarea) => (
    repository.actualizarSubtarea(validarId(id, 'id_subtarea'), validarDatos(subtarea))
);

export const cambiarEstadoSubtarea = async (id, accion) => {
    if (!['iniciar', 'completar', 'reabrir'].includes(accion)) {
        throw errorCliente('La acción debe ser iniciar, completar o reabrir.');
    }
    return repository.cambiarEstado(validarId(id, 'id_subtarea'), accion);
};

export const eliminarSubtarea = async (id) => repository.eliminar(validarId(id, 'id_subtarea'));
