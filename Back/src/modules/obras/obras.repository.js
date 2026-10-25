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

export const crearObra= async(obra)=>{
    try{
        const {id_arquitecto,id_cliente,fecha_inicio,fecha_fin,estado,descripcion}=obra;
        const query= 'INSERT INTO obras (id_cliente,id_arquitecto,fecha_inicio,fecha_fin,estado,descripcion) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *;';
        const values= [id_arquitecto,id_cliente,fecha_inicio,fecha_fin,estado,descripcion];
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
