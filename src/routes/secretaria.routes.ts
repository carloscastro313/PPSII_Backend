import { Router } from 'express'
import validateToken from './validate_token';
const router = Router();

import { getSecretarias } from '../controllers/secretaria.controller'

router.route('/')
    .get(validateToken,getSecretarias);

export default router;