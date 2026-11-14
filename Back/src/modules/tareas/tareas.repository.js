import {pool} from '../../config/db.js';
import { crearErrorHttp } from '../../utils/httpError.js';

const CONSULTA_TAREAS = `
    SELECT
        t.*,
        s.id_subtarea AS subtarea_id,
        s.nombre AS subtarea_nombre,
        s.descripcion AS subtarea_descripcion,
        s.porcentaje AS subtarea_porcentaje,
        s.costo_estimado AS subtarea_costo_estimado,
        s.fecha_inicio_estimada AS subtarea_fecha_inicio_estimada,
        s.fecha_fin_estimada AS subtarea_fecha_fin_estimada,
        s.fecha_inicio_real AS subtarea_fecha_inicio_real,
        s.fecha_fin_real AS subtarea_fecha_fin_real,
        p.monto AS subtarea_monto_pago
    FROM tareas t
    LEFT JOIN subtareas s ON s.id_tarea = t.id_tarea
    LEFT JOIN pagos_parciales p ON p.id_subtarea = s.id_subtarea
`;

const manejarError = (error, mensaje) => {
    console.error(mensaje, error);
    if (error.status) throw error;
    throw crearErrorHttp(mensaje);
};

export const listarTodos = async () => {
    try {
        const resultado = await pool.query(`${CONSULTA_TAREAS} ORDER BY t.id_tarea, s.id_subtarea;`);
        return resultado.rows;
    } catch (error) {
        manejarError(error, 'Error al consultar las tareas en la base de datos.');
    }
};

export const obtenerTarea = async (id) => {
    try {
        const resultado = await pool.query(
            `${CONSULTA_TAREAS} WHERE t.id_tarea = $1 ORDER BY s.id_subtarea;`,
            [id],
        );
        return resultado.rows;
    } catch (error) {
        manejarError(error, 'Error al consultar una tarea en la base de datos.');
    }
};

export const crearTarea = async ({ id_obra, nombre, descripcion, fecha_inicio_estimada, fecha_fin_estimada }) => {
    try {
        const resultado = await pool.query(
            `INSERT INTO tareas (id_obra, nombre, descripcion, fecha_inicio_estimada, fecha_fin_estimada)
             VALUES ($1, $2, $3, $4, $5) RETURNING *;`,
            [id_obra, nombre, descripcion, fecha_inicio_estimada, fecha_fin_estimada],
        );
        return resultado.rows[0] ?? null;
    } catch (error) {
        manejarError(error, 'Error al crear una tarea en la base de datos.');
    }
};

export const actualizarTarea = async (id, { id_obra, nombre, descripcion, fecha_inicio_estimada, fecha_fin_estimada }) => {
    try {
        const resultado = await pool.query(
            `UPDATE tareas
             SET id_obra = $1, nombre = $2, descripcion = $3,
                 fecha_inicio_estimada = $4, fecha_fin_estimada = $5
             WHERE id_tarea = $6 RETURNING *;`,
            [id_obra, nombre, descripcion, fecha_inicio_estimada, fecha_fin_estimada, id],
        );
        return resultado.rows[0] ?? null;
    } catch (error) {
        manejarError(error, 'Error al actualizar una tarea en la base de datos.');
    }
};

export const eliminar = async (id) => {
    try {
        const resultado = await pool.query(
            'DELETE FROM tareas WHERE id_tarea = $1 RETURNING id_tarea;',
            [id],
        );
        return resultado.rowCount > 0;
    } catch (error) {
        manejarError(error, 'Error al borrar una tarea en la base de datos.');
    }
};
