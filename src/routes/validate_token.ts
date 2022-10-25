import { Request, Response, NextFunction } from "express";
import { header } from "express-validator";
import jwt, { JwtPayload } from "jsonwebtoken";
import { errorMsg } from "../const/errors";
import getInstanceDB from "../database";
import Usuario from "../interface/Usuario";

const validateToken = (req: Request, res: Response, next: NextFunction) => {
  const headerToken = req.header("authorization");

  if (headerToken != undefined && headerToken.startsWith("Bearer ")) {
    const bearerToken = headerToken.slice(7);

    try {
      jwt.verify(
        bearerToken,
        process.env.SECRET || "SECRETO",
        async (err, decoded) => {
          if (err) {
            return res.status(400).json({
              ok: false,
              valido: false,
              error: err,
            });
          }

          if (typeof decoded === "string") {
            return res.status(400).json({
              ok: false,
              valido: false,
              msg: errorMsg.ERROR_JWT,
            });
          }
          decoded = decoded as JwtPayload;
          const id = decoded["id"];
          const db = await getInstanceDB();
          const usuario = await db.selectOne<Usuario>("Usuarios", { Id: id });

          if (!usuario) {
            return res.status(400).json({
              ok: false,
              valido: false,
              msg: errorMsg.ERROR_JWT,
            });
          }

          next();
        }
      );
    } catch (error) {
      return res.status(400).json({
        error: "Token no valido",
      });
    }
  } else {
    return res.status(400).json({
      error: "Acceso denegado",
    });
  }
};

export default validateToken;
