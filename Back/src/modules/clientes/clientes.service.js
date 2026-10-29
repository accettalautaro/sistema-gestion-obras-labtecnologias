import * as repository from './clientes.repository.js';

const errorCliente = (mensaje, status = 400) => Object.assign(new Error(mensaje), { status });
const MAX_BIGINT = 9223372036854775807n;

const validarId = (id) => {
    const texto = String(id ?? '');
    if (!/^\d{1,19}$/.test(texto) || BigInt(texto) < 1n || BigInt(texto) > MAX_BIGINT) {
        throw errorCliente('El identificador del cliente no es válido.');
    }
    return texto;
};

const textoObligatorio = (valor, campo, maximo) => {
    if (typeof valor !== 'string' || !valor.trim()) {
        throw errorCliente(`${campo} es obligatorio.`);
    }
    const texto = valor.trim();
    if (texto.length > maximo) throw errorCliente(`${campo} supera el máximo de ${maximo} caracteres.`);
    return texto;
};

const validarDatosCliente = (cliente) => {
    if (!cliente || typeof cliente !== 'object' || Array.isArray(cliente)) {
        throw errorCliente('Los datos del cliente deben ser un objeto.');
    }
    const telefono = cliente.telefono == null || cliente.telefono === ''
        ? null : textoObligatorio(cliente.telefono, 'El teléfono', 30);
    const email = cliente.email == null || cliente.email === ''
        ? null : textoObligatorio(cliente.email, 'El email', 254);
    return {
        nombre: textoObligatorio(cliente.nombre, 'El nombre', 100),
        apellido: textoObligatorio(cliente.apellido, 'El apellido', 100),
        dni: textoObligatorio(cliente.dni, 'El DNI', 20),
        telefono,
        email,
    };
};

export const listarClientes= async (req)=>{
    const{apellido,nombre}=req.query;
    const clientes = await repository.listarClientes();

    if(apellido){
        return clientes.filter(c => c.apellido === apellido);
    }
    if(nombre){
        return clientes.filter(c => c.nombre === nombre);
    }
    return clientes;
}

export const crearCliente = async (cliente)=>{
    return repository.crearCliente(validarDatosCliente(cliente));
}

export const obtenerCliente= async (id)=>{
    return repository.obtenerCliente(validarId(id));
}

export const obtenerPerfilUsuario = async (usuario) => {
    if (usuario?.rol !== 'cliente') {
        throw errorCliente('Esta operación es solo para cuentas de cliente.', 403);
    }
    return repository.obtenerPorIdUsuario(validarId(usuario.id_usuario));
};

export const actualizarCliente= async(id,cliente)=> {
    const datos = validarDatosCliente(cliente);
    return repository.actualizarCliente(validarId(id), datos.nombre, datos.apellido, datos.dni, datos.telefono, datos.email);
}

export const eliminarCliente= async(id)=> {
    return repository.eliminarClientes(validarId(id));
}