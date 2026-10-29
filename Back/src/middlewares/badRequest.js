export const badRequest = (error, req, res, next) => {
    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'El cuerpo de la solicitud debe contener JSON válido.' });
    }

    return next(error);
};