import {Router} from 'express';
import * as controller from './subtareas.controller.js';
import {  verificarToken } from '../../middlewares/verificarToken.js';
import {  verificarRolArquictecto } from '../../middlewares/verificarRolArquitecto.js';
const router = Router();

//solo el arquitecto tiene permisos
router.post('/',verificarToken,verificarRolArquictecto,controller.crearSubtarea);
router.put('/:id',verificarToken,verificarRolArquictecto,controller.actualizarsubTarea);
router.delete('/:id',verificarToken,verificarRolArquictecto,controller.eliminarsubTarea);

export default router;