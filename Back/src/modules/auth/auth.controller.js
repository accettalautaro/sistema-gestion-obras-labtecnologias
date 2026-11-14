import * as service from './auth.service.js';

export const crearUsuarioCliente = async (req, res, next) => {
    try {
        const usuario = await service.crearUsuarioCliente(req.params.id, req.body?.usuario);
        return res.status(201).json(usuario);
    } catch (error) {
        next(error);
    }
};

//POST api/auth/login

export const login = async (req,res,next)=>{

    try {
        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
            return res.status(400).json({ error: 'DNI y contraseña son obligatorios.' });
        }
        const usuario= await service.login(req.body);
        if(!usuario){
            return res.status(400).json({error:'Peticion Invalida'});

        }
        return res.status(200).json(usuario);

        
    } catch (error) {
        next(error);
    }
}

export const perfil = async (req, res, next) => {
    try {
        const perfilUsuario = await service.obtenerPerfilUsuario(req.usuario.id_usuario);
        return res.json(perfilUsuario);
    } catch (error) {
        next(error);
    }
};
