import { Router } from 'express';
import * as controller from './terrenos.controller.js';
import { verificarToken } from '../../middlewares/verificarToken.js';
import { verificarRolArquictecto } from '../../middlewares/verificarRolArquitecto.js';

const router = Router();
const lectura = [verificarToken];
const escritura = [verificarToken, verificarRolArquictecto];

router.get('/', lectura, controller.listarTerrenos);
router.get('/direcciones/:id', lectura, controller.obtenerDireccion);
router.get('/direcciones', lectura, controller.listarDirecciones);
router.get('/mensuras/:id', lectura, controller.obtenerMensura);
router.get('/mensuras', lectura, controller.listarMensuras);
router.get('/escrituras/:id', lectura, controller.obtenerEscritura);
router.get('/escrituras', lectura, controller.listarEscrituras);
router.get('/propietarios/:id', lectura, controller.obtenerPropietario);
router.get('/propietarios', lectura, controller.listarPropietarios);

router.post('/', escritura, controller.crearTerreno);
router.put('/:id', escritura, controller.actualizarTerreno);
router.delete('/:id', escritura, controller.eliminarTerreno);

router.post('/direcciones', escritura, controller.crearDireccion);
router.put('/direcciones/:id', escritura, controller.actualizarDireccion);
router.delete('/direcciones/:id', escritura, controller.eliminarDireccion);

router.post('/mensuras', escritura, controller.crearMensura);
router.put('/mensuras/:id', escritura, controller.actualizarMensura);
router.delete('/mensuras/:id', escritura, controller.eliminarMensura);

router.post('/escrituras', escritura, controller.crearEscritura);
router.put('/escrituras/:id', escritura, controller.actualizarEscritura);
router.delete('/escrituras/:id', escritura, controller.eliminarEscritura);
router.post('/escrituras/:id/propietarios/:id_propietario', escritura, controller.vincularPropietario);
router.delete('/escrituras/:id/propietarios/:id_propietario', escritura, controller.desvincularPropietario);

router.post('/propietarios', escritura, controller.crearPropietario);
router.put('/propietarios/:id', escritura, controller.actualizarPropietario);
router.delete('/propietarios/:id', escritura, controller.eliminarPropietario);

router.get('/:id', lectura, controller.obtenerTerreno);

export default router;