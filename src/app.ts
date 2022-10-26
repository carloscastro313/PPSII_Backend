import express, { Application } from "express";
import morgan from "morgan";
import cors from "cors";
//Routes
import IndexRoutes from "./routes/index.routes";
import UsuariosRoutes from "./routes/usuario.routes";
import TipoUsuariosRoutes from "./routes/tipoUsuario.routes";
import AlumnosRoutes from "./routes/alumno.routes"; 

export class App {
  private app: Application;

  constructor(private port?: number | string) {
    this.app = express();
    this.settings();
    this.middlewares();
    this.routes();
  }

  settings() {
    this.app.set("port", this.port || process.env.PORT || 3000);
  }

  middlewares() {
    this.app.use(morgan("dev"));
    this.app.use(express.json());
    this.app.use(cors());
  }

  routes() {
    this.app.use(IndexRoutes);
    this.app.use("/usuarios", UsuariosRoutes);
    this.app.use("/tipoUsuarios", TipoUsuariosRoutes);
    this.app.use("/alumnos", AlumnosRoutes);
  }

  async listen() {
    await this.app.listen(this.app.get("port"));
    console.log("Server on port", this.app.get("port"));
  }
}
