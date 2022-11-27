import { Router } from 'express'
import validateToken from './validate_token';
const router = Router();

import { createAlumno, getAlumnos, getAlumnosPorIdMateria, getAlumnosPorIdMateriaDivision } from '../controllers/alumno.controller'

router.route('/')
    .get(validateToken,getAlumnos)
    .post(validateToken, createAlumno);

router.route('/getAlumnosPorIdMateria/:idMateria')
    .get(validateToken,getAlumnosPorIdMateria);

router.route('/getAlumnosPorIdMateriaDivision/:idMateriaDivision')
    .get(validateToken,getAlumnosPorIdMateriaDivision);
    
export default router;