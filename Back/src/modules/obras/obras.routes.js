import {Router} from 'express';
import * as controller from './obras.controller.js';
import {  verificarToken } from '../../middlewares/verificarToken.js';
import {  verificarRolArquictecto } from '../../middlewares/verificarRolArquitecto.js';
const router = Router();

//publicas
router.get('/',controller.listarObras);
router.get('/:id',controller.obtenerObra);

//privadas y por rol
router.post('/',verificarToken,verificarRolArquictecto,controller.crearObra);
router.put('/:id',verificarToken,verificarRolArquictecto,controller.actualizarObra);
router.delete('/:id',verificarToken,verificarRolArquictecto,controller.eliminarObra);

export default router;