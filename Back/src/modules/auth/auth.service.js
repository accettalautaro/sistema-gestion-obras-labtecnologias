import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import * as repository from './auth.repository.js'

const SALT_ROUNDS = 10; // cuánto "trabajo" hace bcrypt: más alto = más seguro y más lento

export const crearUsuarioCliente = async (idCliente, usuario) => {
    if (typeof usuario !== 'string' || !usuario.trim() || Buffer.byteLength(usuario, 'utf8') > 72) {
        throw Object.assign(new Error('El usuario/contraseña es obligatorio y no puede superar 72 bytes.'), { status: 400 });
    }
    const id = String(idCliente ?? '');
    if (!/^\d{1,19}$/.test(id) || BigInt(id) < 1n || BigInt(id) > 9223372036854775807n) {
        throw Object.assign(new Error('El identificador del cliente no es válido.'), { status: 400 });
    }
    const hash = await bcrypt.hash(usuario, SALT_ROUNDS);
    return repository.crearUsuarioCliente(id, hash);
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

    //FIRMA EL TOKEN con la palabra secreta
    const token = jwt.sign(
        { id_usuario: usuarioDb.id_usuario, dni: usuarioDb.dni, rol: usuarioDb.rol }, //payload
        env.JWT_SECRET,// palabra secreta           
        {expiresIn: env.JWT_EXPIRES_IN} // tiempo de expiracion
        
    );
    return { token };
}

//SUBTARES(CRUD);TAREAS(Endpoint anidado subtareas) yo
// ;clientes,RECORDATORIOS THiago
// ,PAGOS,TERRENO, NAcho

//GENERAL
// conectar front
//endpoint aninados
//tablas apis
//generar justificacion porque la arquitectura
