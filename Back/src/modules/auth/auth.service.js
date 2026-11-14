import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import * as repository from './auth.repository.js'

const SALT_ROUNDS = 10; // cuánto "trabajo" hace bcrypt: más alto = más seguro y más lento
const TOKEN_CAMBIO_INICIAL = 'initial-password-change';

const generarToken = (usuario, opciones = {}) => jwt.sign(
    { id_usuario: usuario.id_usuario, dni: usuario.dni, rol: usuario.rol, ...opciones },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN },
);

const validarContrasenaSegura = (contrasena) => {
    const puntosCodigo = [...contrasena]
    if (Buffer.byteLength(contrasena, 'utf8') > 72) {
        throw Object.assign(new Error('La contraseña es demasiado larga.'), { status: 400 });
    }
    const cumpleRequisitos = puntosCodigo.length >= 12
        && /\p{Lu}/u.test(contrasena)
        && /\p{Ll}/u.test(contrasena)
        && /\p{N}/u.test(contrasena)
        && /[^\p{L}\p{N}\s]/u.test(contrasena)

    if (!cumpleRequisitos) {
        throw Object.assign(new Error('La contraseña debe tener al menos 12 caracteres e incluir mayúsculas, minúsculas, números y un símbolo.'), { status: 400 });
    }
}

export const crearUsuarioCliente = async (idCliente, usuario) => {
    if (typeof usuario !== 'string' || !usuario.trim() || Buffer.byteLength(usuario, 'utf8') > 72) {
        throw Object.assign(new Error('La contraseña inicial no es válida.'), { status: 400 });
    }
    const id = String(idCliente ?? '');
    if (!/^\d{1,19}$/.test(id) || BigInt(id) < 1n || BigInt(id) > 9223372036854775807n) {
        throw Object.assign(new Error('El identificador del cliente no es válido.'), { status: 400 });
    }
    const cliente = await repository.obtenerClienteParaUsuario(id);
    if (!cliente) {
        throw Object.assign(new Error('Cliente no encontrado.'), { status: 404 });
    }
    if (cliente.id_usuario != null) {
        throw Object.assign(new Error('El cliente ya tiene un usuario asociado.'), { status: 409 });
    }
    const ultimosDigitosDni = String(cliente.dni ?? '').replace(/\D/g, '').slice(-4);
    if (ultimosDigitosDni.length !== 4 || usuario !== ultimosDigitosDni) {
        throw Object.assign(new Error('La contraseña inicial debe ser los últimos cuatro dígitos del DNI.'), { status: 400 });
    }
    const hash = await bcrypt.hash(usuario, SALT_ROUNDS);
    return repository.crearUsuarioCliente(id, hash);
};

export const obtenerPerfilUsuario = async (idUsuario) => {
    const perfil = await repository.obtenerPerfilUsuario(idUsuario);
    if (!perfil) {
        throw Object.assign(new Error('El perfil de usuario no fue encontrado.'), { status: 404 });
    }
    return perfil;
};

export const login = async(usuario)=>{
    const contrasena = usuario?.contrasena ?? usuario?.nombre;
    if (typeof contrasena !== 'string' || !contrasena
        || typeof usuario.dni !== 'string' || !usuario.dni.trim()) {
        throw Object.assign(new Error('DNI y contraseña son obligatorios.'), { status: 400 });
    }
    const { dni } = usuario;

    //pide el usuario asociado a el dni
    const arreglousuarioDB= await repository.obtenerUsuario(dni.trim());
    const usuarioDb=arreglousuarioDB[0];
    // 2. Comparar la contraseña recibida con el hash guardado
    const usuarioOK= usuarioDb && (await bcrypt.compare(contrasena,usuarioDb.nombre));

    //si esta mal
    if(!usuarioOK){
        throw Object.assign(new Error('Credenciales inválidas.'), { status: 401 });
    }

    const ultimosDigitosDni = String(usuarioDb.dni ?? '').replace(/\D/g, '').slice(-4);
    const usaContrasenaInicial = usuarioDb.rol === 'cliente'
        && ultimosDigitosDni.length === 4
        && contrasena === ultimosDigitosDni;

    if (usaContrasenaInicial) {
        const tokenCambioContrasenaInicial = jwt.sign(
            { id_usuario: usuarioDb.id_usuario, dni: usuarioDb.dni, rol: usuarioDb.rol, purpose: TOKEN_CAMBIO_INICIAL },
            env.JWT_SECRET,
            { expiresIn: '10m' },
        );
        return {
            tokenCambioContrasenaInicial,
            requiereCambioContrasena: true,
            rol: usuarioDb.rol,
        };
    }

    const token = generarToken(usuarioDb)
    return {
        token,
        rol: usuarioDb.rol,
        requiereCambioContrasena: false,
    };
}

export const cambiarContrasenaInicial = async (idUsuario, contrasenaNueva) => {
    if (typeof contrasenaNueva !== 'string') {
        throw Object.assign(new Error('Ingresá una contraseña válida.'), { status: 400 });
    }
    validarContrasenaSegura(contrasenaNueva);

    const usuario = await repository.obtenerUsuarioPorId(idUsuario);
    if (!usuario) {
        throw Object.assign(new Error('El usuario no fue encontrado.'), { status: 404 });
    }
    if (usuario.rol !== 'cliente') {
        throw Object.assign(new Error('Esta operación solo está disponible para cuentas de cliente.'), { status: 403 });
    }
    const ultimosDigitosDni = String(usuario.dni ?? '').replace(/\D/g, '').slice(-4);
    const mantieneContrasenaInicial = ultimosDigitosDni.length === 4
        && await bcrypt.compare(ultimosDigitosDni, usuario.nombre);
    if (!mantieneContrasenaInicial) {
        throw Object.assign(new Error('La cuenta ya no usa la contraseña inicial.'), { status: 409 });
    }

    const hash = await bcrypt.hash(contrasenaNueva, SALT_ROUNDS);
    const usuarioActualizado = await repository.cambiarContrasenaInicial(idUsuario, usuario.nombre, hash);
    if (!usuarioActualizado) {
        throw Object.assign(new Error('La cuenta ya no requiere un cambio inicial de contraseña.'), { status: 409 });
    }

    return {
        token: generarToken(usuarioActualizado),
        rol: usuarioActualizado.rol,
        dni: usuarioActualizado.dni,
        id_usuario: usuarioActualizado.id_usuario,
        requiereCambioContrasena: false,
    };
}

//SUBTARES(CRUD);TAREAS(Endpoint anidado subtareas) yo
// ;clientes,RECORDATORIOS THiago
// ,PAGOS,TERRENO, NAcho

//GENERAL
// conectar front
//endpoint aninados
//tablas apis
//generar justificacion porque la arquitectura
