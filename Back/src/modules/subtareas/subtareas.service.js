import * as repository from './subtareas.repository.js';

export const crearSubtarea= async (subtarea)=>{
    return await repository.crearSubtarea(subtarea);
}

export const obtenerSubtarea = async (id)=>{
    const filas = await repository.obtenerSubtarea(id);
    if (filas.length === 0){
        throw new Error('subtarea no encontrada');
        
    };

    const primeraFila = filas[0];
    const { id_pago, descripcion_pago, monto_pago, ...subtarea } = primeraFila;
    subtarea.pagos = [];
    subtarea.costo_real = 0;

    for (const fila of filas) {
        if (fila.id_pago !== null) {
            const monto = Number(fila.monto_pago ?? 0);
            subtarea.pagos.push({
                id_pago: fila.id_pago,
                descripcion: fila.descripcion_pago,
                monto,
            });
            subtarea.costo_real += monto;
        }
    }

    subtarea.duracion_real = Number(filas[0].duracion_real ?? 0);

    return subtarea;
}

export const actualizarSubtarea= async(id,subtarea)=>{
    const {id_tarea,nombre,duracion_estimada,porcentaje,descripcion,duracion_real,costo_estimado,costo_real,fecha_inicio,fecha_fin}=subtarea;
    return await repository.actualizarSubtarea(id,id_tarea,nombre,duracion_estimada,porcentaje,descripcion,duracion_real,costo_estimado,costo_real,fecha_inicio,fecha_fin);
}

export const eliminarSubtarea= async (id)=>{

    return await repository.eliminar(id);
}
