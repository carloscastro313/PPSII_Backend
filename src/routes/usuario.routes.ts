import { Router } from 'express'
const router = Router();

import { createUsuario, getUsuarios, getUsuario, deleteUsuario, updateUsuario, login } from '../controllers/usuario.controller'

router.route('/')
    .get(getUsuarios)
    .post(createUsuario);

router.route('/:UsuarioId')
    .get(getUsuario)
    .delete(deleteUsuario)
    .put(updateUsuario);

router.route('/login')
    .post(login);

export default router;