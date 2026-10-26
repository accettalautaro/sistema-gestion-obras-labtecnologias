import * as repository from './tareas.repository.js';

export const listarTareas= async ()=>{

    const tareas = await repository.listarTodos();
    return tareas;

}
export const crearTarea= async (tarea)=>{
    return await repository.crearTarea(tarea);
}

export const obtenerTarea= async (id)=>{

    return await repository.obtenerTarea(id);
}

export const actualizarTarea= async(id,tarea)=>{
    const {id_obra,nombre,duracion_estimada,porcentaje,descripcion,duracion_real,costo_estimado,costo_real,fecha_inicio,fecha_fin}=tarea;
    return await repository.actualizarTarea(id,id_obra,nombre,duracion_estimada,porcentaje,descripcion,duracion_real,costo_estimado,costo_real,fecha_inicio,fecha_fin);
}

export const eliminarTarea= async (id)=>{

    return await repository.eliminar(id);
}
