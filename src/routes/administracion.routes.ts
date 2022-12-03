import { Router } from 'express'
import validateToken from './validate_token';
const router = Router();

import { getAdministraciones, createInstanciaInscripcion, getInstanciaInscripcionActivas, getTipoInstanciaInscripciones, getCarreras, createCarrera, getPlanesEstudio, createPlanEstudio, getMaterias, createMateria, updateCarrera, getPlanesEstudioById, getPlanesEstudioByCarreraId, getMateriaById, updateMateria, getTurnos, getFranjaHoraria, getPlanesEstudioByIdMaterias, createMateriasDivision, asignarDocenteAMateria, getCronogramaDocente, createInstanciaFinal, checkCanCreateInstancia, traerGruposDePersonas } from '../controllers/administracion.controller'

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

router.route('/planEstudio/materiasDivision')
    .post(validateToken,createMateriasDivision);

router.route('/planEstudio/:idPlan')
    .get(validateToken,getPlanesEstudioById)

router.route('/planEstudio/materias/:idPlan')
    .get(validateToken,getPlanesEstudioByIdMaterias);

router.route('/planEstudio/carrera/:CarreraId')
    .get(validateToken,getPlanesEstudioByCarreraId);

    router.route('/planEstudio/cronograma/:idPlan')
    .get(validateToken,getCronogramaDocente);

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

router.route('/docenteMaterias')
    .post(validateToken,asignarDocenteAMateria);

router.route('/instanciaFinal')
    .post(validateToken,createInstanciaFinal);

router.route('/checkCanCreateInstancia/:idTipoInstancia')
    .get(validateToken,checkCanCreateInstancia);

router.route('/traerGruposDePersonas')
    .get(validateToken,traerGruposDePersonas);
    
export default router;