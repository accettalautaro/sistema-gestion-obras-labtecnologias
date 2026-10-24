import {Router} from 'express';
import * as controller from './obras.controller.js';

const router = Router();

//de momento todas publicas
router.get('/',controller.listarObras);
router.get('/:id',controller.obtenerObra);

router.post('/',controller.crearObra);
router.put('/:id',controller.actualizarObra);
router.delete('/:id',controller.eliminarObra);

export default router;