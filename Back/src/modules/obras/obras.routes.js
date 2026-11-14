import {Router} from 'express';
import * as controller from './obras.controller.js';
import {  verificarToken } from '../../middlewares/verificarToken.js';
import {  verificarRolArquictecto } from '../../middlewares/verificarRolArquitecto.js';
const router = Router();

//publicas
router.get('/',controller.listarObras);
router.get('/:id',controller.obtenerObra);
//protegidas
router.get('/:id/tareas',verificarToken,controller.obtenerTareas);

//privadas y por rol
router.post('/',verificarToken,verificarRolArquictecto,controller.crearObra);
router.put('/:id',verificarToken,verificarRolArquictecto,controller.actualizarObra);
router.patch('/:id/estado',verificarToken,verificarRolArquictecto,controller.actualizarEstadoSeguimiento);
router.delete('/:id',verificarToken,verificarRolArquictecto,controller.eliminarObra);

export default router;