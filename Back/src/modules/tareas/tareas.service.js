import * as repository from './tareas.repository.js';

export const listarTareas= async ()=>{

    const tareas = await repository.listarTodos();
    return tareas;

}
export const crearTarea= async (tarea)=>{
    return await repository.crearTarea(tarea);
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
    const {id_obra,nombre,duracion_estimada,porcentaje,descripcion,duracion_real,costo_estimado,costo_real,fecha_inicio,fecha_fin}=tarea;
    return await repository.actualizarTarea(id,id_obra,nombre,duracion_estimada,porcentaje,descripcion,duracion_real,costo_estimado,costo_real,fecha_inicio,fecha_fin);
}

export const eliminarTarea= async (id)=>{

    return await repository.eliminar(id);
}
