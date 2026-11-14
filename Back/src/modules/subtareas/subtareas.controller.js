import * as service from './subtareas.service.js';



//GET api/subtareas/:id
export const obtenerSubtarea = async (req,res,next)=>{
    try{
        const id = req.params.id;
        const subtarea = await service.obtenerSubtarea(id);
        if(!subtarea){
            return res.status(404).json({error:'Subtarea no encontrada'});
        }
        return res.status(200).json(subtarea);
    }catch(error){
        next(error);
    }
}
//POST api/subtareas
export const crearSubtarea = async (req,res,next)=>{
    try{
        const subtarea=await service.crearSubtarea(req.body);
        if(!subtarea){
            return res.status(400).json({error:'Datos invalidos'});
        }
        return res.status(201).json(subtarea);

    }catch(error)
    {   
        next(error);
    }
}
//PUT api/subtareas/id
export const actualizarSubtarea = async (req,res,next) => {
    try{
        const id= req.params.id;
        const subtarea= await service.actualizarSubtarea(id,req.body);
        if(!subtarea){
            return res.status(404).json({error:'Subtarea no encontrada'});
        }
        return res.status(200).json(subtarea);

    }
    catch(error){
        next(error);

    }
} 
export const cambiarEstadoSubtarea = async (req,res,next) => {
    try {
        const resultado = await service.cambiarEstadoSubtarea(req.params.id, req.body?.accion);
        if (!resultado) {
            return res.status(404).json({ error: 'Subtarea no encontrada' });
        }
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
}
//DELETE api/subtareas/id
export const eliminarSubtarea = async (req,res,next)=>{
    try{
        const id= req.params.id;
        const subtarea= await service.eliminarSubtarea(id);
        if(!subtarea){
            return res.status(404).json({error:'Subtarea no encontrada'});
        }
        return res.status(204).send();

    }catch(error){
        next(error);
    }
}
