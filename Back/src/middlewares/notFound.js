//en caso de que la ruta no exista, se devuelve un error 404
export const notFound=(req,res)=>{
    res.status(404).json({error:'Ruta no encontrada'});
}