import { Router } from 'express';
import * as controller from './recordatorios.controller.js';
import { verificarToken } from '../../middlewares/verificarToken.js';
import { verificarRolArquictecto } from '../../middlewares/verificarRolArquitecto.js';

const router = Router();

// Rutas públicas
router.get('/', controller.listarRecordatorios);
router.get('/:id', controller.obtenerRecordatorio);

// Rutas privadas para arquitectos
router.post('/', verificarToken, verificarRolArquictecto, controller.crearRecordatorio);
router.put('/:id', verificarToken, verificarRolArquictecto, controller.actualizarRecordatorio);
router.delete('/:id', verificarToken, verificarRolArquictecto, controller.eliminarRecordatorio);

export default router;
