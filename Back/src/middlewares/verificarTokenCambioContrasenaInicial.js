import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const verificarTokenCambioContrasenaInicial = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Falta el token de cambio de contraseña.' });
    }

    try {
        const payload = jwt.verify(authHeader.split(' ')[1], env.JWT_SECRET);
        if (payload.purpose !== 'initial-password-change' || payload.rol !== 'cliente') {
            return res.status(403).json({ error: 'El token no permite cambiar la contraseña inicial.' });
        }
        req.usuario = { id_usuario: payload.id_usuario, dni: payload.dni, rol: payload.rol };
        next();
    } catch (error) {
        const mensaje = error.name === 'TokenExpiredError' ? 'El plazo para cambiar la contraseña venció.' : 'Token inválido.';
        return res.status(401).json({ error: mensaje });
    }
};
