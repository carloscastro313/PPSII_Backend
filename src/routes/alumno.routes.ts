import { Router } from "express";
import validateToken from "./validate_token";
const router = Router();

import {
  createAlumno,
  createExamenFinalAlumno,
  getAlumnos,
  getAlumnosPorIdMateria,
  getAlumnosPorIdMateriaDivision,
  getEstadoAcademico,
  getExamenesAnotados,
  getFinalesDisponible,
  getInscripcionMateria,
  getMateriasPlan,
  getNotasMaterias,
  inscribirAlumnoMateria,
} from "../controllers/alumno.controller";

router
  .route("/")
  .get(validateToken, getAlumnos)
  .post(validateToken, createAlumno);

router
  .route("/getAlumnosPorIdMateria/:idMateria")
  .get(validateToken, getAlumnosPorIdMateria);

router
  .route("/getAlumnosPorIdMateriaDivision/:idMateriaDivision")
  .get(validateToken, getAlumnosPorIdMateriaDivision);

router
  .route("/getInscripcionMateria/:idAlumno")
  .get(validateToken, getInscripcionMateria);

router
  .route("/InscribirAlumnoSecretaria")
  .post(validateToken, inscribirAlumnoMateria);

router.route("/getMateriasPlan").get(validateToken, getMateriasPlan);

router.route("/getEstadoAcademido").get(validateToken, getEstadoAcademico);

router.route("/getExamenesAnotados").get(validateToken, getExamenesAnotados);

router.route("/getNotasMaterias").get(validateToken, getNotasMaterias);
router.route("/getFinalesDisponible").get(validateToken, getFinalesDisponible);

router
  .route("/createExamenFinalAlumno")
  .post(validateToken, createExamenFinalAlumno);

export default router;
