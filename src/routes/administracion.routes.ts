import { Router } from 'express'
import validateToken from './validate_token';
const router = Router();

import { getAdministraciones, createInstanciaInscripcion, getInstanciaInscripcionActivas, getTipoInstanciaInscripciones, getCarreras, createCarrera, getPlanesEstudio, createPlanEstudio, getMaterias, createMateria, updateCarrera, getPlanesEstudioById, getPlanesEstudioByCarreraId, getMateriaById, updateMateria, getTurnos, getFranjaHoraria } from '../controllers/administracion.controller'

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
    .post(validateToken,createCarrera)
    .put(validateToken,updateCarrera);

router.route('/planEstudio')
    .get(validateToken,getPlanesEstudio)
    .post(validateToken,createPlanEstudio);

router.route('/planEstudio/:idPlan')
    .get(validateToken,getPlanesEstudioById)
    
router.route('/planEstudio/carrera/:CarreraId')
    .get(validateToken,getPlanesEstudioByCarreraId);

router.route('/materia')
    .get(validateToken,getMaterias)
    .post(validateToken,createMateria)
    .put(validateToken,updateMateria);

router.route('/materia/:materiaId')
    .get(validateToken,getMateriaById);

router.route('/turno')
    .get(validateToken,getTurnos);

router.route('/franjaHoraria')
    .get(validateToken,getFranjaHoraria);

export default router;