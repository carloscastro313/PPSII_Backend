import { Router } from 'express'
import validateToken from './validate_token';
const router = Router();

import { getAlumnos } from '../controllers/alumno.controller'

router.route('/')
    .get(validateToken,getAlumnos);

export default router;