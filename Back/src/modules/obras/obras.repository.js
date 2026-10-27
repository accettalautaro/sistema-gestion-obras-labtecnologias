import {pool} from '../../config/db.js';

export const listarTodos = async ()=>{
    try{
        const query='SELECT * FROM obras ORDER BY fecha_inicio DESC;';
        const res= await pool.query(query);

        return res.rows;

    }catch(error){
        console.error('Error al intentar obtener todas las obras', error);
        throw new Error('Error al consultar las obras en la base de datos.');
    }
}

export const obtenerObra= async (id)=> {
    try{
        const query= 'SELECT * FROM obras WHERE obras.id_obra = $1';
        const res= await pool.query(query,[id]);
        return res.rows;
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
            s.costo_real AS costo_real_subtarea,
            s.fecha_inicio AS fecha_inicio_subtarea,
            s.fecha_fin AS fecha_fin_tarea
        FROM obras o
        LEFT JOIN tareas t ON o.id_obra = t.id_obra
        LEFT JOIN subtareas s ON t.id_tarea = s.id_tarea
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
    try{
        const {id_arquitecto,id_cliente,fecha_inicio,fecha_fin,estado,descripcion}=obra;
        const query= 'INSERT INTO obras (id_cliente,id_arquitecto,fecha_inicio,fecha_fin,estado,descripcion) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *;';
        const values= [id_cliente,id_arquitecto,fecha_inicio,fecha_fin,estado,descripcion];
        const res= await pool.query(query,values);
        return res.rows;
    }catch(error){
        console.error('Error al intentar crear una obra',error);
        throw new Error('Error al crear una obra en la base de datos');
        
    }

}

export const actualizarObra= async(id,id_arquitecto,id_cliente,fecha_inicio,fecha_fin,estado,descripcion)=>{
    try{
        const query= 'UPDATE obras SET id_arquitecto = $1, id_cliente = $2, fecha_inicio=$3, fecha_fin=$4, estado=$5, descripcion=$6 WHERE id_obra=$7 RETURNING *';
        const values= [id_arquitecto,id_cliente,fecha_inicio,fecha_fin,estado,descripcion,id];
        const res= await pool.query(query,values);
        return res.rows[0] ?? null;
    }catch(error){
        console.error('Error al intentar actualizar una obra',error);
        throw new Error('Error al actualizar una obra en la base de datos');
        
    }

}

export const eliminar= async (id)=> {
    try{
        const query= 'DELETE FROM obras WHERE obras.id_obra = $1';
        const res= await pool.query(query,[id]);
        return res.rows;
    }
    catch(error){
        console.error('Error al intentar borrar una obra',error);
        throw new Error('Error al borrar una obra en la base de datos');
        
        
    }
}
