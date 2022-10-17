import { Router } from 'express'
const router = Router();

import { createAlumno, getAlumnos, getAlumno, deleteAlumno, updateAlumno } from '../controllers/alumno.controller'

router.route('/')
    .get(getAlumnos)
    .post(createAlumno);

router.route('/:alumnoId')
    .get(getAlumno)
    .delete(deleteAlumno)
    .put(updateAlumno);

export default router;