import { Router } from 'express';
import * as controller from './recordatorios.controller.js';
import { verificarToken } from '../../middlewares/verificarToken.js';
import { verificarRolArquictecto } from '../../middlewares/verificarRolArquitecto.js';

const router = Router();

// Todas las rutas requieren autenticación.
router.use(verificarToken);

router.get('/', controller.listarRecordatorios);
router.get('/:id', controller.obtenerRecordatorio);

// Las modificaciones requieren además el rol de arquitecto.
router.post('/', verificarRolArquictecto, controller.crearRecordatorio);
router.put('/:id', verificarRolArquictecto, controller.actualizarRecordatorio);
router.delete('/:id', verificarRolArquictecto, controller.eliminarRecordatorio);

export default router;
