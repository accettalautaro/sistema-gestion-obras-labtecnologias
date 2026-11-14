import { pool } from '../../config/db.js';

const manejarError = (error, mensaje) => {
    console.error(mensaje, error);
    if (error.status) throw error;
    if (error.code === '23505') {
        error.status = 409;
        error.message = 'Ya existe un registro con uno de los valores únicos indicados.';
        throw error;
    }
    if (error.code === '23503') {
        error.status = 409;
        error.message = error.constraint === 'obras_id_lote_fkey'
            ? 'No se puede eliminar este lote porque tiene obras asociadas.'
            : 'El registro está relacionado con otros datos o la referencia indicada no existe.';
        throw error;
    }
    if (error.code === '23514') {
        error.status = 400;
        error.message = 'Los datos no cumplen las restricciones de la base de datos.';
        throw error;
    }
    throw new Error(mensaje);
};

const ejecutarTransaccion = async (operacion, mensaje) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const resultado = await operacion(client);
        await client.query('COMMIT');
        return resultado;
    } catch (error) {
        await client.query('ROLLBACK');
        manejarError(error, mensaje);
    } finally {
        client.release();
    }
};

const SELECT_TERRENOS = `
    SELECT l.id_lote, l.nro_lote, l.id_direccion,
           to_jsonb(d) AS direccion,
           COALESCE((
               SELECT jsonb_agg(jsonb_build_object(
                   'id_obra', o.id_obra::text,
                   'estado', CASE
                       WHEN LOWER(COALESCE(o.estado, '')) IN ('pausa', 'pausada', 'suspendida', 'suspendido') THEN 'Pausada'
                       WHEN NOT EXISTS (
                           SELECT 1
                           FROM subtareas s
                           JOIN tareas t ON t.id_tarea = s.id_tarea
                           WHERE t.id_obra = o.id_obra AND s.fecha_inicio_real IS NOT NULL
                       ) THEN 'No Inicio'
                       WHEN EXISTS (
                           SELECT 1
                           FROM tareas t
                           WHERE t.id_obra = o.id_obra
                             AND (
                                 NOT EXISTS (SELECT 1 FROM subtareas s WHERE s.id_tarea = t.id_tarea)
                                 OR EXISTS (
                                     SELECT 1 FROM subtareas s
                                     WHERE s.id_tarea = t.id_tarea
                                       AND (s.porcentaje < 100 OR s.fecha_fin_real IS NULL)
                                 )
                             )
                       ) THEN 'En ejecución'
                       ELSE 'Finalizada'
                   END
               )
                                ORDER BY o.id_obra)
               FROM obras o
               WHERE o.id_lote = l.id_lote
           ), '[]'::jsonb) AS obras,
           COALESCE((
               SELECT jsonb_agg(jsonb_build_object(
                   'id_documento', doc.id_documento, 'nombre', doc.nombre,
                   'descripcion', doc.descripcion, 'archivo', doc.archivo,
                   'largo', m.largo, 'mts_cuadrados', m.mts_cuadrados, 'ancho', m.ancho
               ) ORDER BY doc.id_documento)
               FROM documentos doc
               JOIN mensuras m ON m.id_documento = doc.id_documento
               WHERE doc.id_lote = l.id_lote
           ), '[]'::jsonb) AS mensuras,
           COALESCE((
               SELECT jsonb_agg(jsonb_build_object(
                   'id_documento', doc.id_documento, 'nombre', doc.nombre,
                   'descripcion', doc.descripcion, 'archivo', doc.archivo,
                   'nro_escritura', e.nro_escritura,
                   'propietarios', COALESCE((
                       SELECT jsonb_agg(to_jsonb(p) ORDER BY p.id_propietario)
                       FROM escritura_propietarios ep
                       JOIN propietarios p ON p.id_propietario = ep.id_propietario
                       WHERE ep.id_documento = e.id_documento
                   ), '[]'::jsonb)
               ) ORDER BY doc.id_documento)
               FROM documentos doc
               JOIN escrituras e ON e.id_documento = doc.id_documento
               WHERE doc.id_lote = l.id_lote
           ), '[]'::jsonb) AS escrituras
    FROM lotes l
    LEFT JOIN direcciones d ON d.id_direccion = l.id_direccion
`;

export const listarTodos = async () => {
    try {
        const resultado = await pool.query(`${SELECT_TERRENOS} ORDER BY l.id_lote;`);
        return resultado.rows;
    } catch (error) {
        manejarError(error, 'Error al consultar los terrenos.');
    }
};

export const obtenerPorId = async (id) => {
    try {
        const resultado = await pool.query(
            `SELECT * FROM (${SELECT_TERRENOS}) AS terrenos WHERE id_lote = $1;`,
            [id],
        );
        return resultado.rows[0] ?? null;
    } catch (error) {
        manejarError(error, 'Error al consultar el terreno.');
    }
};

export const crear = async ({ nro_lote, direccion, mensura }) => ejecutarTransaccion(async (client) => {
    let id_direccion = null;
    if (direccion) {
        const nuevaDireccion = await client.query(
            `INSERT INTO direcciones
             (provincia, codigo_postal, calle, altura, piso, departamento, localidad)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id_direccion;`,
            [direccion.provincia ?? null, direccion.codigo_postal ?? null, direccion.calle,
                direccion.altura ?? null, direccion.piso ?? null, direccion.departamento ?? null,
                direccion.localidad ?? null],
        );
        id_direccion = nuevaDireccion.rows[0].id_direccion;
    }
    const lote = await client.query(
        `INSERT INTO lotes (nro_lote, id_direccion)
         VALUES ($1, $2) RETURNING *;`,
        [nro_lote, id_direccion],
    );
    if (mensura) {
        const documento = await client.query(
            `INSERT INTO documentos (id_lote, nombre, descripcion, archivo)
             VALUES ($1, $2, $3, $4) RETURNING id_documento;`,
            [lote.rows[0].id_lote, mensura.nombre ?? 'Mensura', mensura.descripcion ?? null,
                mensura.archivo ?? null],
        );
        await client.query(
            `INSERT INTO mensuras (id_documento, largo, mts_cuadrados, ancho)
             VALUES ($1, $2, $3, $4);`,
            [documento.rows[0].id_documento, mensura.largo ?? null, mensura.mts_cuadrados ?? null,
                mensura.ancho ?? null],
        );
    }
    return lote.rows[0];
}, 'Error al crear el terreno.');

export const actualizar = async (id, { nro_lote, id_direccion }) => ejecutarTransaccion(async (client) => {
        const resultado = await client.query(
            `UPDATE lotes SET nro_lote = $1, id_direccion = $2
             WHERE id_lote = $3 RETURNING *;`,
            [nro_lote, id_direccion ?? null, id],
        );
        return resultado.rows[0] ?? null;
}, 'Error al actualizar el terreno.');

export const eliminar = async (id) => ejecutarTransaccion(async (client) => {
    const lote = await client.query(
        'SELECT id_direccion FROM lotes WHERE id_lote = $1 FOR UPDATE;',
        [id],
    );
    if (!lote.rowCount) return false;

    const idDireccion = lote.rows[0].id_direccion;
    if (idDireccion != null) {
        await client.query('SELECT id_direccion FROM direcciones WHERE id_direccion = $1 FOR UPDATE;', [idDireccion]);
    }
    await client.query('DELETE FROM lotes WHERE id_lote = $1;', [id]);

    if (idDireccion != null) {
        await client.query(
            `DELETE FROM direcciones
             WHERE id_direccion = $1
               AND NOT EXISTS (SELECT 1 FROM lotes WHERE id_direccion = $1);`,
            [idDireccion],
        );
    }
    return true;
}, 'Error al eliminar el terreno.');

export const listarDirecciones = async () => {
    try {
        const resultado = await pool.query('SELECT * FROM direcciones ORDER BY id_direccion;');
        return resultado.rows;
    } catch (error) {
        manejarError(error, 'Error al consultar las direcciones.');
    }
};

export const obtenerDireccion = async (id) => {
    try {
        const resultado = await pool.query(
            'SELECT * FROM direcciones WHERE id_direccion = $1;',
            [id],
        );
        return resultado.rows[0] ?? null;
    } catch (error) {
        manejarError(error, 'Error al consultar la dirección.');
    }
};

export const crearDireccion = async (direccion) => {
    try {
        const resultado = await pool.query(
            `INSERT INTO direcciones
             (provincia, codigo_postal, calle, altura, piso, departamento, localidad)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;`,
            [direccion.provincia ?? null, direccion.codigo_postal ?? null, direccion.calle,
                direccion.altura ?? null, direccion.piso ?? null, direccion.departamento ?? null,
                direccion.localidad ?? null],
        );
        return resultado.rows[0];
    } catch (error) {
        manejarError(error, 'Error al crear la dirección.');
    }
};

export const actualizarDireccion = async (id, direccion) => {
    try {
        const resultado = await pool.query(
            `UPDATE direcciones SET provincia = $1, codigo_postal = $2, calle = $3,
             altura = $4, piso = $5, departamento = $6, localidad = $7
             WHERE id_direccion = $8 RETURNING *;`,
            [direccion.provincia ?? null, direccion.codigo_postal ?? null, direccion.calle,
                direccion.altura ?? null, direccion.piso ?? null, direccion.departamento ?? null,
                direccion.localidad ?? null, id],
        );
        return resultado.rows[0] ?? null;
    } catch (error) {
        manejarError(error, 'Error al actualizar la dirección.');
    }
};

export const eliminarDireccion = async (id) => {
    try {
        const resultado = await pool.query(
            'DELETE FROM direcciones WHERE id_direccion = $1 RETURNING id_direccion;',
            [id],
        );
        return resultado.rowCount > 0;
    } catch (error) {
        manejarError(error, 'Error al eliminar la dirección.');
    }
};

export const listarMensuras = async () => {
    try {
        const resultado = await pool.query(
            `SELECT d.id_documento, d.id_lote, d.nombre, d.descripcion, d.archivo,
                    m.largo, m.mts_cuadrados, m.ancho
             FROM documentos d JOIN mensuras m ON m.id_documento = d.id_documento
             ORDER BY d.id_documento;`,
        );
        return resultado.rows;
    } catch (error) {
        manejarError(error, 'Error al consultar las mensuras.');
    }
};

export const obtenerMensura = async (id) => {
    try {
        const resultado = await pool.query(
            `SELECT d.id_documento, d.id_lote, d.nombre, d.descripcion, d.archivo,
                    m.largo, m.mts_cuadrados, m.ancho
             FROM documentos d JOIN mensuras m ON m.id_documento = d.id_documento
             WHERE d.id_documento = $1;`,
            [id],
        );
        return resultado.rows[0] ?? null;
    } catch (error) {
        manejarError(error, 'Error al consultar la mensura.');
    }
};

export const crearMensura = async (mensura) => ejecutarTransaccion(async (client) => {
    const documento = await client.query(
        `INSERT INTO documentos (id_lote, nombre, descripcion, archivo)
         VALUES ($1, $2, $3, $4) RETURNING id_documento;`,
        [mensura.id_lote, mensura.nombre, mensura.descripcion ?? null, mensura.archivo ?? null],
    );
    const resultado = await client.query(
        `INSERT INTO mensuras (id_documento, largo, mts_cuadrados, ancho)
         VALUES ($1, $2, $3, $4)
         RETURNING id_documento, largo, mts_cuadrados, ancho;`,
        [documento.rows[0].id_documento, mensura.largo ?? null,
            mensura.mts_cuadrados ?? null, mensura.ancho ?? null],
    );
    return { ...resultado.rows[0], id_lote: String(mensura.id_lote), nombre: mensura.nombre,
        descripcion: mensura.descripcion ?? null, archivo: mensura.archivo ?? null };
}, 'Error al crear la mensura.');

export const actualizarMensura = async (id, mensura) => ejecutarTransaccion(async (client) => {
    const doc = await client.query(
        `UPDATE documentos SET nombre = $1, descripcion = $2, archivo = $3
         WHERE id_documento = $4 AND EXISTS (
             SELECT 1 FROM mensuras WHERE id_documento = $4
         ) RETURNING id_lote, id_documento, nombre, descripcion, archivo;`,
        [mensura.nombre, mensura.descripcion ?? null, mensura.archivo ?? null, id],
    );
    if (!doc.rowCount) return null;
    const resultado = await client.query(
        `UPDATE mensuras SET largo = $1, mts_cuadrados = $2, ancho = $3
         WHERE id_documento = $4
         RETURNING id_documento, largo, mts_cuadrados, ancho;`,
        [mensura.largo ?? null, mensura.mts_cuadrados ?? null, mensura.ancho ?? null, id],
    );
    return { ...doc.rows[0], ...resultado.rows[0] };
}, 'Error al actualizar la mensura.');

export const eliminarMensura = async (id) => ejecutarTransaccion(async (client) => {
    const mensura = await client.query(
        'DELETE FROM mensuras WHERE id_documento = $1 RETURNING id_documento;',
        [id],
    );
    if (!mensura.rowCount) return false;
    await client.query(
        `DELETE FROM documentos WHERE id_documento = $1
         AND NOT EXISTS (SELECT 1 FROM escrituras WHERE id_documento = $1);`,
        [id],
    );
    return true;
}, 'Error al eliminar la mensura.');

export const listarEscrituras = async () => {
    try {
        const resultado = await pool.query(
            `SELECT d.id_documento, d.id_lote, d.nombre, d.descripcion, d.archivo, e.nro_escritura
             FROM documentos d JOIN escrituras e ON e.id_documento = d.id_documento
             ORDER BY d.id_documento;`,
        );
        return resultado.rows;
    } catch (error) {
        manejarError(error, 'Error al consultar las escrituras.');
    }
};

export const obtenerEscritura = async (id) => {
    try {
        const resultado = await pool.query(
            `SELECT d.id_documento, d.id_lote, d.nombre, d.descripcion, d.archivo, e.nro_escritura
             FROM documentos d JOIN escrituras e ON e.id_documento = d.id_documento
             WHERE d.id_documento = $1;`,
            [id],
        );
        return resultado.rows[0] ?? null;
    } catch (error) {
        manejarError(error, 'Error al consultar la escritura.');
    }
};

export const crearEscritura = async (escritura) => ejecutarTransaccion(async (client) => {
    const documento = await client.query(
        `INSERT INTO documentos (id_lote, nombre, descripcion, archivo)
         VALUES ($1, $2, $3, $4) RETURNING id_documento;`,
        [escritura.id_lote, escritura.nombre, escritura.descripcion ?? null, escritura.archivo ?? null],
    );
    const resultado = await client.query(
        `INSERT INTO escrituras (id_documento, nro_escritura)
         VALUES ($1, $2) RETURNING id_documento, nro_escritura;`,
        [documento.rows[0].id_documento, escritura.nro_escritura],
    );
    return { ...resultado.rows[0], id_lote: String(escritura.id_lote), nombre: escritura.nombre,
        descripcion: escritura.descripcion ?? null, archivo: escritura.archivo ?? null };
}, 'Error al crear la escritura.');

export const actualizarEscritura = async (id, escritura) => ejecutarTransaccion(async (client) => {
    const doc = await client.query(
        `UPDATE documentos SET nombre = $1, descripcion = $2, archivo = $3
         WHERE id_documento = $4 AND EXISTS (
             SELECT 1 FROM escrituras WHERE id_documento = $4
         ) RETURNING id_lote, id_documento, nombre, descripcion, archivo;`,
        [escritura.nombre, escritura.descripcion ?? null, escritura.archivo ?? null, id],
    );
    if (!doc.rowCount) return null;
    const resultado = await client.query(
        `UPDATE escrituras SET nro_escritura = $1
         WHERE id_documento = $2 RETURNING nro_escritura;`,
        [escritura.nro_escritura, id],
    );
    return { ...doc.rows[0], ...resultado.rows[0] };
}, 'Error al actualizar la escritura.');

export const eliminarEscritura = async (id) => ejecutarTransaccion(async (client) => {
    await client.query('DELETE FROM escritura_propietarios WHERE id_documento = $1;', [id]);
    const escritura = await client.query(
        'DELETE FROM escrituras WHERE id_documento = $1 RETURNING id_documento;',
        [id],
    );
    if (!escritura.rowCount) return false;
    await client.query(
        `DELETE FROM documentos WHERE id_documento = $1
         AND NOT EXISTS (SELECT 1 FROM mensuras WHERE id_documento = $1);`,
        [id],
    );
    return true;
}, 'Error al eliminar la escritura.');

export const listarPropietarios = async (id_documento) => {
    const values = [];
    const filtro = id_documento ? 'WHERE ep.id_documento = $1' : '';
    if (id_documento) values.push(id_documento);
    try {
        const resultado = await pool.query(
            `SELECT p.*, ep.id_documento
             FROM escritura_propietarios ep
             JOIN propietarios p ON p.id_propietario = ep.id_propietario
             ${filtro}
             ORDER BY p.id_propietario;`,
            values,
        );
        return resultado.rows;
    } catch (error) {
        manejarError(error, 'Error al consultar los propietarios.');
    }
};

export const obtenerPropietario = async (id) => {
    try {
        const resultado = await pool.query(
            `SELECT p.*,
                    COALESCE(array_agg(ep.id_documento) FILTER (WHERE ep.id_documento IS NOT NULL),
                             ARRAY[]::bigint[]) AS escrituras
             FROM propietarios p
             LEFT JOIN escritura_propietarios ep ON ep.id_propietario = p.id_propietario
             WHERE p.id_propietario = $1
             GROUP BY p.id_propietario;`,
            [id],
        );
        return resultado.rows[0] ?? null;
    } catch (error) {
        manejarError(error, 'Error al consultar el propietario.');
    }
};

export const crearPropietario = async (propietario) => ejecutarTransaccion(async (client) => {
    const resultado = await client.query(
        `INSERT INTO propietarios (apellido, dni, estado_civil, porcentaje, nombre)
         VALUES ($1, $2, $3, $4, $5) RETURNING *;`,
        [propietario.apellido, propietario.dni, propietario.estado_civil ?? null,
            propietario.porcentaje, propietario.nombre],
    );
    const vinculo = await client.query(
        `INSERT INTO escritura_propietarios (id_documento, id_propietario)
         SELECT id_documento, $2 FROM escrituras
         WHERE id_documento = $1 RETURNING id_documento;`,
        [propietario.id_documento, resultado.rows[0].id_propietario],
    );
    if (!vinculo.rowCount) {
        const error = new Error('La escritura indicada no existe.');
        error.status = 400;
        throw error;
    }
    return { ...resultado.rows[0], id_documento: String(propietario.id_documento) };
}, 'Error al crear el propietario.');

export const actualizarPropietario = async (id, propietario) => {
    try {
        const resultado = await pool.query(
            `UPDATE propietarios SET apellido = $1, dni = $2, estado_civil = $3,
             porcentaje = $4, nombre = $5
             WHERE id_propietario = $6 RETURNING *;`,
            [propietario.apellido, propietario.dni, propietario.estado_civil ?? null,
                propietario.porcentaje, propietario.nombre, id],
        );
        return resultado.rows[0] ?? null;
    } catch (error) {
        manejarError(error, 'Error al actualizar el propietario.');
    }
};

export const eliminarPropietario = async (id) => ejecutarTransaccion(async (client) => {
    await client.query('DELETE FROM escritura_propietarios WHERE id_propietario = $1;', [id]);
    const resultado = await client.query(
        'DELETE FROM propietarios WHERE id_propietario = $1 RETURNING id_propietario;',
        [id],
    );
    return resultado.rowCount > 0;
}, 'Error al eliminar el propietario.');

export const vincularPropietario = async (id_documento, id_propietario) => {
    try {
        const resultado = await pool.query(
            `INSERT INTO escritura_propietarios (id_documento, id_propietario)
             SELECT e.id_documento, p.id_propietario
             FROM escrituras e CROSS JOIN propietarios p
             WHERE e.id_documento = $1 AND p.id_propietario = $2
             RETURNING *;`,
            [id_documento, id_propietario],
        );
        if (!resultado.rowCount) return null;
        return resultado.rows[0];
    } catch (error) {
        manejarError(error, 'Error al asociar el propietario a la escritura.');
    }
};

export const desvincularPropietario = async (id_documento, id_propietario) => {
    try {
        const resultado = await pool.query(
            `DELETE FROM escritura_propietarios
             WHERE id_documento = $1 AND id_propietario = $2 RETURNING id_documento;`,
            [id_documento, id_propietario],
        );
        return resultado.rowCount > 0;
    } catch (error) {
        manejarError(error, 'Error al quitar el propietario de la escritura.');
    }
};
