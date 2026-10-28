import {pool} from '../../config/db.js';


export const crearSubtarea= async(subtarea)=>{
    try{
        const {id_tarea,nombre,duracion_estimada,porcentaje,descripcion,duracion_real,costo_estimado,costo_real,fecha_inicio,fecha_fin}=subtarea;
        const query= 'INSERT INTO subtareas (id_tarea,nombre,duracion_estimada,porcentaje,descripcion,duracion_real,costo_estimado,costo_real,fecha_inicio,fecha_fin) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *;';
        const values= [id_tarea,nombre,duracion_estimada,porcentaje,descripcion,duracion_real,costo_estimado,costo_real,fecha_inicio,fecha_fin];
        const res= await pool.query(query,values);
        return res.rows[0] ?? null;
    }catch(error){
        console.error('Error al intentar crear una subtarea',error);
        throw new Error('Error al crear una subtarea en la base de datos');
        
    }

}

// FALTA CAMBIAR EL SET
export const actualizarSubtarea= async(id,id_tarea,nombre,duracion_estimada,porcentaje,descripcion,duracion_real,costo_estimado,costo_real,fecha_inicio,fecha_fin)=>{
    try{
        const query= 'UPDATE subtareas SET id_tarea = $1, nombre = $2, duracion_estimada=$3, porcentaje=$4, descripcion=$5, duracion_real=$6,costo_estimado=$7,costo_real=$8,fecha_inicio=$9,fecha_fin=$10 WHERE id_subtarea=$11 RETURNING *';
        const values= [id_tarea,nombre,duracion_estimada,porcentaje,descripcion,duracion_real,costo_estimado,costo_real,fecha_inicio,fecha_fin,id];
        const res= await pool.query(query,values);
        return res.rows[0] ?? null;
    }catch(error){
        console.error('Error al intentar actualizar una subtarea',error);
        throw new Error('Error al actualizar una subtarea en la base de datos');
        
    }

} 

export const eliminar= async (id)=> {
    try{
        const query= 'DELETE FROM subtareas WHERE subtareas.id_subtarea = $1 RETURNING id_subtarea';
        const res= await pool.query(query,[id]);
        return res.rowCount > 0;
    }
    catch(error){
        console.error('Error al intentar borrar una subtarea',error);
        throw new Error('Error al borrar una subtarea en la base de datos');
        
        
    }
}

export const obtenerPagos= async (id)=> {
    try{
        const query = `
        SELECT 
            s.id_tarea,
            s.id_subtarea,
            s.nombre AS nombre_subtarea,
            s.duracion_estimada AS duracion_estimada_subtarea,
            s.porcentaje AS porcentaje_subtarea,
            s.descripcion AS descripcion_subtarea,
            s.duracion_real AS duracion_real_subtarea,
            s.costo_estimado AS costo_estimado_subtarea,
            s.costo_real AS costo_real_subtarea,
            s.fecha_inicio AS fecha_inicio_subtarea,
            s.fecha_fin AS fecha_fin_subtarea,
            p.id_pago,
            p.descripcion AS descripcion_pago,
            p.monto
        FROM subtareas s
        LEFT JOIN pagos_parciales p ON s.id_subtarea = p.id_subtarea
        WHERE s.id_subtarea=$1;
    `;
        const res= await pool.query(query,[id]);
        return res.rows;
    }
    catch(error){
        console.error('Error al intentar obtener los pagos parciales de una subtarea',error);
        throw new Error('Error al consultar una los pagos parciales de una subtarea en la base de datos');
        

    }
}