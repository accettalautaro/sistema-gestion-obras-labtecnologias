import * as repository from './subtareas.repository.js';

const errorCliente = (mensaje) => Object.assign(new Error(mensaje), { status: 400 });
const MAX_BIGINT = 9223372036854775807n;

const validarId = (id, campo = 'identificador') => {
    const texto = String(id ?? '');
    if (!/^\d{1,19}$/.test(texto) || BigInt(texto) < 1n || BigInt(texto) > MAX_BIGINT) {
        throw errorCliente(`${campo} no es válido.`);
    }
    return texto;
};

const validarDatos = (subtarea) => {
    if (!subtarea || typeof subtarea !== 'object' || Array.isArray(subtarea)) {
        throw errorCliente('Los datos de la subtarea deben ser un objeto.');
    }
    if (typeof subtarea.nombre !== 'string' || !subtarea.nombre.trim()) {
        throw errorCliente('nombre es obligatorio.');
    }
    const datos = {
        ...subtarea,
        id_tarea: validarId(subtarea.id_tarea, 'id_tarea'),
        nombre: subtarea.nombre.trim(),
    };
    for (const campo of ['duracion_estimada', 'porcentaje', 'duracion_real', 'costo_estimado', 'costo_real']) {
        const valor = subtarea[campo];
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
        const valor = subtarea[campo];
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

export const crearSubtarea= async (subtarea)=>{
    return repository.crearSubtarea(validarDatos(subtarea));
}

export const actualizarSubtarea= async(id,subtarea)=>{
    const datos = validarDatos(subtarea);
    return repository.actualizarSubtarea(validarId(id, 'id_subtarea'), datos.id_tarea, datos.nombre,
        datos.duracion_estimada, datos.porcentaje, datos.descripcion ?? null, datos.duracion_real,
        datos.costo_estimado, datos.costo_real, datos.fecha_inicio, datos.fecha_fin);
}

export const eliminarSubtarea= async (id)=>{
    return repository.eliminar(validarId(id, 'id_subtarea'));
}
export const  obtenerPagos= async (id)=> {
    // 1. Traemos los datos planos de la base de datos
    const filas = await repository.obtenerPagos(validarId(id, 'id_subtarea'));
    
    if (filas.length === 0) {

        throw Object.assign(new Error('Subtarea no encontrada.'), { status: 404 });
        
    }

    // 2. Transformamos el resultado plano a una estructura jerárquica
    const subtarea = {
        id_tarea:filas[0].id_tarea,
        id_subtarea: filas[0].id_subtarea,
        nombre_subtarea: filas[0].nombre_subtarea,
        duracion_estimada_subtarea:filas[0].duracion_estimada_subtarea,
        porcentaje_subtarea: filas[0].porcentaje_subtarea,
        descripcion_subtarea:filas[0].descripcion_subtarea,
        duracion_real_subtarea:filas[0].duracion_real_subtarea,
        costo_estimado_subtarea:filas[0].costo_estimado_subtarea,
        costo_real_subtarea:filas[0].costo_real_subtarea,
        fecha_inicio_subtarea:filas[0].fecha_inicio_subtarea,
        fecha_fin_subtarea:filas[0].fecha_fin_subtarea ,                 
        pagos: []
    };


    for (const row of filas) {

        // Si la fila tiene un pago, la asociamos a su subtarea correspondiente
        if (row.id_pago) {
            const existePago = subtarea.pagos.some(s => s.id_pago === row.id_pago);//chequeamos si el pago ya existe en el arreglos pagos de nuestra subtarea
            if (!existePago) {//si no existe 
                    subtarea.pagos.push({ //agregamos nuestro pago al arreglo
                    id_pago:row.id_pago,
                    descripcion_pago:row.descripcion_pago,
                    monto:row.monto,
                });
            }
        }
    }

    return subtarea;//retornamos la subtarea ya jerarquizada
}