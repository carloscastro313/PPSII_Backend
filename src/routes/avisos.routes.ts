import { Router } from 'express'
import validateToken from './validate_token';
const router = Router();

import { createAviso, getAvisoById, getAvisos, marcarLeido, traerAvisosNoLeidosPorUsuario, traerTodosLosAvisosPorUsuario } from '../controllers/avisos.controller'

router.route('/')
    .get(validateToken, getAvisos)
    .post(validateToken, createAviso);

router.route('/:idAviso')
    .get(validateToken, getAvisoById);

router.route('/noLeidos/:idUsuario')
    .get(validateToken, traerAvisosNoLeidosPorUsuario);

router.route('/todosLosAvisos/:idUsuario')
    .get(validateToken,traerTodosLosAvisosPorUsuario);

router.route('/marcarLeido')
    .post(validateToken,marcarLeido);

export default router;