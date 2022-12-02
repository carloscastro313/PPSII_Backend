import { Router } from "express";
import validateToken from "./validate_token";
const router = Router();

import {
  getCarrerasValidas,
  getSecretarias,
} from "../controllers/secretaria.controller";

router.route("/").get(validateToken, getSecretarias);

router.route("/carrerasvigentes").get(validateToken, getCarrerasValidas);

export default router;
