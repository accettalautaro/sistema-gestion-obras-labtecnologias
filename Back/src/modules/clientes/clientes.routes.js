import {Router} from 'express';
import * as controller from './clientes.controller.js';
import {  verificarToken } from '../../middlewares/verificarToken.js';
import {  verificarRolArquictecto } from '../../middlewares/verificarRolArquitecto.js';
const router = Router();

// Todas las rutas requieren autenticación.
router.use(verificarToken);

router.get('/',controller.listarClientes);
router.get('/:id',controller.obtenerCliente);

// Las modificaciones requieren además el rol de arquitecto.
router.post('/',verificarRolArquictecto,controller.crearCliente);
router.put('/:id',verificarRolArquictecto,controller.actualizarCliente);
router.delete('/:id',verificarRolArquictecto,controller.eliminarCliente);

export default router;
