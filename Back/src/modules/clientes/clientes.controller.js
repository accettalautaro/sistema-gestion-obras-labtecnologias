import * as service from './clientes.service.js';

//Get api/clientes
export const listarClientes = async(req,res,next)=>{
    try{
        const clientes = await service.listarClientes(req);
        res.status(200).json(clientes);
    }catch(error){
        next(error);
    }
}

//Get api/clientes/id
export const obtenerCliente = async(req,res,next)=>{
    try{
        const id = req.params.id;
        const cliente = await service.obtenerCliente(id);
        if(!cliente){
            return res.status(404).json({error:'Cliente no encontrado'});
        }
        return res.status(200).json(cliente);
    }catch(error){
        next(error);
    }
}

//POST api/clientes

export const crearCliente = async (req,res,next)=>{
    try{
        const cliente=await service.crearCliente(req.body);
        if(!cliente){
            return res.status(400).json({error:'Datos del cliente invalidos'});
        }
        return res.status(201).json(cliente);
    }catch(error){
            next(error);
    }
}

//PUT api/clientes/id
export const actualizarCliente = async (req,res,next)=>{
    try{
        const id = req.params.id;
        const cliente = await service.actualizarCliente(id,req.body);
        if(!cliente){
            return res.status(404).json({error:'cliente no encontrado'});
        }
        return res.status(200).json(cliente);
    }
    catch(error){
        next(error);
    }
}

//DELETE api/clientes/id

export const eliminarCliente = async (req,res,next)=>{
    try{
        const id = req.params.id;
        const cliente = await service.eliminarCliente(id);
        if(!cliente){
            return res.status(404).json({error:'cliente no encontrado'});
        }
        return res.status(204).send();
    }catch(error){
        next(error);
    }
}