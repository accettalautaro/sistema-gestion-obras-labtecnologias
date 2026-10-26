import {Router} from 'express';
import * as controller from './tareas.controller.js';
import {  verificarToken } from '../../middlewares/verificarToken.js';
import {  verificarRolArquictecto } from '../../middlewares/verificarRolArquitecto.js';
const router = Router();

//todas son privadas
router.get('/',verificarToken,controller.listarTareas);
router.get('/:id',verificarToken,controller.obtenerTarea);
//solo el arquitecto tiene permisos
router.post('/',verificarToken,verificarRolArquictecto,controller.crearTarea);
router.put('/:id',verificarToken,verificarRolArquictecto,controller.actualizarTarea);
router.delete('/:id',verificarToken,verificarRolArquictecto,controller.eliminarTarea);

export default router;