import {pool} from '../../config/db.js';

export const listarTodos = async ()=>{
    try{
        const query = `
            SELECT
                t.*,
                s.id_subtarea AS subtarea_id,
                s.duracion_estimada AS subtarea_duracion_estimada,
                s.porcentaje AS subtarea_porcentaje,
                s.costo_estimado AS subtarea_costo_estimado,
                COALESCE(pagos.total, 0) AS subtarea_costo_real,
                CASE
                    WHEN s.fecha_inicio IS NOT NULL AND s.fecha_fin IS NOT NULL
                    THEN s.fecha_fin - s.fecha_inicio
                    ELSE 0
                END AS subtarea_duracion_real
            FROM tareas t
            LEFT JOIN subtareas s ON s.id_tarea = t.id_tarea
            LEFT JOIN (
                SELECT id_subtarea, SUM(monto) AS total
                FROM pagos_parciales
                GROUP BY id_subtarea
            ) pagos ON pagos.id_subtarea = s.id_subtarea
            ORDER BY t.id_tarea;
        `;
        const res= await pool.query(query);

        return res.rows;

    }catch(error){
        console.error('Error al intentar obtener todas las tareas', error);
        throw new Error('Error al consultar las tareas en la base de datos.');
    }
}

export const obtenerTarea= async (id)=> {
    try{
        const query= `
            SELECT
                t.*,
                s.id_subtarea AS subtarea_id,
                s.nombre AS subtarea_nombre,
                s.porcentaje AS subtarea_porcentaje,
                s.duracion_estimada AS subtarea_duracion_estimada,
                s.costo_estimado AS subtarea_costo_estimado,
                COALESCE(pagos.total, 0) AS subtarea_costo_real,
                CASE
                    WHEN s.fecha_inicio IS NOT NULL AND s.fecha_fin IS NOT NULL
                    THEN s.fecha_fin - s.fecha_inicio
                    ELSE 0
                END AS subtarea_duracion_real
            FROM tareas t
            LEFT JOIN subtareas s ON s.id_tarea = t.id_tarea
            LEFT JOIN (
                SELECT id_subtarea, SUM(monto) AS total
                FROM pagos_parciales
                GROUP BY id_subtarea
            ) pagos ON pagos.id_subtarea = s.id_subtarea
            WHERE t.id_tarea = $1;
        `;
        const res= await pool.query(query,[id]);
        return res.rows;
    }
    catch(error){
        console.error('Error al intentar obtener una tarea',error);
        throw new Error('Error al consultar una tarea en la base de datos');
        

    }
}

export const crearTarea= async(tarea)=>{
    try{
        const {id_obra,nombre,duracion_estimada,porcentaje,descripcion,duracion_real,costo_estimado,costo_real,fecha_inicio,fecha_fin}=tarea;
        const query= 'INSERT INTO tareas (id_obra,nombre,duracion_estimada,porcentaje,descripcion,duracion_real,costo_estimado,costo_real,fecha_inicio,fecha_fin) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *;';
        const values= [id_obra,nombre,duracion_estimada,porcentaje,descripcion,duracion_real,costo_estimado,costo_real,fecha_inicio,fecha_fin];
        const res= await pool.query(query,values);
        return res.rows;
    }catch(error){
        console.error('Error al intentar crear una tarea',error);
        throw new Error('Error al crear una tarea en la base de datos');
        
    }

}

// FALTA CAMBIAR EL SET
export const actualizarTarea= async(id,id_obra,nombre,duracion_estimada,porcentaje,descripcion,duracion_real,costo_estimado,costo_real,fecha_inicio,fecha_fin)=>{
    try{
        const query= 'UPDATE tareas SET id_obra = $1, nombre = $2, duracion_estimada=$3, porcentaje=$4, descripcion=$5, duracion_real=$6,costo_estimado=$7,costo_real=$8,fecha_inicio=$9,fecha_fin=$10 WHERE id_tarea=$11 RETURNING *';
        const values= [id_obra,nombre,duracion_estimada,porcentaje,descripcion,duracion_real,costo_estimado,costo_real,fecha_inicio,fecha_fin,id];
        const res= await pool.query(query,values);
        return res.rows[0] ?? null;
    }catch(error){
        console.error('Error al intentar actualizar una tarea',error);
        throw new Error('Error al actualizar una tarea en la base de datos');
        
    }

} 

export const eliminar= async (id)=> {
    try{
        const query= 'DELETE FROM tareas WHERE tareas.id_tarea = $1';
        const res= await pool.query(query,[id]);
        return res.rows;
    }
    catch(error){
        console.error('Error al intentar borrar una tarea',error);
        throw new Error('Error al borrar una tarea en la base de datos');
        
        
    }
}
