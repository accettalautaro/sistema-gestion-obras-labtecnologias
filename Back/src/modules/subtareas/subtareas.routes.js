import {Router} from 'express';
import * as controller from './subtareas.controller.js';
import {  verificarToken } from '../../middlewares/verificarToken.js';
import {  verificarRolArquictecto } from '../../middlewares/verificarRolArquitecto.js';
const router = Router();
//protegidas
router.get('/:id',verificarToken,controller.obtenerSubtarea);
//solo el arquitecto tiene permisos
router.post('/',verificarToken,verificarRolArquictecto,controller.crearSubtarea);
router.put('/:id',verificarToken,verificarRolArquictecto,controller.actualizarSubtarea);
router.patch('/:id/estado',verificarToken,verificarRolArquictecto,controller.cambiarEstadoSubtarea);
router.delete('/:id',verificarToken,verificarRolArquictecto,controller.eliminarSubtarea);

export default router;
