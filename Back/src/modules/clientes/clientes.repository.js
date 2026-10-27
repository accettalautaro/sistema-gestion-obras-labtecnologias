import {pool} from '../../config/db.js';

export const listarClientes = async ()=>{
    try{
        const query = 'SELECT * FROM clientes ORDER BY nombre ASC, id_cliente ASC';
        const res = await pool.query(query);

        return res.rows;
    }catch(error){
        console.error('Error al intentar obtener todos los clientes', error);
        throw new Error('Error al consultar los clientes en la base de datos')
    }
}

export const obtenerCliente = async (id)=>{
    try{
        const query = 'SELECT * FROM clientes WHERE clientes.id_cliente = $1';
        const res = await pool.query(query,[id]);
        return res.rows[0] ?? null;
    }catch(error){
        console.error('Error al intentar obtener un cliente',error);
        throw new Error('Error al consultar un cliente en la base de datos');

    }
}

export const crearCliente = async(cliente) => {
    try{
        const { nombre , apellido , dni , telefono , email , id_usuario } = cliente;
        const query = 'INSERT INTO clientes(nombre,apellido,dni,telefono,email,id_usuario) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *;';
        const values = [nombre,apellido, dni, telefono, email, id_usuario];
        const res = await pool.query(query,values);
        return res.rows;
    }catch(error){
        console.error('Error al intentar crear un cliente',error);
        throw new Error('Error al crear un cliente en la base de datos');
    }
}

export const actualizarCliente= async(id,nombre,apellido,dni,telefono,email)=>{
    try{
        const query = 'UPDATE clientes SET nombre=$1, apellido=$2, dni=$3, telefono=$4, email=$5 WHERE id_cliente=$6 RETURNING *';
        const values = [nombre,apellido, dni, telefono, email, id];
        const res = await pool.query(query,values);
        return res.rows[0] ?? null;
    }catch(error){
        console.error('Error al intentar actualizar un cliente',error);
        throw new Error('Error al actualizar un cliente en la base de datos');
    }
}

export const eliminarClientes = async(id) =>{
    try{
        const query= 'DELETE FROM clientes WHERE clientes.id_cliente = $1';
        const res= await pool.query(query,[id]);
        return res.rowCount > 0;
    }catch(error){
        console.error('Error al intentar borrar un cliente',error);
        throw new Error('Error al borrar un cliente en la base de datos');
    }
}



