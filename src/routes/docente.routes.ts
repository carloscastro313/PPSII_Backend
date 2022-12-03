import { Router } from 'express'
import validateToken from './validate_token';
const router = Router();

import { agregarNotaFinalAAlumno, agregarNotasAAlumno, desaprobarAlumno, getAlumnosPorIdMateriaDivision, getDocentes, getFinalAlumno, getFinalDocente, getMateriasDivisionDocente } from '../controllers/docente.controller'

router.route('/')
    .get(validateToken,getDocentes);

router.route('/materiasDivision/:idUsuario')
    .get(validateToken,getMateriasDivisionDocente);

router.route('/agregarNotasAAlumno')
    .post(validateToken,agregarNotasAAlumno);

router.route('/agregarNotaFinalAAlumno')
    .post(validateToken,agregarNotaFinalAAlumno);

router.route('/getAlumnosPorMateriaDivision/:idMateriaDivision')
    .get(validateToken,getAlumnosPorIdMateriaDivision);

router.route('/getFinalDocente')
    .get(validateToken,getFinalDocente);

router.route('/getFinalAlumno/:idExamenFinal')
    .get(validateToken,getFinalAlumno);

router.route('/desaprobarAlumno')
    .post(validateToken,desaprobarAlumno);

export default router;