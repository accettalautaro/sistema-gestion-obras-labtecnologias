import {Router} from 'express';
import * as controller from './clientes.controller.js';
import {  verificarToken } from '../../middlewares/verificarToken.js';
import {  verificarRolArquictecto } from '../../middlewares/verificarRolArquitecto.js';
const router = Router();

//publicas
router.get('/',controller.listarClientes);
router.get('/:id',controller.obtenerCliente);

//privadas y por rol
router.post('/',verificarToken,verificarRolArquictecto,controller.crearCliente);
router.put('/:id',verificarToken,verificarRolArquictecto,controller.actualizarCliente);
router.delete('/:id',verificarToken,verificarRolArquictecto,controller.eliminarCliente);

export default router;