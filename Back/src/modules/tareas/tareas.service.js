import * as repository from './tareas.repository.js';

const errorCliente = (mensaje) => Object.assign(new Error(mensaje), { status: 400 });
const MAX_BIGINT = 9223372036854775807n;

const validarId = (id, campo = 'identificador') => {
    const texto = String(id ?? '');
    if (!/^\d{1,19}$/.test(texto) || BigInt(texto) < 1n || BigInt(texto) > MAX_BIGINT) {
        throw errorCliente(`${campo} no es válido.`);
    }
    return texto;
};

const validarDatos = (tarea) => {
    if (!tarea || typeof tarea !== 'object' || Array.isArray(tarea)) {
        throw errorCliente('Los datos de la tarea deben ser un objeto.');
    }
    if (typeof tarea.nombre !== 'string' || !tarea.nombre.trim()) {
        throw errorCliente('nombre es obligatorio.');
    }
    const datos = { ...tarea, id_obra: validarId(tarea.id_obra, 'id_obra'), nombre: tarea.nombre.trim() };
    for (const campo of ['duracion_estimada', 'porcentaje', 'duracion_real', 'costo_estimado', 'costo_real']) {
        const valor = tarea[campo];
        if (valor === null || valor === undefined || valor === '') {
            datos[campo] = campo === 'porcentaje' ? 0 : null;
            continue;
        }
        const numero = Number(valor);
        if (!Number.isFinite(numero) || numero < 0 || (campo === 'porcentaje' && numero > 100)) {
            throw errorCliente(`${campo} debe ser un número válido${campo === 'porcentaje' ? ' entre 0 y 100' : ' no negativo'}.`);
        }
        datos[campo] = numero;
    }
    for (const campo of ['fecha_inicio', 'fecha_fin']) {
        const valor = tarea[campo];
        if (valor === null || valor === undefined || valor === '') {
            datos[campo] = null;
        } else if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)
            || Number.isNaN(Date.parse(`${valor}T00:00:00Z`))
            || new Date(`${valor}T00:00:00Z`).toISOString().slice(0, 10) !== valor) {
            throw errorCliente(`${campo} debe ser una fecha válida con formato YYYY-MM-DD.`);
        }
    }
    if (datos.fecha_inicio && datos.fecha_fin && datos.fecha_fin < datos.fecha_inicio) {
        throw errorCliente('fecha_fin no puede ser anterior a fecha_inicio.');
    }
    return datos;
};

export const listarTareas= async ()=>{

    const tareas = await repository.listarTodos();
    return tareas;

}
export const crearTarea= async (tarea)=>{
    return repository.crearTarea(validarDatos(tarea));
}

export const obtenerTarea= async (id)=>{
    return repository.obtenerTarea(validarId(id, 'id_tarea'));
}

export const actualizarTarea= async(id,tarea)=>{
    const datos = validarDatos(tarea);
    return repository.actualizarTarea(validarId(id, 'id_tarea'), datos.id_obra, datos.nombre, datos.duracion_estimada,
        datos.porcentaje, datos.descripcion ?? null, datos.duracion_real, datos.costo_estimado,
        datos.costo_real, datos.fecha_inicio, datos.fecha_fin);
}

export const eliminarTarea= async (id)=>{
    return repository.eliminar(validarId(id, 'id_tarea'));
}
