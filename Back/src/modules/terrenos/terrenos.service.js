import * as repository from './terrenos.repository.js';

const errorCliente = (mensaje) => Object.assign(new Error(mensaje), { status: 400 });
const esIdValido = (id) => /^\d{1,19}$/.test(String(id))
    && BigInt(id) > 0n
    && BigInt(id) <= 9223372036854775807n;

const validarId = (id, nombre = 'identificador') => {
    if (!esIdValido(id)) throw errorCliente(`${nombre} no es válido.`);
    return String(id);
};

const textoObligatorio = (valor, nombre) => {
    if (typeof valor !== 'string' || !valor.trim()) {
        throw errorCliente(`${nombre} es obligatorio.`);
    }
    return valor.trim();
};

const numeroOpcional = (valor, nombre, minimo = 0, maximo = Number.MAX_VALUE) => {
    if (valor === null || valor === undefined || valor === '') return null;
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero < minimo || numero > maximo) {
        throw errorCliente(`${nombre} debe ser un número entre ${minimo} y ${maximo}.`);
    }
    return numero;
};

const validarPorcentaje = (valor) => {
    const porcentaje = numeroOpcional(valor, 'porcentaje', 0, 100);
    if (porcentaje === null) throw errorCliente('porcentaje es obligatorio.');
    return porcentaje;
};

const validarDireccion = (direccion) => {
    if (!direccion || typeof direccion !== 'object' || Array.isArray(direccion)) {
        throw errorCliente('direccion debe ser un objeto.');
    }
    return {
        calle: textoObligatorio(direccion.calle, 'calle'),
        altura: direccion.altura ?? null,
        piso: direccion.piso ?? null,
        departamento: direccion.departamento ?? null,
        localidad: direccion.localidad ?? null,
        provincia: direccion.provincia ?? null,
        codigo_postal: direccion.codigo_postal ?? null,
    };
};

const validarMensura = (mensura, idLote) => {
    if (!mensura || typeof mensura !== 'object' || Array.isArray(mensura)) {
        throw errorCliente('mensura debe ser un objeto.');
    }
    return {
        id_lote: idLote,
        nombre: textoObligatorio(mensura.nombre ?? 'Mensura', 'nombre'),
        descripcion: mensura.descripcion ?? null,
        archivo: mensura.archivo ?? null,
        ancho: numeroOpcional(mensura.ancho, 'ancho'),
        largo: numeroOpcional(mensura.largo, 'largo'),
        mts_cuadrados: numeroOpcional(mensura.mts_cuadrados, 'mts_cuadrados'),
    };
};

const validarEscritura = (escritura) => {
    if (!escritura || typeof escritura !== 'object' || Array.isArray(escritura)) {
        throw errorCliente('Los datos de la escritura deben ser un objeto.');
    }
    return {
        id_lote: validarId(escritura.id_lote, 'id_lote'),
        nombre: textoObligatorio(escritura.nombre, 'nombre'),
        nro_escritura: textoObligatorio(escritura.nro_escritura, 'nro_escritura'),
        descripcion: escritura.descripcion ?? null,
        archivo: escritura.archivo ?? null,
    };
};

const validarPropietario = (propietario, requiereEscritura = false) => {
    if (!propietario || typeof propietario !== 'object' || Array.isArray(propietario)) {
        throw errorCliente('Los datos del propietario deben ser un objeto.');
    }
    const resultado = {
        nombre: textoObligatorio(propietario.nombre, 'nombre'),
        apellido: textoObligatorio(propietario.apellido, 'apellido'),
        dni: textoObligatorio(propietario.dni, 'dni'),
        estado_civil: propietario.estado_civil ?? null,
        porcentaje: validarPorcentaje(propietario.porcentaje),
    };
    if (requiereEscritura) resultado.id_documento = validarId(propietario.id_documento, 'id_documento');
    return resultado;
};

export const listarTerrenos = () => repository.listarTodos();

export const obtenerTerreno = (id) => repository.obtenerPorId(validarId(id, 'id_lote'));

export const crearTerreno = async (terreno) => {
    if (!terreno || typeof terreno !== 'object' || Array.isArray(terreno)) {
        throw errorCliente('Los datos del terreno deben ser un objeto.');
    }
    const nro_lote = textoObligatorio(terreno.nro_lote, 'nro_lote');
    const direccion = terreno.direccion == null ? null : validarDireccion(terreno.direccion);
    const mensura = terreno.mensura == null ? null : validarMensura(terreno.mensura, null);
    const creado = await repository.crear({ nro_lote, direccion, mensura });
    return repository.obtenerPorId(creado.id_lote);
};

export const actualizarTerreno = async (id, terreno) => {
    if (!terreno || typeof terreno !== 'object' || Array.isArray(terreno)) {
        throw errorCliente('Los datos del terreno deben ser un objeto.');
    }
    const actualizado = await repository.actualizar(validarId(id, 'id_lote'), {
        nro_lote: textoObligatorio(terreno.nro_lote, 'nro_lote'),
        id_direccion: terreno.id_direccion == null || terreno.id_direccion === ''
            ? null : validarId(terreno.id_direccion, 'id_direccion'),
    });
    return actualizado ? repository.obtenerPorId(actualizado.id_lote) : null;
};

export const eliminarTerreno = (id) => repository.eliminar(validarId(id, 'id_lote'));

export const listarDirecciones = () => repository.listarDirecciones();
export const obtenerDireccion = (id) => repository.obtenerDireccion(validarId(id, 'id_direccion'));
export const crearDireccion = (direccion) => repository.crearDireccion(validarDireccion(direccion));
export const actualizarDireccion = (id, direccion) => repository.actualizarDireccion(
    validarId(id, 'id_direccion'), validarDireccion(direccion),
);
export const eliminarDireccion = (id) => repository.eliminarDireccion(validarId(id, 'id_direccion'));

export const listarMensuras = () => repository.listarMensuras();
export const obtenerMensura = (id) => repository.obtenerMensura(validarId(id, 'id_documento'));
export const crearMensura = (mensura) => {
    const id_lote = validarId(mensura?.id_lote, 'id_lote');
    return repository.crearMensura(validarMensura(mensura, id_lote));
};
export const actualizarMensura = (id, mensura) => {
    if (!mensura || typeof mensura !== 'object' || Array.isArray(mensura)) {
        throw errorCliente('Los datos de la mensura deben ser un objeto.');
    }
    return repository.actualizarMensura(validarId(id, 'id_documento'), {
        nombre: textoObligatorio(mensura.nombre, 'nombre'),
        descripcion: mensura.descripcion ?? null,
        archivo: mensura.archivo ?? null,
        ancho: numeroOpcional(mensura.ancho, 'ancho'),
        largo: numeroOpcional(mensura.largo, 'largo'),
        mts_cuadrados: numeroOpcional(mensura.mts_cuadrados, 'mts_cuadrados'),
    });
};
export const eliminarMensura = (id) => repository.eliminarMensura(validarId(id, 'id_documento'));

export const listarEscrituras = () => repository.listarEscrituras();
export const obtenerEscritura = (id) => repository.obtenerEscritura(validarId(id, 'id_documento'));
export const crearEscritura = (escritura) => repository.crearEscritura(validarEscritura(escritura));
export const actualizarEscritura = (id, escritura) => {
    if (!escritura || typeof escritura !== 'object' || Array.isArray(escritura)) {
        throw errorCliente('Los datos de la escritura deben ser un objeto.');
    }
    return repository.actualizarEscritura(validarId(id, 'id_documento'), {
        nombre: textoObligatorio(escritura.nombre, 'nombre'),
        nro_escritura: textoObligatorio(escritura.nro_escritura, 'nro_escritura'),
        descripcion: escritura.descripcion ?? null,
        archivo: escritura.archivo ?? null,
    });
};
export const eliminarEscritura = (id) => repository.eliminarEscritura(validarId(id, 'id_documento'));

export const listarPropietarios = (id_documento) => repository.listarPropietarios(
    id_documento == null ? null : validarId(id_documento, 'id_documento'),
);
export const obtenerPropietario = (id) => repository.obtenerPropietario(validarId(id, 'id_propietario'));
export const crearPropietario = (propietario) => repository.crearPropietario(
    validarPropietario(propietario, true),
);
export const actualizarPropietario = (id, propietario) => repository.actualizarPropietario(
    validarId(id, 'id_propietario'), validarPropietario(propietario, true),
);
export const eliminarPropietario = (id) => repository.eliminarPropietario(validarId(id, 'id_propietario'));
export const vincularPropietario = (id_documento, id_propietario, porcentaje) => repository.vincularPropietario(
    validarId(id_documento, 'id_documento'), validarId(id_propietario, 'id_propietario'),
    validarPorcentaje(porcentaje),
);
export const desvincularPropietario = (id_documento, id_propietario) => repository.desvincularPropietario(
    validarId(id_documento, 'id_documento'), validarId(id_propietario, 'id_propietario'),
);
