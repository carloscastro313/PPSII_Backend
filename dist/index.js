"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("dotenv/config");
const testing_route_1 = __importDefault(require("./routes/testing.route"));
function main() {
    const PORT = process.env["PORT"] || 4000;
    const app = (0, express_1.default)();
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use(express_1.default.json());
    //Routes
    //Testing
    app.use(testing_route_1.default);
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en el http://localhost:${PORT}`);
    });
}
main();
