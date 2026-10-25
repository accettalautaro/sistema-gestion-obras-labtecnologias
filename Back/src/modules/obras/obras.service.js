import * as repository from './obras.repository.js';

export const listarObras= async (req)=>{

    const{id_cliente,estado,id_lote,id_arquitecto}= req.query;
    const obras = await repository.listarTodos();
    if( id_cliente) {
        return obras.filter(o=> o.id_cliente=== id_cliente);
    }
    if(estado) {
        return obras.filter(o=> o.estado=== estado);
    }
    if(id_lote){
        return obras.filter(o=> o.id_lote=== id_lote);      
    }
    if(id_arquitecto){
        return obras.filter(o=> o.id_arquitecto=== id_arquitecto);

    }
    return obras;

}
export const crearObra= async (obra)=>{
    return await repository.crearObra(obra);
}

export const obtenerObra= async (id)=>{

    return await repository.obtenerObra(id);
}

export const actualizarObra= async(id,req)=>{
    const {id_arquitecto,id_cliente,fecha_inicio,fecha_fin,estado,descripcion}=req.body;
    return  await repository.actualizarObra(id,id_arquitecto,id_cliente,fecha_inicio,fecha_fin,estado,descripcion);
}

export const eliminarObra= async (id)=>{

    return await repository.eliminar(id);
}