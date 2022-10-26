import { Router } from 'express'
import validateToken from './validate_token';
const router = Router();

import { getDocentes } from '../controllers/docente.controller'

router.route('/')
    .get(validateToken,getDocentes);

export default router;