import { Router } from "express";
import { GetTesting } from "../controllers/testing.controller";

const router = Router();

router.get("/testing", GetTesting);

export default router;
