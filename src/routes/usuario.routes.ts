import { Router } from "express";
const router = Router();

import {
  createUsuario,
  getUsuarios,
  getUsuario,
  deleteUsuario,
  updateUsuario,
  login,
  checkSesion,
  traerGruposDePersonas,
} from "../controllers/usuario.controller";
import validateToken from "./validate_token";

router
  .route("/")
  .get(validateToken, getUsuarios)
  .post(validateToken, createUsuario);

router
  .route("/:UsuarioId")
  .get(validateToken, getUsuario)
  .delete(validateToken, deleteUsuario)
  .put(validateToken, updateUsuario);

router.route('/traerGruposDePersonas')
  .get(validateToken,traerGruposDePersonas);

router.route("/login").post(login);
router.route("/check").post(validateToken, checkSesion);
export default router;
