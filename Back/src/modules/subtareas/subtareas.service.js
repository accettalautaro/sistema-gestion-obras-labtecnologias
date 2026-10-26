import * as repository from './subtareas.repository.js';

export const crearSubtarea= async (subtarea)=>{
    return await repository.crearSubtarea(subtarea);
}

export const actualizarSubtarea= async(id,subtarea)=>{
    const {id_tarea,nombre,duracion_estimada,porcentaje,descripcion,duracion_real,costo_estimado,costo_real,fecha_inicio,fecha_fin}=subtarea;
    return await repository.actualizarsubTarea(id,id_tarea,nombre,duracion_estimada,porcentaje,descripcion,duracion_real,costo_estimado,costo_real,fecha_inicio,fecha_fin);
}

export const eliminarSubtarea= async (id)=>{

    return await repository.eliminar(id);
}