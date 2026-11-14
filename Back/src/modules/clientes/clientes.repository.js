import {pool} from '../../config/db.js';
import { crearErrorHttp } from '../../utils/httpError.js';

const manejarError = (error, mensaje) => {
    console.error(mensaje, error);
    if (error.status) throw error;
    if (error.code === '23505') {
        throw Object.assign(new Error('Ya existe un cliente con ese DNI o email.'), { status: 409 });
    }
    if (error.code === '23503') {
        throw Object.assign(new Error('No se puede eliminar el cliente porque tiene datos asociados.'), { status: 409 });
    }
    throw crearErrorHttp(mensaje);
};

export const listarClientes = async ()=>{
    try{
        const query = 'SELECT id_cliente, nombre, apellido, dni, telefono, email, id_usuario FROM clientes ORDER BY nombre ASC, id_cliente ASC';
        const res = await pool.query(query);

        return res.rows;
    }catch(error){
        manejarError(error, 'Error al consultar los clientes en la base de datos.');
    }
}

export const obtenerCliente = async (id)=>{
    try{
        const query = 'SELECT * FROM clientes WHERE clientes.id_cliente = $1';
        const res = await pool.query(query,[id]);
        return res.rows[0] ?? null;
    }catch(error){
        manejarError(error, 'Error al consultar el cliente en la base de datos.');
    }
}

export const obtenerPorIdUsuario = async (idUsuario) => {
    try {
        const resultado = await pool.query(
            `SELECT id_cliente, nombre, apellido, dni, telefono, email, id_usuario
             FROM clientes WHERE id_usuario = $1;`,
            [idUsuario],
        );
        return resultado.rows[0] ?? null;
    } catch (error) {
        manejarError(error, 'Error al consultar el perfil del cliente en la base de datos.');
    }
};

export const crearCliente = async(cliente) => {
    try{
        const { nombre , apellido , dni , telefono , email , id_usuario } = cliente;
        const query = 'INSERT INTO clientes(nombre,apellido,dni,telefono,email,id_usuario) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *;';
        const values = [nombre,apellido, dni, telefono, email, id_usuario ?? null];
        const res = await pool.query(query,values);
        return res.rows[0] ?? null;
    }catch(error){
        manejarError(error, 'Error al crear el cliente en la base de datos.');
    }
}

export const actualizarCliente = async (id, nombre, apellido, dni, telefono, email) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const resultadoCliente = await client.query(
            `UPDATE clientes
             SET nombre = $1, apellido = $2, dni = $3, telefono = $4, email = $5
             WHERE id_cliente = $6 RETURNING *;`,
            [nombre, apellido, dni, telefono, email, id],
        );
        const cliente = resultadoCliente.rows[0];
        if (!cliente) {
            await client.query('COMMIT');
            return null;
        }
        if (cliente.id_usuario != null) {
            await client.query(
                'UPDATE usuarios SET dni = $1 WHERE id_usuario = $2;',
                [dni, cliente.id_usuario],
            );
        }
        await client.query('COMMIT');
        return cliente;
    } catch (error) {
        await client.query('ROLLBACK');
        manejarError(error, 'Error al actualizar el cliente en la base de datos.');
    } finally {
        client.release();
    }
};

export const eliminarClientes = async (id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const resultadoCliente = await client.query(
            'DELETE FROM clientes WHERE id_cliente = $1 RETURNING id_usuario;',
            [id],
        );
        if (!resultadoCliente.rowCount) {
            await client.query('COMMIT');
            return false;
        }
        const idUsuario = resultadoCliente.rows[0].id_usuario;
        if (idUsuario != null) {
            await client.query('DELETE FROM usuarios WHERE id_usuario = $1;', [idUsuario]);
        }
        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        manejarError(error, 'Error al eliminar el cliente de la base de datos.');
    } finally {
        client.release();
    }
};
