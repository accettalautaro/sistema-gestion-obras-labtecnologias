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
    const filas = await repository.listarTodos();
    const tareasPorId = new Map();

    for (const fila of filas) {
        let tarea = tareasPorId.get(fila.id_tarea);
        if (!tarea) {
            const {
                subtarea_id,
                subtarea_duracion_estimada,
                subtarea_porcentaje,
                subtarea_costo_estimado,
                subtarea_costo_real,
                subtarea_duracion_real,
                ...datosTarea
            } = fila;

            tarea = {
                ...datosTarea,
                duracion_estimada: 0,
                duracion_real: 0,
                costo_estimado: 0,
                costo_real: 0,
                porcentaje: 0,
                _cantidadSubtareas: 0,
            };
            tareasPorId.set(fila.id_tarea, tarea);
        }

        if (fila.subtarea_id !== null) {
            tarea.duracion_estimada += Number(fila.subtarea_duracion_estimada ?? 0);
            tarea.duracion_real += Number(fila.subtarea_duracion_real ?? 0);
            tarea.costo_estimado += Number(fila.subtarea_costo_estimado ?? 0);
            tarea.costo_real += Number(fila.subtarea_costo_real ?? 0);
            tarea.porcentaje += Number(fila.subtarea_porcentaje ?? 0);
            tarea._cantidadSubtareas += 1;
        }
    }

    return Array.from(tareasPorId.values(), (tarea) => {
        if (tarea._cantidadSubtareas > 0) {
            tarea.porcentaje /= tarea._cantidadSubtareas;
        }
        delete tarea._cantidadSubtareas;
        return tarea;
    });

}
export const crearTarea= async (tarea)=>{
    return repository.crearTarea(validarDatos(tarea));
}

export const obtenerTarea= async (id)=>{
    const filas = await repository.obtenerTarea(id);
    if (filas.length === 0){
        throw new Error('Tarea no encontrada');
        
    };

    const {
        subtarea_id,
        subtarea_nombre,
        subtarea_porcentaje,
        subtarea_duracion_estimada,
        subtarea_costo_estimado,
        subtarea_costo_real,
        subtarea_duracion_real,
        ...tarea
    } = filas[0];

    tarea.subtareas = [];
    let sumaDuracionEstimada = 0;
    let sumaCostoEstimado = 0;
    let sumaCostoReal = 0;
    let sumaDuracionReal = 0;
    let sumaPorcentajes = 0;

    for (const fila of filas) {
        if (fila.subtarea_id === null) continue;

        const porcentaje = Number(fila.subtarea_porcentaje ?? 0);
        tarea.subtareas.push({
            id_subtarea: fila.subtarea_id,
            nombre: fila.subtarea_nombre,
            porcentaje,
        });

        sumaDuracionEstimada += Number(fila.subtarea_duracion_estimada ?? 0);
        sumaCostoEstimado += Number(fila.subtarea_costo_estimado ?? 0);
        sumaCostoReal += Number(fila.subtarea_costo_real ?? 0);
        sumaDuracionReal += Number(fila.subtarea_duracion_real ?? 0);
        sumaPorcentajes += porcentaje;
    }

    tarea.duracion_estimada = sumaDuracionEstimada;
    tarea.costo_estimado = sumaCostoEstimado;
    tarea.costo_real = sumaCostoReal;
    tarea.duracion_real = sumaDuracionReal;
    tarea.porcentaje = tarea.subtareas.length > 0
        ? sumaPorcentajes / tarea.subtareas.length
        : 0;

    return tarea;
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
