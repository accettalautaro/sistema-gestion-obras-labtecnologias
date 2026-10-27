import * as repository from './subtareas.repository.js';

export const crearSubtarea= async (subtarea)=>{
    return await repository.crearSubtarea(subtarea);
}

export const actualizarSubtarea= async(id,subtarea)=>{
    const {id_tarea,nombre,duracion_estimada,porcentaje,descripcion,duracion_real,costo_estimado,costo_real,fecha_inicio,fecha_fin}=subtarea;
    return await repository.actualizarSubtarea(id,id_tarea,nombre,duracion_estimada,porcentaje,descripcion,duracion_real,costo_estimado,costo_real,fecha_inicio,fecha_fin);
}

export const eliminarSubtarea= async (id)=>{

    return await repository.eliminar(id);
}
export const  obtenerPagos= async (id)=> {
    // 1. Traemos los datos planos de la base de datos
    const filas = await repository.obtenerPagos(id);
    
    if (filas.length === 0) {

        throw new Error('Subtarea no encontrada');
        
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