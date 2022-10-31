import { Router } from 'express'
import validateToken from './validate_token';
const router = Router();

import { createAlumno, getAlumnos } from '../controllers/alumno.controller'

router.route('/')
    .get(validateToken,getAlumnos)
    .post(validateToken, createAlumno);

export default router;