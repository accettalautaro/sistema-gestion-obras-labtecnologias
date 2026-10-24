//en caso de que la solicitud posee datos o formato invalido
export const badRequest=(req,res)=>{
    res.status(400).json({error:'Solicitud invalida'});
}