import * as service from './auth.service.js';

//POST api/auth/registro

export const registro = async (req,res,next) => {
    try{
        
        const {nombre,dni,rol}=req.body
        if (!nombre || !dni || !rol) {
        return res.status(400).json({ error: 'NOMBRE, ROL y DNI son obligatorios' });
        }
        const usuario = await service.registro(nombre,dni,rol);
        if(!usuario){
            return res.status(400).json({error:'Peticion invalida'});
        }
        return res.status(201).send();//CONSULTA DEBERIAMOS RETORNAR .json(usuario)?

    }catch(error){

        next(error);

    }
}

//POST api/auth/login

export const login = async (req,res,next)=>{

    try {
        const usuario= await service.login(req.body);
        if(!usuario){
            return res.status(400).json({error:'Peticion Invalida'});

        }
        return res.status(200).json(usuario);

        
    } catch (error) {
        next(error);
    }
}

//GET api/auth/perfil

// GET /api/auth/perfil  (ruta protegida) → "¿quién soy?"
// req.usuario lo cargó el middleware verificarToken a partir del token
export const perfil = (req, res) => {
    res.json(req.usuario);
};


