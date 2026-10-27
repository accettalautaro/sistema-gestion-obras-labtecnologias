import { pool } from '../../config/db.js';

export const listarTodos = async () => {
    try {
        const query = 'SELECT * FROM recordatorios ORDER BY fecha ASC, id_recordatorio ASC';
        const res = await pool.query(query);
        return res.rows;
    } catch (error) {
        console.error('Error al intentar obtener todos los recordatorios', error);
        throw new Error('Error al consultar los recordatorios en la base de datos');
    }
};

export const obtenerRecordatorio = async (id) => {
    try {
        const query = 'SELECT * FROM recordatorios WHERE id_recordatorio = $1';
        const res = await pool.query(query, [id]);
        return res.rows[0] ?? null;
    } catch (error) {
        console.error('Error al intentar obtener un recordatorio', error);
        throw new Error('Error al consultar un recordatorio en la base de datos');
    }
};

export const crearRecordatorio = async (recordatorio) => {
    try {
        const { id_obra, fecha, descripcion } = recordatorio;
        const query = `
            INSERT INTO recordatorios (id_obra, fecha, descripcion)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const res = await pool.query(query, [id_obra, fecha, descripcion]);
        return res.rows[0] ?? null;
    } catch (error) {
        console.error('Error al intentar crear un recordatorio', error);
        throw new Error('Error al crear un recordatorio en la base de datos');
    }
};

export const actualizarRecordatorio = async (id, id_obra, fecha, descripcion) => {
    try {
        const query = `
            UPDATE recordatorios
            SET id_obra = $1, fecha = $2, descripcion = $3
            WHERE id_recordatorio = $4
            RETURNING *
        `;
        const res = await pool.query(query, [id_obra, fecha, descripcion, id]);
        return res.rows[0] ?? null;
    } catch (error) {
        console.error('Error al intentar actualizar un recordatorio', error);
        throw new Error('Error al actualizar un recordatorio en la base de datos');
    }
};

export const eliminarRecordatorio = async (id) => {
    try {
        const query = 'DELETE FROM recordatorios WHERE id_recordatorio = $1';
        const res = await pool.query(query, [id]);
        return res.rowCount > 0;
    } catch (error) {
        console.error('Error al intentar borrar un recordatorio', error);
        throw new Error('Error al borrar un recordatorio en la base de datos');
    }
};
