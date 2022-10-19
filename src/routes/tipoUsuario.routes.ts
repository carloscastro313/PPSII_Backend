import { Router } from 'express'
import validateToken from './validate_token';
const router = Router();

import { getTipoUsuarios, getTipoUsuario } from '../controllers/tipoUsuario.controller'

router.route('/')
    .get(validateToken,getTipoUsuarios);

router.route('/:TipoUsuarioId')
    .get(validateToken,getTipoUsuario);

export default router;