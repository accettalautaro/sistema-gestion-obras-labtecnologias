import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import * as repository from './auth.repository.js'

const SALT_ROUNDS = 10; // cuánto "trabajo" hace bcrypt: más alto = más seguro y más lento

export const registro = async (nombre,rol,dni)=>{
        const hash = await bcrypt.hash(nombre,SALT_ROUNDS);
        return repository.crearUsuario(dni,rol,hash);
        
}

export const login = async(usuario)=>{
    
    const{nombre,dni}= usuario; //DEBERIAMOS CONTROLAR EL ROL TAMBIEN?

    //pide el usuario asociado a el dni
    const arreglousuarioDB= await repository.obtenerUsuario(dni);
    const usuarioDb=arreglousuarioDB[0];
    // 2. Comparar la contraseña recibida con el hash guardado
    const usuarioOK = usuarioDb && (await bcrypt.compare(nombre,usuarioDb.nombre));

    //si esta mal
    if(!usuarioOK){
        console.error('Credencial del usuario invalida');
        throw new Error('Credenciales invalidas');      
    }

    //FIRMA EL TOKEN con la palabra secreta
    const token = jwt.sign(
        { id: usuarioDb.id , nombre: usuarioDb.nombre, dni: usuarioDb.dni, rol: usuarioDb.rol}, //payload
        env.JWT_SECRET,// palabra secreta           
        {expiresIn: env.JWT_EXPIRES_IN} // tiempo de expiracion
        
    );
    return {token,rol: usuarioDb.rol};
}

//SUBTARES(CRUD);TAREAS(Endpoint anidado subtareas) yo
// ;clientes,RECORDATORIOS THiago
// ,PAGOS,TERRENO, NAcho

//GENERAL
// conectar front
//endpoint aninados
//tablas apis
//generar justificacion porque la arquitectura

