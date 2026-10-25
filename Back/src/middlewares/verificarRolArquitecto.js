export const verificarRolArquictecto = (req,res,next)=>{
    const rol = req.usuario.rol;

    if(!rol){
        return res.status(401).json({error:'Falta Rol'});
    }
    else{
        if(rol==="arquitecto"){
            next();//pasa a controller
        }
        else{
            return res.status(401).json({error:'Rol Invalido'});
        }
    }

}