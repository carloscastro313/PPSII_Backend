"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const testing_controller_1 = require("../controllers/testing.controller");
const router = (0, express_1.Router)();
router.get("/testing", testing_controller_1.GetTesting);
exports.default = router;
