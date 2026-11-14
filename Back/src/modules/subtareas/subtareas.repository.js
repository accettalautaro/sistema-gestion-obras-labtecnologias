import {pool} from '../../config/db.js';
import { crearErrorHttp } from '../../utils/httpError.js';

const manejarError = (error, mensaje) => {
    if (error.status) throw error;
    console.error(mensaje, error);
    throw crearErrorHttp(mensaje);
};

export const crearSubtarea = async ({ id_tarea, nombre, descripcion, costo_estimado, fecha_inicio_estimada, fecha_fin_estimada }) => {
    try {
        const resultado = await pool.query(
            `INSERT INTO subtareas
                (id_tarea, nombre, descripcion, costo_estimado, fecha_inicio_estimada, fecha_fin_estimada)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`,
            [id_tarea, nombre, descripcion, costo_estimado, fecha_inicio_estimada, fecha_fin_estimada],
        );
        return resultado.rows[0] ?? null;
    } catch (error) {
        manejarError(error, 'Error al crear una subtarea en la base de datos.');
    }
};

export const actualizarSubtarea = async (id, { id_tarea, nombre, descripcion, costo_estimado, fecha_inicio_estimada, fecha_fin_estimada }) => {
    try {
        const resultado = await pool.query(
            `UPDATE subtareas
             SET id_tarea = $1, nombre = $2, descripcion = $3, costo_estimado = $4,
                 fecha_inicio_estimada = $5, fecha_fin_estimada = $6
             WHERE id_subtarea = $7 RETURNING *;`,
            [id_tarea, nombre, descripcion, costo_estimado, fecha_inicio_estimada, fecha_fin_estimada, id],
        );
        return resultado.rows[0] ?? null;
    } catch (error) {
        manejarError(error, 'Error al actualizar una subtarea en la base de datos.');
    }
};

export const eliminar = async (id) => {
    try {
        const resultado = await pool.query(
            'DELETE FROM subtareas WHERE id_subtarea = $1 RETURNING id_subtarea;',
            [id],
        );
        return resultado.rowCount > 0;
    } catch (error) {
        manejarError(error, 'Error al borrar una subtarea en la base de datos.');
    }
};

export const obtenerSubtarea = async (id) => {
    try {
        const resultado = await pool.query(
            `SELECT
                s.*,
                p.id_pago,
                p.descripcion AS descripcion_pago,
                p.monto AS monto_pago
             FROM subtareas s
             LEFT JOIN pagos_parciales p ON p.id_subtarea = s.id_subtarea
             WHERE s.id_subtarea = $1
             ORDER BY p.id_pago;`,
            [id],
        );
        return resultado.rows;
    } catch (error) {
        manejarError(error, 'Error al consultar una subtarea en la base de datos.');
    }
};

export const cambiarEstado = async (id, accion) => {
    const cliente = await pool.connect();
    try {
        await cliente.query('BEGIN');
        const encontrada = await cliente.query(
            `SELECT fecha_inicio_real, fecha_fin_real
             FROM subtareas WHERE id_subtarea = $1 FOR UPDATE;`,
            [id],
        );
        if (!encontrada.rowCount) {
            await cliente.query('COMMIT');
            return null;
        }

        const actual = encontrada.rows[0];
        let resultado;
        if (accion === 'iniciar') {
            if (actual.fecha_inicio_real) {
                throw Object.assign(new Error('La subtarea ya fue iniciada.'), { status: 409 });
            }
            resultado = await cliente.query(
                `UPDATE subtareas
                 SET fecha_inicio_real = CURRENT_DATE, fecha_fin_real = NULL, porcentaje = 0
                 WHERE id_subtarea = $1 RETURNING *;`,
                [id],
            );
        } else if (accion === 'completar') {
            resultado = await cliente.query(
                `UPDATE subtareas
                 SET fecha_inicio_real = COALESCE(fecha_inicio_real, CURRENT_DATE),
                     fecha_fin_real = CURRENT_DATE, porcentaje = 100
                 WHERE id_subtarea = $1 RETURNING *;`,
                [id],
            );
        } else {
            if (!actual.fecha_fin_real) {
                throw Object.assign(new Error('Solo se puede reabrir una subtarea completada.'), { status: 409 });
            }
            resultado = await cliente.query(
                `UPDATE subtareas
                 SET fecha_fin_real = NULL, porcentaje = 0
                 WHERE id_subtarea = $1 RETURNING *;`,
                [id],
            );
        }
        await cliente.query('COMMIT');
        return resultado.rows[0] ?? null;
    } catch (error) {
        await cliente.query('ROLLBACK');
        manejarError(error, 'Error al actualizar el estado de la subtarea.');
    } finally {
        cliente.release();
    }
};
