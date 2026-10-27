import { pool } from '../../config/db.js';

const SELECT_PAGOS = `
    SELECT p.id_pago, p.id_subtarea, p.descripcion, p.monto,
           s.id_tarea, t.id_obra
    FROM pagos_parciales p
    JOIN subtareas s ON s.id_subtarea = p.id_subtarea
    JOIN tareas t ON t.id_tarea = s.id_tarea
`;

const manejarError = (error, mensaje) => {
    console.error(mensaje, error);
    if (error.status) throw error;
    if (['23503', '23514'].includes(error.code)) {
        error.status = 400;
        error.message = 'La subtarea indicada no existe o los datos no cumplen las restricciones.';
        throw error;
    }
    throw new Error(mensaje);
};

export const listarTodos = async () => {
    try {
        const resultado = await pool.query(`${SELECT_PAGOS} ORDER BY p.id_pago;`);
        return resultado.rows;
    } catch (error) {
        manejarError(error, 'Error al consultar los pagos.');
    }
};

export const obtenerPorId = async (id) => {
    try {
        const resultado = await pool.query(`${SELECT_PAGOS} WHERE p.id_pago = $1;`, [id]);
        return resultado.rows[0] ?? null;
    } catch (error) {
        manejarError(error, 'Error al consultar el pago.');
    }
};

export const crear = async ({ id_subtarea, descripcion, monto }) => {
    try {
        const resultado = await pool.query(
            `INSERT INTO pagos_parciales (id_subtarea, descripcion, monto)
             VALUES ($1, $2, $3) RETURNING *;`,
            [id_subtarea, descripcion ?? null, monto],
        );
        return await obtenerPorId(resultado.rows[0].id_pago);
    } catch (error) {
        manejarError(error, 'Error al crear el pago.');
    }
};

export const actualizar = async (id, { id_subtarea, descripcion, monto }) => {
    try {
        const resultado = await pool.query(
            `UPDATE pagos_parciales
             SET id_subtarea = $1, descripcion = $2, monto = $3
             WHERE id_pago = $4 RETURNING *;`,
            [id_subtarea, descripcion ?? null, monto, id],
        );
        return resultado.rowCount ? await obtenerPorId(id) : null;
    } catch (error) {
        manejarError(error, 'Error al actualizar el pago.');
    }
};

export const eliminar = async (id) => {
    try {
        const resultado = await pool.query(
            'DELETE FROM pagos_parciales WHERE id_pago = $1 RETURNING id_pago;',
            [id],
        );
        return resultado.rowCount > 0;
    } catch (error) {
        manejarError(error, 'Error al eliminar el pago.');
    }
};