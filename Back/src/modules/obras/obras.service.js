import * as repository from './obras.repository.js';

const errorValidacion = (mensaje) => Object.assign(new Error(mensaje), { status: 400 });

const validarFecha = (fecha, campo) => {
    if (fecha === null || fecha === undefined || fecha === '') {
        throw errorValidacion(`${campo} es obligatoria.`);
    }
    if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        throw errorValidacion(`${campo} debe tener el formato YYYY-MM-DD.`);
    }
    const fechaUtc = new Date(`${fecha}T00:00:00Z`);
    if (Number.isNaN(fechaUtc.getTime()) || fechaUtc.toISOString().slice(0, 10) !== fecha) {
        throw errorValidacion(`${campo} no es una fecha válida.`);
    }
    return fecha;
};

const validarDatosObra = (obra) => {
    if (!obra || typeof obra !== 'object' || Array.isArray(obra)) {
        throw errorValidacion('Los datos de la obra son obligatorios.');
    }
    if (!/^\d{1,19}$/.test(String(obra.id_lote ?? ''))
        || BigInt(obra.id_lote) <= 0n
        || BigInt(obra.id_lote) > 9223372036854775807n) {
        throw errorValidacion('Seleccioná un lote para la obra. Si todavía no existe, primero tenés que crear el lote.');
    }
    const fecha_inicio = validarFecha(obra.fecha_inicio, 'La fecha de inicio');
    const fecha_fin = validarFecha(obra.fecha_fin, 'La fecha de finalización');
    if (fecha_fin < fecha_inicio) {
        throw errorValidacion('La fecha de finalización no puede ser anterior a la fecha de inicio.');
    }
    return { ...obra, fecha_inicio, fecha_fin };
};

export const listarObras= async (req)=>{

    const{id_cliente,estado,id_lote,id_arquitecto}= req.query;
    const obras = await repository.listarTodos();
    if(id_cliente) {
        return obras.filter(o=> String(o.id_cliente) === String(id_cliente));
    }
    if(estado) {
        return obras.filter(o=> o.estado=== estado);
    }
    //if(id_lote){
    //    return obras.filter(o=> o.id_lote=== id_lote);      
    //}
    if(id_arquitecto){
        return obras.filter(o=> String(o.id_arquitecto) === String(id_arquitecto));

    }
    return obras;

}
export const crearObra= async (obra)=>{
    return await repository.crearObra(validarDatosObra(obra));
}

export const obtenerObra= async (id)=>{
    return await repository.obtenerObra(id);
}

export const actualizarObra= async(id,obra)=>{
    const {id_arquitecto,id_cliente,id_lote,fecha_inicio,fecha_fin,estado,descripcion}=validarDatosObra(obra);
    return await repository.actualizarObra(id,id_arquitecto,id_cliente,id_lote,fecha_inicio,fecha_fin,estado,descripcion);
}

export const eliminarObra= async (id)=>{

    return await repository.eliminar(id);
}
export const  obtenerTareas= async (id)=> {
    // 1. Traemos los datos planos de la base de datos
    const filas = await repository.obtenerTareas(id);
    
    if (filas.length === 0) return null;

    // 2. Transformamos el resultado plano a una estructura jerárquica
    const obra = {
        id_obra: filas[0].id_obra,
        id_cliente:filas[0].id_cliente,
        id_arquitecto:filas[0].id_arquitecto,
        fecha_inicio_obra:filas[0].fecha_inicio_obra,
        fecha_fin_obra:filas[0].fecha_fin_obra,
        estado:filas[0].estado,
        arquitecto: filas[0].id_arquitecto ? {
            id_arquitecto: filas[0].id_arquitecto,
            nombre: filas[0].arquitecto_nombre,
            apellido: filas[0].arquitecto_apellido,
            dni: filas[0].arquitecto_dni,
            email: filas[0].arquitecto_email,
            telefono: filas[0].arquitecto_telefono,
            nro_matricula: filas[0].arquitecto_nro_matricula,
        } : null,
        lote: filas[0].id_lote ? {
            id_lote: filas[0].id_lote,
            nro_lote: filas[0].nro_lote,
        } : null,
        costo_estimado:0,
        total_abonado:0,
        porcentaje:0,
        descripcion_obra:filas[0].descripcion_obra,
        tareas: []
    };

    const mapaTareas = new Map();//estructura auxiliar para registrar las tareas que vamos agregando

    for (const row of filas) {
        // Si la tarea existe y aún no la agregamos al mapa
        if (row.id_tarea && !mapaTareas.has(row.id_tarea)) {
            
            const tarea = {
                id_tarea: row.id_tarea,
                nombre_tarea: row.nombre_tarea,
                duracion_estimada_tarea:row.duracion_estimada_tarea,
                porcentaje_tarea: 0,
                descripcion_tarea:row.descripcion_tarea,
                duracion_real_tarea:row.duracion_real_tarea,
                costo_estimado_tarea:Number(row.costo_estimado_tarea ?? 0),
                costo_real_tarea:0,
                fecha_inicio_tarea:row.fecha_inicio_tarea,
                fecha_fin_tarea:row.fecha_fin_tarea ,
                subtareas: []
            };
            mapaTareas.set(row.id_tarea, tarea);//registramos la tarea en nuestra estructura auxiliar
            obra.tareas.push(tarea);//agregamos la tarea a la obra
        }

        // Si la fila tiene subtarea, la asociamos a su tarea correspondiente
        if (row.id_subtarea) {
            const tareaActual = mapaTareas.get(row.id_tarea);//tomamos la tarea de la fila
            
            const existeSubtarea = tareaActual.subtareas.some(s => s.id_subtarea === row.id_subtarea);//chequeamos si la subtarea ya existe en el arreglo subtareas de nuestra tarea
            if (!existeSubtarea) {//si no existe 
                const costoRealSubtarea = Number(row.costo_real_subtarea ?? 0);
                
                tareaActual.subtareas.push({ //agregamos nuestra subtarea al arreglo
                    id_subtarea: row.id_subtarea,
                    nombre_subtarea: row.nombre_subtarea,
                    duracion_estimada_subtarea:row.duracion_estimada_subtarea,
                    porcentaje_subtarea:Number( row.porcentaje_subtarea),
                    descripcion_subtarea:row.descripcion_subtarea,
                    duracion_real_subtarea:row.duracion_real_subtarea,
                    costo_estimado_subtarea:row.costo_estimado_subtarea,
                    costo_real_subtarea:costoRealSubtarea,
                    fecha_inicio_subtarea:row.fecha_inicio_subtarea,
                    fecha_fin_subtarea:row.fecha_fin_subtarea ,
                });
                tareaActual.costo_real_tarea+=costoRealSubtarea;
                tareaActual.porcentaje_tarea+=Number(row.porcentaje_subtarea);
            }
        }
    }
    for (const tarea of obra.tareas){
        obra.costo_estimado += tarea.costo_estimado_tarea;
        obra.total_abonado += tarea.costo_real_tarea;
        if(tarea.subtareas.length>0){
            tarea.porcentaje_tarea=tarea.porcentaje_tarea/tarea.subtareas.length;
        }
    }
    if (obra.tareas.length > 0) {
    obra.porcentaje =
        obra.tareas.reduce((suma, tarea) => suma + tarea.porcentaje_tarea, 0) /
        obra.tareas.length;
}
    
    return obra;//retornamos la obra ya jerarquizada
}
