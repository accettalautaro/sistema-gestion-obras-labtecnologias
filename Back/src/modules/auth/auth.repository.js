import { pool } from '../../config/db.js';

export const crearUsuario= async (dni,rol,hash)=>{
    try{
            const query= 'INSERT INTO usuarios (dni,rol,nombre) VALUES ($1,$2,$3) RETURNING *;';
            const values= [dni,rol,hash];
            const res= await pool.query(query,values);
            return res.rows;
        }catch(error){
            console.error('Error al intentar crear una usuario',error);
            throw new Error('Error al crear una usuario en la base de datos');
            
        }
    

}
export const obtenerUsuario = async (dni)=>{

        try{
            const query= 'SELECT * FROM usuarios WHERE usuarios.dni LIKE $1';
            const res= await pool.query(query,[dni]);
            return res.rows;
        }
        catch(error){
            console.error('Error al intentar obtener un usuario',error);
            throw new Error('Error al consultar un usuario en la base de datos');
            
    
        }
}
    
