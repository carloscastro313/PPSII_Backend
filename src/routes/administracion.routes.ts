import { Router } from 'express'
import validateToken from './validate_token';
const router = Router();

import { getAdministraciones } from '../controllers/administracion.controller'

router.route('/')
    .get(validateToken,getAdministraciones);

export default router;