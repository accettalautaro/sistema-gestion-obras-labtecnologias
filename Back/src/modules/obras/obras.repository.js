import {pool} from '../../config/db.js';

const propagarErrorObra = (error, mensaje) => {
    if (error.status) throw error;
    if (error.code === '23503' && error.constraint === 'obras_id_lote_fkey') {
        throw Object.assign(new Error('El lote seleccionado no existe.'), { status: 400 });
    }
    console.error(mensaje, error);
    throw new Error(mensaje);
};

export const listarTodos = async ()=>{
    try{
        const query=`SELECT o.*, l.nro_lote,
                            c.nombre AS cliente_nombre, c.apellido AS cliente_apellido,
                            a.nombre AS arquitecto_nombre, a.apellido AS arquitecto_apellido
                     FROM obras o
                     LEFT JOIN lotes l ON l.id_lote = o.id_lote
                     LEFT JOIN clientes c ON c.id_cliente = o.id_cliente
                     LEFT JOIN arquitectos a ON a.id_arquitecto = o.id_arquitecto
                     ORDER BY o.fecha_inicio DESC, o.id_obra;`;
        const res= await pool.query(query);

        return res.rows;

    }catch(error){
        console.error('Error al intentar obtener todas las obras', error);
        throw new Error('Error al consultar las obras en la base de datos.');
    }
}

export const obtenerObra= async (id)=> {
    try{
        const query = `
            SELECT
                o.*,
                c.nombre AS cliente_nombre,
                c.apellido AS cliente_apellido,
                a.nombre AS arquitecto_nombre,
                a.apellido AS arquitecto_apellido,
                l.nro_lote
            FROM obras o
            LEFT JOIN clientes c ON c.id_cliente = o.id_cliente
            LEFT JOIN arquitectos a ON a.id_arquitecto = o.id_arquitecto
            LEFT JOIN lotes l ON l.id_lote = o.id_lote
            WHERE o.id_obra = $1;
        `;
        const res= await pool.query(query,[id]);
        return res.rows[0] ?? null;
    }
    catch(error){
        console.error('Error al intentar obtener una obra',error);
        throw new Error('Error al consultar una obra en la base de datos');
        

    }
}
export const obtenerTareas= async (id)=> {
    try{
        const query = `
        SELECT 
            o.id_obra,
            o.id_cliente,
            o.id_arquitecto,
            o.id_lote,
            a.nombre AS arquitecto_nombre,
            a.apellido AS arquitecto_apellido,
            a.dni AS arquitecto_dni,
            a.email AS arquitecto_email,
            a.telefono AS arquitecto_telefono,
            a.nro_matricula AS arquitecto_nro_matricula,
            l.nro_lote,
            o.fecha_inicio AS fecha_inicio_obra,
            o.fecha_fin AS fecha_fin_obra,
            o.estado,
            o.descripcion AS descripcion_obra,

            t.id_tarea,
            t.nombre AS nombre_tarea,
            t.duracion_estimada AS duracion_estimada_tarea,
            t.porcentaje AS porcentaje_tarea,
            t.descripcion AS descripcion_tarea,
            t.duracion_real AS duracion_real_tarea,
            t.costo_estimado AS costo_estimado_tarea,
            t.costo_real AS costo_real_tarea,
            t.fecha_inicio AS fecha_inicio_tarea,
            t.fecha_fin AS fecha_fin_tarea,

            s.id_subtarea,
            s.nombre AS nombre_subtarea,
            s.duracion_estimada AS duracion_estimada_subtarea,
            s.porcentaje AS porcentaje_subtarea,
            s.descripcion AS descripcion_subtarea,
            s.duracion_real AS duracion_real_subtarea,
            s.costo_estimado AS costo_estimado_subtarea,
            COALESCE(pagos_subtarea.total_abonado, 0) AS costo_real_subtarea,
            s.fecha_inicio AS fecha_inicio_subtarea,
            s.fecha_fin AS fecha_fin_subtarea
        FROM obras o
        LEFT JOIN arquitectos a ON a.id_arquitecto = o.id_arquitecto
        LEFT JOIN lotes l ON l.id_lote = o.id_lote
        LEFT JOIN tareas t ON o.id_obra = t.id_obra
        LEFT JOIN subtareas s ON t.id_tarea = s.id_tarea
        LEFT JOIN (
            SELECT id_subtarea, SUM(monto) AS total_abonado
            FROM pagos_parciales
            GROUP BY id_subtarea
        ) pagos_subtarea ON pagos_subtarea.id_subtarea = s.id_subtarea
        WHERE o.id_obra = $1;
    `;
        const res= await pool.query(query,[id]);
        return res.rows;
    }
    catch(error){
        console.error('Error al intentar obtener las tareas una obra',error);
        throw new Error('Error al consultar una las tareas de una obra en la base de datos');
        

    }
}

export const crearObra= async(obra)=>{
    const client = await pool.connect();
    try{
        await client.query('BEGIN');
        const {id_arquitecto,id_cliente,id_lote,fecha_inicio,fecha_fin,estado,descripcion}=obra;
        const query= 'INSERT INTO obras (id_cliente,id_arquitecto,id_lote,fecha_inicio,fecha_fin,estado,descripcion) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *;';
        const values= [id_cliente,id_arquitecto,id_lote,fecha_inicio,fecha_fin,estado,descripcion];
        const res= await client.query(query,values);
        const creada = res.rows[0];
        await client.query('COMMIT');
        return obtenerObra(creada.id_obra);
    }catch(error){
        await client.query('ROLLBACK');
        propagarErrorObra(error, 'Error al crear una obra en la base de datos');
    } finally {
        client.release();
    }

}

export const actualizarObra= async(id,id_arquitecto,id_cliente,id_lote,fecha_inicio,fecha_fin,estado,descripcion)=>{
    const client = await pool.connect();
    try{
        await client.query('BEGIN');
        const query= 'UPDATE obras SET id_arquitecto = $1, id_cliente = $2, id_lote = $3, fecha_inicio=$4, fecha_fin=$5, estado=$6, descripcion=$7 WHERE id_obra=$8 RETURNING *';
        const values= [id_arquitecto,id_cliente,id_lote,fecha_inicio,fecha_fin,estado,descripcion,id];
        const res= await client.query(query,values);
        if (!res.rows[0]) { await client.query('ROLLBACK'); return null; }
        await client.query('COMMIT');
        return obtenerObra(id);
    }catch(error){
        await client.query('ROLLBACK');
        propagarErrorObra(error, 'Error al actualizar una obra en la base de datos');
    } finally {
        client.release();
    }

}

export const eliminar= async (id)=> {
    const client = await pool.connect();
    try{
        await client.query('BEGIN');
        const query= 'DELETE FROM obras WHERE obras.id_obra = $1 RETURNING id_obra';
        const res= await client.query(query,[id]);
        await client.query('COMMIT');
        return res.rows[0] ?? null;
    }
    catch(error){
        await client.query('ROLLBACK');
        console.error('Error al intentar borrar una obra',error);
        if (error.code === '23503') {
            throw Object.assign(
                new Error('No se puede eliminar esta obra porque tiene tareas, pagos u otros datos asociados.'),
                { status: 409 },
            );
        }
        if (error.status) throw error;
        throw new Error('Error al borrar una obra en la base de datos');
    } finally {
        client.release();
    }
}
