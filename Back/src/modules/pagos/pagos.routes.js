import { Router } from 'express';
import * as controller from './pagos.controller.js';
import { verificarToken } from '../../middlewares/verificarToken.js';
import { verificarRolArquictecto } from '../../middlewares/verificarRolArquitecto.js';

const router = Router();

router.get('/', verificarToken, controller.listarPagos);
router.get('/:id', verificarToken, controller.obtenerPago);
router.post('/', verificarToken, verificarRolArquictecto, controller.crearPago);
router.put('/:id', verificarToken, verificarRolArquictecto, controller.actualizarPago);
router.delete('/:id', verificarToken, verificarRolArquictecto, controller.eliminarPago);

export default router;