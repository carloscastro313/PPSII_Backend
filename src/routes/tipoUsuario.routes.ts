import { Router } from 'express'
const router = Router();

import { getTipoUsuarios, getTipoUsuario } from '../controllers/tipoUsuario.controller'

router.route('/')
    .get(getTipoUsuarios);

router.route('/:TipoUsuarioId')
    .get(getTipoUsuario);

export default router;