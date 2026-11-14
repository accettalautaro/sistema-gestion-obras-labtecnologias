import { pool } from '../../config/db.js';

export const obtenerUsuario = async (dni) => {
    try {
        const query = 'SELECT * FROM usuarios WHERE usuarios.dni = $1';
        const res = await pool.query(query, [dni]);
        return res.rows;
    } catch (error) {
        console.error('Error al intentar obtener un usuario', error);
        throw new Error('Error al consultar un usuario en la base de datos');
    }
};

export const obtenerPerfilUsuario = async (idUsuario) => {
    try {
        const query = `
            SELECT
                u.id_usuario,
                u.dni,
                u.rol,
                CASE WHEN u.rol = 'arquitecto' THEN a.nombre ELSE c.nombre END AS nombre,
                CASE WHEN u.rol = 'arquitecto' THEN a.apellido ELSE c.apellido END AS apellido
            FROM usuarios u
            LEFT JOIN arquitectos a ON a.id_usuario = u.id_usuario
            LEFT JOIN clientes c ON c.id_usuario = u.id_usuario
            WHERE u.id_usuario = $1;
        `;
        const resultado = await pool.query(query, [idUsuario]);
        return resultado.rows[0] ?? null;
    } catch (error) {
        console.error('Error al consultar el perfil del usuario', error);
        throw new Error('Error al consultar el perfil del usuario en la base de datos.');
    }
};

export const crearUsuarioCliente = async (idCliente, hash) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const resultadoCliente = await client.query(
            'SELECT id_cliente, dni, id_usuario FROM clientes WHERE id_cliente = $1 FOR UPDATE;',
            [idCliente],
        );
        const cliente = resultadoCliente.rows[0];
        if (!cliente) {
            throw Object.assign(new Error('Cliente no encontrado.'), { status: 404 });
        }
        if (cliente.id_usuario != null) {
            throw Object.assign(new Error('El cliente ya tiene un usuario asociado.'), { status: 409 });
        }

        const usuario = await client.query(
            `INSERT INTO usuarios (dni, rol, nombre)
             VALUES ($1, 'cliente', $2) RETURNING id_usuario;`,
            [cliente.dni, hash],
        );
        const actualizado = await client.query(
            `UPDATE clientes SET id_usuario = $1
             WHERE id_cliente = $2 RETURNING *;`,
            [usuario.rows[0].id_usuario, idCliente],
        );
        await client.query('COMMIT');
        return actualizado.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.status) throw error;
        if (error.code === '23505') {
            throw Object.assign(new Error('Ya existe una cuenta con el DNI de este cliente.'), { status: 409 });
        }
        console.error('Error al crear la cuenta del cliente', error);
        throw new Error('Error al crear la cuenta del cliente en la base de datos.');
    } finally {
        client.release();
    }
};
