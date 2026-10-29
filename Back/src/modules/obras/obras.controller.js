import * as service from './obras.service.js';

//GET api/obras

//GET api/obras/?cliente=,?lote=,?arquitecto=,?estado=, where o.estado==estado
export const listarObras = async (req,res,next)=>{
    try{
        const obras = await service.listarObras(req)
        res.status(200).json(obras);
    }catch(error)
    {
        next(error);
    }
}

//GET api/obras/id
export const obtenerObra = async (req,res,next)=>{
    try{
        const id= req.params.id;
        const obra = await service.obtenerObra(id);
        if(!obra ){
            return res.status(404).json({error:'Obra no encontrada'});
        }
        return res.status(200).json(obra);

    }catch(error)
    {
        next(error);
    }
}
//GET api/obras/:id/tareas
export const obtenerTareas = async (req,res,next)=>{
    try{
        const id= req.params.id;
        const obra = await service.obtenerTareas(id);
        if(!obra){
            return res.status(404).json({error:'Obra no encontrada'});
        }
        return res.status(200).json(obra);

    }catch(error)
    {
        next(error);
    }
}
//POST api/obras
export const crearObra = async (req,res,next)=>{
    try{
        const obra=await service.crearObra(req.body);
        if(!obra){
            return res.status(400).json({error:'Datos invalidos'});
        }
        return res.status(201).json(obra);

    }catch(error)
    {   
        next(error);
    }
}
//PUT api/obras/id
export const actualizarObra = async (req,res,next) => {
    try{
        const id= req.params.id;
        const obra= await service.actualizarObra(id,req.body);
        if(!obra){
            return res.status(404).json({error:'obra no encontrada'});
        }
        return res.status(200).json(obra);

    }
    catch(error){
        next(error);

    }
}
//DELETE api/obras/id
export const eliminarObra = async (req,res,next)=>{
    try{
        const id= req.params.id;
        const obra= await service.eliminarObra(id);
        if(!obra){
            return res.status(404).json({error:'Obra no encontrada'});
        }
        return res.status(204).send();

    }catch(error){
        next(error);
    }
}

