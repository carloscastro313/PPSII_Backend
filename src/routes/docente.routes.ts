import { Router } from 'express'
import validateToken from './validate_token';
const router = Router();

import { agregarNotaFinalAAlumno, agregarNotasAAlumno, getDocentes, getMateriasDivisionDocente } from '../controllers/docente.controller'

router.route('/')
    .get(validateToken,getDocentes);

router.route('/materiasDivision/:idUsuario')
    .get(validateToken,getMateriasDivisionDocente);

router.route('/agregarNotaAAlumno')
    .post(validateToken,agregarNotasAAlumno);

router.route('/agregarNotaFinalAAlumno')
    .post(validateToken,agregarNotaFinalAAlumno);

export default router;