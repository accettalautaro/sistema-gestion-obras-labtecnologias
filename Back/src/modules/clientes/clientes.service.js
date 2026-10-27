import * as repository from './clientes.repository.js';

export const listarClientes= async (req)=>{
    const{apellido,nombre}=req.query;
    const clientes = await repository.listarClientes();

    if(apellido){
        return clientes.filter(c => c.apellido === apellido);
    }
    if(nombre){
        return clientes.filter(c => c.nombre === nombre);
    }
    return clientes;
}

export const crearCliente = async (cliente)=>{
    return await repository.crearCliente(cliente);
}

export const obtenerCliente= async (id)=>{
    return await repository.obtenerCliente(id);
}

export const actualizarCliente= async(id,cliente)=> {
    const {nombre,apellido, dni, telefono, email} = cliente;
    return await repository.actualizarCliente(id,nombre,apellido, dni, telefono, email);
}

export const eliminarCliente= async(id)=> {
    return await repository.eliminarClientes(id);
}