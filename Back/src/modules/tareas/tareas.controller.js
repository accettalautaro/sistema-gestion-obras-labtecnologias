import * as service from './tareas.service.js';

//GET api/tareas
export const listartTareas = async (req,res,next)=>{
    try{
        const tareas = await service.listarTareas()
        res.status(200).json(tareas);
    }catch(error)
    {
        next(error);
    }
}

//GET api/tareas/id
export const obtenerTarea = async (req,res,next)=>{
    try{
        const id= req.params.id;
        const tarea = await service.obtenerTarea(id);
        if(!tarea){
            return res.status(404).json({error:'Tarea no encontrada'});
        }
        return res.status(200).json(tarea);

    }catch(error)
    {
        next(error);
    }
}
//POST api/tareas
export const creaTarea = async (req,res,next)=>{
    try{
        const tarea=await service.crearTarea(req.body);
        if(!tarea){
            return res.status(400).json({error:'Datos invalidos'});
        }
        return res.status(201).json(tarea);

    }catch(error)
    {   
        next(error);
    }
}
//PUT api/tareas/id
export const actualizarTarea = async (req,res,next) => {
    try{
        const id= req.params.id;
        const tarea= await service.actualizarTarea(id,req.body);
        if(!tarea){
            return res.status(404).json({error:'Tarea no encontrada'});
        }
        return res.status(200).json(tarea);

    }
    catch(error){
        next(error);

    }
}
//DELETE api/tareas/id
export const eliminarTarea = async (req,res,next)=>{
    try{
        const id= req.params.id;
        const tarea= await service.eliminarTarea(id);
        if(!tarea){
            return res.status(404).json({error:'Tarea no encontrada'});
        }
        return res.status(204).send();

    }catch(error){
        next(error);
    }
}

