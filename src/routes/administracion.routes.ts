import { Router } from 'express'
import validateToken from './validate_token';
const router = Router();

import { getAdministraciones, createInstanciaInscripcion, getInstanciaInscripcionActivas, getTipoInstanciaInscripciones, getCarreras, createCarrera, getPlanesEstudio, createPlanEstudio, getMaterias, createMateria } from '../controllers/administracion.controller'

router.route('/')
    .get(validateToken,getAdministraciones);

router.route('/instanciaInscripcionActivas')
    .get(validateToken,getInstanciaInscripcionActivas);

router.route('/instanciaInscripcion')
    .post(validateToken,createInstanciaInscripcion);

router.route('/tipoInstanciaInscripciones')
    .get(validateToken,getTipoInstanciaInscripciones);

router.route('/carrera')
    .get(validateToken,getCarreras)
    .post(validateToken,createCarrera);

router.route('/planEstudio')
    .get(validateToken,getPlanesEstudio)
    .post(validateToken,createPlanEstudio);

router.route('/planEstudio/:CarreraId')
    .get(validateToken,getPlanesEstudio);

router.route('/materia')
    .get(validateToken,getMaterias)
    .post(validateToken,createMateria);

export default router;