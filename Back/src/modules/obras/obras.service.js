import * as repository from './obras.repository';

export const listarObras= async (req)=>{

    const{cliente,estado,lote,arquitecto}= req.query;
    const obras = await repository.listarTodos();
    if(cliente) {
        return obras.filter(o=> o.cliente=== cliente);
    }
    if(estado) {
        return obras.filter(o=> o.estado=== estado);
    }
    if(lote){
        return obras.filter(o=> o.lote=== lote);      
    }
    if(arquitecto){
        return obras.filter(o=> o.arquitecto=== arquitecto);

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
    const {cliente,arquitecto,fechaI,fechaF,estado,descripcion}=req.body;
    return  await repository.actualizarObra(id,cliente,arquitecto,fechaI,fechaF,estado,descripcion);
}

export const eliminarObra= async (id)=>{

    return await repository.eliminar(id);
}