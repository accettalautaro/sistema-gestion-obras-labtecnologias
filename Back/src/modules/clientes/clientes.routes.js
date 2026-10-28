import {Router} from 'express';
import * as controller from './clientes.controller.js';
import {  verificarToken } from '../../middlewares/verificarToken.js';
import {  verificarRolArquictecto } from '../../middlewares/verificarRolArquitecto.js';
const router = Router();

// privadas y por rol
router.get('/', verificarToken, verificarRolArquictecto, controller.listarClientes);
router.get('/perfil', verificarToken, controller.obtenerPerfilUsuario);
router.get('/:id', verificarToken, verificarRolArquictecto, controller.obtenerCliente);
router.post('/',verificarToken,verificarRolArquictecto,controller.crearCliente);
router.put('/:id',verificarToken,verificarRolArquictecto,controller.actualizarCliente);
router.delete('/:id',verificarToken,verificarRolArquictecto,controller.eliminarCliente);

export default router;