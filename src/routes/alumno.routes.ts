import { Router } from 'express'
import validateToken from './validate_token';
const router = Router();

import { createAlumno, getAlumnos, getAlumnosPorIdMateria, getAlumnosPorIdMateriaDivision, getInscripcionMateria, inscribirAlumnoMateria } from '../controllers/alumno.controller'

router.route('/')
    .get(validateToken,getAlumnos)
    .post(validateToken, createAlumno);

router.route('/getAlumnosPorIdMateria/:idMateria')
    .get(validateToken,getAlumnosPorIdMateria);

router.route('/getAlumnosPorIdMateriaDivision/:idMateriaDivision')
    .get(validateToken,getAlumnosPorIdMateriaDivision);

router.route("/getInscripcionMateria/:CarreraId")
        .get(validateToken,getInscripcionMateria);

router.route("/InscribirAlumnoSecretaria")
        .post(validateToken,inscribirAlumnoMateria);
    
export default router;