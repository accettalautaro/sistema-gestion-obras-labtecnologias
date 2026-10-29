import { Router } from 'express';
import * as controller from './auth.controller.js';
import { verificarToken } from '../../middlewares/verificarToken.js';
import {  verificarRolArquictecto } from '../../middlewares/verificarRolArquitecto.js';
const router = Router();

router.post('/clientes/:id/usuario', verificarToken, verificarRolArquictecto, controller.crearUsuarioCliente);
router.post('/login', controller.login); // pública
router.get('/perfil', verificarToken, controller.perfil); // protegida

export default router;
