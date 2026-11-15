import * as repository from './obras.repository.js';

function fechaISO(valor) {
    if (!valor) return null;
    const fecha = valor instanceof Date ? valor.toISOString().slice(0, 10) : String(valor).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return null;
    const valida = new Date(`${fecha}T00:00:00Z`);
    return Number.isNaN(valida.getTime()) || valida.toISOString().slice(0, 10) !== fecha ? null : fecha;
}

function menorFecha(fechas) {
    return fechas.map(fechaISO).filter(Boolean).sort()[0] ?? null;
}

function mayorFecha(fechas) {
    return fechas.map(fechaISO).filter(Boolean).sort().at(-1) ?? null;
}

export function duracionInclusiva(inicio, fin) {
    const fechaInicio = fechaISO(inicio);
    const fechaFin = fechaISO(fin);
    if (!fechaInicio || !fechaFin || fechaFin < fechaInicio) return null;
    const inicioUTC = Date.parse(`${fechaInicio}T00:00:00Z`);
    const finUTC = Date.parse(`${fechaFin}T00:00:00Z`);
    return Math.floor((finUTC - inicioUTC) / 86400000) + 1;
}

function sumaDuraciones(items) {
    if (!items.length) return 0;
    if (items.some((item) => item.duracion_estimada == null)) return null;
    return items.reduce((total, item) => total + Number(item.duracion_estimada), 0);
}

function suma(items, campo) {
    return items.reduce((total, item) => total + (Number(item[campo]) || 0), 0);
}

export function derivarSubtarea(subtarea) {
    const fecha_inicio_estimada = fechaISO(subtarea.fecha_inicio_estimada);
    const fecha_fin_estimada = fechaISO(subtarea.fecha_fin_estimada);
    const fecha_inicio_real = fechaISO(subtarea.fecha_inicio_real);
    const fecha_fin_real = fechaISO(subtarea.fecha_fin_real);
    return {
        ...subtarea,
        porcentaje: Number(subtarea.porcentaje) || 0,
        fecha_inicio_estimada,
        fecha_fin_estimada,
        fecha_inicio_real,
        fecha_fin_real,
        duracion_estimada: duracionInclusiva(fecha_inicio_estimada, fecha_fin_estimada),
        duracion_real: duracionInclusiva(fecha_inicio_real, fecha_fin_real),
        costo_estimado: Number(subtarea.costo_estimado) || 0,
        costo_real: Number(subtarea.costo_real) || 0,
    };
}

export function derivarTarea(subtareas) {
    const unidades = subtareas.map(derivarSubtarea);
    const porcentaje = unidades.length
        ? Math.floor(suma(unidades, 'porcentaje') / unidades.length)
        : 0;
    const completa = unidades.length > 0
        && unidades.every((unidad) => unidad.porcentaje >= 100 && unidad.fecha_fin_real);
    const fecha_inicio_real = menorFecha(unidades.map((unidad) => unidad.fecha_inicio_real));
    const fecha_fin_real = completa
        ? mayorFecha(unidades.map((unidad) => unidad.fecha_fin_real))
        : null;

    return {
        porcentaje,
        duracion_estimada: sumaDuraciones(unidades),
        duracion_real: completa ? duracionInclusiva(fecha_inicio_real, fecha_fin_real) : null,
        costo_estimado: suma(unidades, 'costo_estimado'),
        costo_real: suma(unidades, 'costo_real'),
        fecha_inicio_real,
        fecha_fin_real,
        subtareas: unidades,
    };
}

export function derivarObra(tareas, pausada = false) {
    const porcentaje = tareas.length
        ? Math.floor(suma(tareas, 'porcentaje') / tareas.length)
        : 0;
    const completa = tareas.length > 0 && tareas.every((tarea) => (
        tarea.subtareas.length > 0
        && tarea.porcentaje >= 100
        && tarea.fecha_fin_real
    ));
    const fecha_inicio_real = menorFecha(tareas.map((tarea) => tarea.fecha_inicio_real));
    const fecha_fin_real = completa
        ? mayorFecha(tareas.map((tarea) => tarea.fecha_fin_real))
        : null;
    const estado = pausada
        ? 'Pausada'
        : !fecha_inicio_real
            ? 'No Inicio'
            : completa
                ? 'Finalizada'
                : 'En ejecución';

    return {
        porcentaje,
        costo_estimado: suma(tareas, 'costo_estimado'),
        costo_real: suma(tareas, 'costo_real'),
        duracion_estimada: sumaDuraciones(tareas),
        duracion_real: completa ? duracionInclusiva(fecha_inicio_real, fecha_fin_real) : null,
        fecha_inicio_real,
        fecha_fin_real,
        estado,
    };
}

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
    const nombre = typeof obra.nombre === 'string' ? obra.nombre.trim() : '';
    if (!nombre) {
        throw errorValidacion('El nombre de la obra es obligatorio.');
    }
    if (nombre.length > 150) {
        throw errorValidacion('El nombre de la obra no puede superar los 150 caracteres.');
    }
    if (!/^\d{1,19}$/.test(String(obra.id_lote ?? ''))
        || BigInt(obra.id_lote) <= 0n
        || BigInt(obra.id_lote) > 9223372036854775807n) {
        throw errorValidacion('Seleccioná un lote para la obra. Si todavía no existe, primero tenés que crear el lote.');
    }
    const fecha_inicio_estimada = validarFecha(obra.fecha_inicio_estimada, 'La fecha de inicio estimada');
    const fecha_fin_estimada = validarFecha(obra.fecha_fin_estimada, 'La fecha de finalización estimada');
    if (fecha_fin_estimada < fecha_inicio_estimada) {
        throw errorValidacion('La fecha de finalización no puede ser anterior a la fecha de inicio.');
    }
    return { ...obra, nombre, fecha_inicio_estimada, fecha_fin_estimada };
};

export const listarObras= async (req)=>{

    const{id_cliente,estado,id_lote,id_arquitecto}= req.query;
    const parametrosPermitidos = new Set(['id_cliente', 'estado', 'id_lote', 'id_arquitecto']);
    if (Object.keys(req.query).some((parametro) => !parametrosPermitidos.has(parametro))) {
        throw errorValidacion('El filtro de obras indicado no es válido.');
    }
    for (const [nombre, valor] of Object.entries({ id_cliente, id_lote, id_arquitecto })) {
        if (valor !== undefined && (!/^\d{1,19}$/.test(valor)
            || BigInt(valor) < 1n || BigInt(valor) > 9223372036854775807n)) {
            throw errorValidacion(`${nombre} debe ser un identificador válido.`);
        }
    }
    const obras = await Promise.all((await repository.listarTodos()).map(async (obra) => {
        const resumen = await obtenerTareas(obra.id_obra);
        return { ...obra, estado: resumen?.estado ?? obra.estado };
    }));
    if(id_cliente) {
        return obras.filter(o=> String(o.id_cliente) === String(id_cliente));
    }
    if(estado) {
        return obras.filter(o=> o.estado=== estado);
    }
    if(id_lote) {
        return obras.filter(o => String(o.id_lote) === String(id_lote));
    }
    if(id_arquitecto){
        return obras.filter(o=> String(o.id_arquitecto) === String(id_arquitecto));

    }
    return obras;

}
export const crearObra= async (obra)=>{
    const creada = await repository.crearObra(validarDatosObra(obra));
    return creada ? { ...creada, estado: creada.estado } : null;
}

export const obtenerObra= async (id)=>{
    const obra = await repository.obtenerObra(id);
    if (!obra) return null;
    const resumen = await obtenerTareas(id);
    return { ...obra, estado: resumen?.estado ?? obra.estado };
}

export const actualizarObra= async(id,obra)=>{
    const {nombre,id_arquitecto,id_cliente,id_lote,fecha_inicio_estimada,fecha_fin_estimada,descripcion}=validarDatosObra(obra);
    const actualizada = await repository.actualizarObra(id,nombre,id_arquitecto,id_cliente,id_lote,fecha_inicio_estimada,fecha_fin_estimada,descripcion);
    if (!actualizada) return null;
    const resumen = await obtenerTareas(id);
    return { ...actualizada, estado: resumen?.estado ?? actualizada.estado };
}

export const eliminarObra= async (id)=>{

    return await repository.eliminar(id);
}
export const  obtenerTareas= async (id)=> {
    const filas = await repository.obtenerTareas(id);
    if (filas.length === 0) return null;

    const filaObra = filas[0];
    const mapaTareas = new Map();
    for (const fila of filas) {
        if (fila.id_tarea == null) continue;
        if (!mapaTareas.has(fila.id_tarea)) {
            mapaTareas.set(fila.id_tarea, {
                id_tarea: fila.id_tarea,
                nombre_tarea: fila.nombre_tarea,
                descripcion_tarea: fila.descripcion_tarea,
                fecha_inicio_tarea: fila.fecha_inicio_tarea,
                fecha_fin_tarea: fila.fecha_fin_tarea,
                subtareas: [],
            });
        }
        if (fila.id_subtarea != null) {
            let subtarea = mapaTareas.get(fila.id_tarea).subtareas.find((item) => item.id_subtarea === fila.id_subtarea);
            if (!subtarea) {
                subtarea = {
                id_subtarea: fila.id_subtarea,
                nombre_subtarea: fila.nombre_subtarea,
                porcentaje: Number(fila.porcentaje_subtarea) || 0,
                descripcion_subtarea: fila.descripcion_subtarea,
                costo_estimado: fila.costo_estimado_subtarea,
                costo_real: 0,
                fecha_inicio_estimada: fila.fecha_inicio_subtarea,
                fecha_fin_estimada: fila.fecha_fin_subtarea,
                fecha_inicio_real: fila.fecha_inicio_real_subtarea,
                fecha_fin_real: fila.fecha_fin_real_subtarea,
                };
                mapaTareas.get(fila.id_tarea).subtareas.push(subtarea);
            }
            subtarea.costo_real += Number(fila.monto_pago_subtarea) || 0;
        }
    }

    const tareas = Array.from(mapaTareas.values(), (tarea) => {
        const derivada = derivarTarea(tarea.subtareas);
        const subtareas = derivada.subtareas.map((subtarea) => ({
            id_subtarea: subtarea.id_subtarea,
            nombre_subtarea: subtarea.nombre_subtarea,
            porcentaje_subtarea: subtarea.porcentaje,
            descripcion_subtarea: subtarea.descripcion_subtarea,
            duracion_estimada_subtarea: subtarea.duracion_estimada,
            duracion_real_subtarea: subtarea.duracion_real,
            costo_estimado_subtarea: subtarea.costo_estimado,
            costo_real_subtarea: subtarea.costo_real,
            fecha_inicio_subtarea: subtarea.fecha_inicio_estimada,
            fecha_fin_subtarea: subtarea.fecha_fin_estimada,
            fecha_inicio_real_subtarea: subtarea.fecha_inicio_real,
            fecha_fin_real_subtarea: subtarea.fecha_fin_real,
        }));
        return {
            id_tarea: tarea.id_tarea,
            nombre_tarea: tarea.nombre_tarea,
            descripcion_tarea: tarea.descripcion_tarea,
            fecha_inicio_tarea: tarea.fecha_inicio_tarea,
            fecha_fin_tarea: tarea.fecha_fin_tarea,
            porcentaje_tarea: derivada.porcentaje,
            duracion_estimada_tarea: derivada.duracion_estimada,
            duracion_real_tarea: derivada.duracion_real,
            costo_estimado_tarea: derivada.costo_estimado,
            costo_real_tarea: derivada.costo_real,
            fecha_inicio_real_tarea: derivada.fecha_inicio_real,
            fecha_fin_real_tarea: derivada.fecha_fin_real,
            porcentaje: derivada.porcentaje,
            duracion_estimada: derivada.duracion_estimada,
            duracion_real: derivada.duracion_real,
            costo_estimado: derivada.costo_estimado,
            costo_real: derivada.costo_real,
            fecha_inicio_real: derivada.fecha_inicio_real,
            fecha_fin_real: derivada.fecha_fin_real,
            subtareas,
        };
    });
    const pausada = ['pausa', 'pausada', 'suspendida', 'suspendido'].includes(
        String(filaObra.estado ?? '').trim().toLowerCase(),
    );
    const metricas = derivarObra(tareas.map((tarea) => ({
        ...tarea,
        fecha_inicio_real: tarea.fecha_inicio_real_tarea,
        fecha_fin_real: tarea.fecha_fin_real_tarea,
    })), pausada);

    return {
        id_obra: filas[0].id_obra,
        id_cliente: filaObra.id_cliente,
        id_arquitecto: filaObra.id_arquitecto,
        id_lote: filaObra.id_lote,
        fecha_inicio_obra: filaObra.fecha_inicio_obra,
        fecha_fin_obra: filaObra.fecha_fin_obra,
        fecha_inicio_real_obra: metricas.fecha_inicio_real,
        fecha_fin_real_obra: metricas.fecha_fin_real,
        duracion_estimada_obra: metricas.duracion_estimada,
        duracion_real_obra: metricas.duracion_real,
        estado: metricas.estado,
        arquitecto: filaObra.id_arquitecto ? {
            id_arquitecto: filaObra.id_arquitecto,
            nombre: filaObra.arquitecto_nombre,
            apellido: filaObra.arquitecto_apellido,
            dni: filaObra.arquitecto_dni,
            email: filaObra.arquitecto_email,
            telefono: filaObra.arquitecto_telefono,
            nro_matricula: filaObra.arquitecto_nro_matricula,
        } : null,
        lote: filaObra.id_lote ? {
            id_lote: filaObra.id_lote,
            nro_lote: filaObra.nro_lote,
        } : null,
        costo_estimado: metricas.costo_estimado,
        total_abonado: metricas.costo_real,
        porcentaje: metricas.porcentaje,
        descripcion_obra: filaObra.descripcion_obra,
        tareas,
    };
}

export const actualizarEstadoSeguimiento = async (id, accion) => {
    if (!['pausar', 'reanudar'].includes(accion)) {
        throw errorValidacion('La acción debe ser pausar o reanudar.');
    }
    const existente = await repository.obtenerObra(id);
    if (!existente) return null;
    if (accion === 'pausar') return repository.actualizarEstado(id, 'Pausada');
    const resumen = await obtenerTareas(id);
    return repository.actualizarEstado(id, derivarObra(resumen.tareas, false).estado);
};
