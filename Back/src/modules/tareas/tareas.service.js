import * as repository from './tareas.repository.js';
import { derivarTarea } from '../obras/obras.service.js';

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

const validarDatos = (tarea) => {
    if (!tarea || typeof tarea !== 'object' || Array.isArray(tarea)) {
        throw errorCliente('Los datos de la tarea deben ser un objeto.');
    }
    if (typeof tarea.nombre !== 'string' || !tarea.nombre.trim()) {
        throw errorCliente('nombre es obligatorio.');
    }
    const fecha_inicio_estimada = validarFecha(tarea.fecha_inicio_estimada, 'fecha_inicio_estimada');
    const fecha_fin_estimada = validarFecha(tarea.fecha_fin_estimada, 'fecha_fin_estimada');
    if (fecha_inicio_estimada && fecha_fin_estimada && fecha_fin_estimada < fecha_inicio_estimada) {
        throw errorCliente('fecha_fin_estimada no puede ser anterior a fecha_inicio_estimada.');
    }
    return {
        id_obra: validarId(tarea.id_obra, 'id_obra'),
        nombre: tarea.nombre.trim(),
        descripcion: tarea.descripcion ?? null,
        fecha_inicio_estimada,
        fecha_fin_estimada,
    };
};

function mapearTarea(filas) {
    const fila = filas[0];
    const subtareasPorId = new Map();
    filas.filter((item) => item.subtarea_id != null).forEach((item) => {
        const subtarea = subtareasPorId.get(item.subtarea_id) ?? {
            id_subtarea: item.subtarea_id,
            nombre: item.subtarea_nombre,
            descripcion: item.subtarea_descripcion,
            porcentaje: item.subtarea_porcentaje,
            costo_estimado: item.subtarea_costo_estimado,
            costo_real: 0,
            fecha_inicio_estimada: item.subtarea_fecha_inicio_estimada,
            fecha_fin_estimada: item.subtarea_fecha_fin_estimada,
            fecha_inicio_real: item.subtarea_fecha_inicio_real,
            fecha_fin_real: item.subtarea_fecha_fin_real,
        };
        subtarea.costo_real += Number(item.subtarea_monto_pago) || 0;
        subtareasPorId.set(item.subtarea_id, subtarea);
    });
    const subtareas = [...subtareasPorId.values()];
    const derivada = derivarTarea(subtareas);
    const {
        subtarea_id,
        subtarea_nombre,
        subtarea_descripcion,
        subtarea_porcentaje,
        subtarea_costo_estimado,
        subtarea_fecha_inicio_estimada,
        subtarea_fecha_fin_estimada,
        subtarea_fecha_inicio_real,
        subtarea_fecha_fin_real,
        subtarea_monto_pago,
        ...datosTarea
    } = fila;
    return { ...datosTarea, ...derivada };
}

export const listarTareas = async () => {
    const filas = await repository.listarTodos();
    const grupos = new Map();
    for (const fila of filas) {
        if (!grupos.has(fila.id_tarea)) grupos.set(fila.id_tarea, []);
        grupos.get(fila.id_tarea).push(fila);
    }
    return Array.from(grupos.values(), mapearTarea);
};

export const crearTarea = async (tarea) => repository.crearTarea(validarDatos(tarea));

export const obtenerTarea = async (id) => {
    const filas = await repository.obtenerTarea(validarId(id, 'id_tarea'));
    if (filas.length === 0) {
        throw Object.assign(new Error('Tarea no encontrada.'), { status: 404 });
    }
    return mapearTarea(filas);
};

export const actualizarTarea = async (id, tarea) => (
    repository.actualizarTarea(validarId(id, 'id_tarea'), validarDatos(tarea))
);

export const eliminarTarea = async (id) => repository.eliminar(validarId(id, 'id_tarea'));
