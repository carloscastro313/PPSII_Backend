import { Router } from 'express'
const router = Router();

import { createUsuario, getUsuarios, getUsuario, deleteUsuario, updateUsuario, login } from '../controllers/usuario.controller'
import validateToken from './validate_token';

router.route('/')
    .get(validateToken,getUsuarios)
    .post(validateToken, createUsuario);

router.route('/:UsuarioId')
    .get([validateToken],getUsuario)
    .delete([validateToken],deleteUsuario)
    .put([validateToken],updateUsuario);

router.route('/login')
    .post(login);

export default router;