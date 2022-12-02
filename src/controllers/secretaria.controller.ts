import { Request, Response } from "express";
import { errorMsg } from "../const/errors";
import getInstanceDB from "../database";
import { TiposUsuario } from "../enums/tiposUsuario";
import Carrera from "../interface/Carrera";
import Usuario from "../interface/Usuario";

export async function getSecretarias(
  req: Request,
  res: Response
): Promise<Response> {
  const db = await getInstanceDB();
  const secretarias = await db.select<Usuario>("Usuarios", {
    TipoUsuario: TiposUsuario.Secretaria,
  });
  return res.json(secretarias);
}

export async function getCarrerasValidas(req: Request, res: Response) {
  try {
    const db = await getInstanceDB();
    const carreras = await db.select<Carrera>("Carrera");

    const carrerasValidas = [];

    for (let i = 0; i < carreras.length; i++) {
      if (carreras[i].PlanActual === null || carreras[i].PlanActual === "")
        continue;

      let [count] = await db.query<number>(
        `
            select count(*) from PlanEstudio pe 
            inner join PlanEstudioMateria pem on pe.Id = pem.IdPlan
            inner join MateriaDivision md on md.IdPlanEstudioMateria = pem.Id
            where pe.Nombre = ?
            group by md.Id
            `,
        [carreras[i].PlanActual]
      );

      if (count === 0) continue;

      carrerasValidas.push(carreras[i]);
    }

    res.json(carrerasValidas);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}
