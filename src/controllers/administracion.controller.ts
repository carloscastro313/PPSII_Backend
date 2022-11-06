import { Request, Response } from "express";
import { BindValue } from "mysql2-extended";
import { ListFormat } from "typescript";
import { errorMsg } from "../const/errors";
import getInstanceDB from "../database";
import { mapFranjaHoraria } from "../enums/franjaHoraria";
import { TiposUsuario } from "../enums/tiposUsuario";
import { mapTurno, Turnos } from "../enums/turnos";
import List from "../helpers/list";
import Carrera from "../interface/Carrera";
import Correlativa from "../interface/Correlativa";
import Cronograma from "../interface/Cronograma";
import FranjaHoraria from "../interface/FranjaHoraria";
import Materia from "../interface/Materia";
import PlanEstudio from "../interface/PlanEstudio";
import PlanEstudioMateria from "../interface/PlanEstudioMateria";
import TipoInstanciaInscripcion from "../interface/TipoInstanciaInscripcion";
import Turno from "../interface/Turno";
import Usuario from "../interface/Usuario";

export async function getAdministraciones(req: Request,res: Response): Promise<Response> {
  const db = await getInstanceDB();

  const administraciones = await db.select<Usuario>("Usuarios", {TipoUsuario: TiposUsuario.Administracion});

  return res.json(administraciones);
}

export async function getInstanciaInscripcionActivas(req: Request,res: Response): Promise<Response> {
  try {
    const db = await getInstanceDB();
    const now = new Date();

    var values: BindValue[] = new Array(2);
    values[0] = now.toISOString();
    values[1] = now.toISOString();

    console.log(values);

    const instanciaInscripciones = await db.query(
      "SELECT * FROM InstanciaInscripcion WHERE FechaInicio <= ? AND FechaFinal >= ?",
      values
    );
    return res.json(instanciaInscripciones);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function getTipoInstanciaInscripciones(req: Request,res: Response): Promise<Response> {
  try {
    const db = await getInstanceDB();

    const tipoInstanciasInscripcion = await db.select<TipoInstanciaInscripcion>("TipoInstanciaInscripcion");

    return res.json(tipoInstanciasInscripcion);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function createInstanciaInscripcion(req: Request,res: Response): Promise<Response> {
  const newInstanciaInscripcion = req.body;

  try {
    const db = await getInstanceDB();

    const now = new Date();

    var values: BindValue[] = new Array(3);
    values[0] = now.toISOString();
    values[1] = now.toISOString();
    values[2] = newInstanciaInscripcion.IdTipo.toString();

    console.log(values);

    const instanciaInscripciones = await db.query("SELECT * FROM InstanciaInscripcion WHERE FechaInicio <= ? AND FechaFinal >= ? AND IdTipo = ?",values);

    if (instanciaInscripciones.length != 0) {
      return res.status(400).json({
        msg: errorMsg.ERROR_INSTANCIA_ACTIVA,
      });
    }

    await db.insert("InstanciaInscripcion", { ...newInstanciaInscripcion });

    return res.json(newInstanciaInscripcion);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function createCarrera(req: Request,res: Response): Promise<Response> {
  const newCarrera = req.body;

  try {
    const db = await getInstanceDB();

    const carreras = await db.query("SELECT * FROM Carrera WHERE Descripcion = ?",newCarrera.Descripcion);

    if (carreras.length != 0) {
      return res.status(400).json({
        msg: errorMsg.ERROR_CARRERA_EXISTE,
      });
    }

    await db.insert("Carrera", { ...newCarrera });

    return res.json(newCarrera);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function updateCarrera(req: Request,res: Response): Promise<Response> {
  const newCarrera = req.body;

  try {
    const db = await getInstanceDB();

    await db.update<Carrera>("Carrera",{ ...newCarrera },{ Id: newCarrera.Id });

    return res.json(newCarrera);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function getCarreras(req: Request,res: Response): Promise<Response> {
  try {
    const db = await getInstanceDB();
    const carreras = await db.select<Carrera>("Carrera");

    return res.json(carreras);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function createPlanEstudio(req: Request,res: Response): Promise<Response> {
  var newPlanEstudio = req.body.planEstudio;
  var materias = req.body.materias;
  var idPlan = 0;
  var anio = 0;
  const now = new Date();

  try {
    const db = await getInstanceDB();

    console.log(materias);

    await db.transaction(async (t) => {
      await t.insert<PlanEstudio>("PlanEstudio", { ...newPlanEstudio });

      idPlan = await t.getLastInsertId();
      anio = now.getFullYear();
      newPlanEstudio.Nombre = anio + "-" + idPlan;

      await t.update<PlanEstudio>("PlanEstudio",{ ...newPlanEstudio, FechaCreacion: now },{ Id: idPlan });

      await t.update<Carrera>("Carrera",{ PlanActual: newPlanEstudio.Nombre },{ Id: newPlanEstudio.IdCarrera });

      for (let i = 0; i < materias.length; i++) {
        var planEstudioMateria: PlanEstudioMateria = {
            IdPlan: idPlan,
            IdMateria: materias[i].IdMateria,
            Cuatrimestre: materias[i].Cuatrimestre,
            IdCronograma: 0
        };

        await t.insert<PlanEstudioMateria>("PlanEstudioMateria", {...planEstudioMateria});
        var idPlanEstudioMateria = await t.getLastInsertId();

        var cronograma : Cronograma = { IdFranjaHoraria: materias[i].IdFranjaHoraria, IdTurno: materias[i].IdTurno, Dia: materias[i].Dia };
        var IdCronograma = 0;

        await t.insert<Cronograma>("Cronograma",{...cronograma});
        IdCronograma = await t.getLastInsertId();
        await t.update<PlanEstudioMateria>("PlanEstudioMateria",{IdCronograma : IdCronograma}, {Id: idPlanEstudioMateria});
      }

    });

    return res.json(newPlanEstudio);

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function getPlanesEstudio(req: Request,res: Response): Promise<Response> {
  try {
    const db = await getInstanceDB();

    const planEstudio = await db.select<PlanEstudio>("PlanEstudio");

    return res.json(planEstudio);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function getPlanesEstudioById(req: Request,res: Response): Promise<Response> {
  const nombrePlan = req.params.idPlan;
  try {
    const db = await getInstanceDB();

    var [planEstudio] = await db.select<PlanEstudio>("PlanEstudio",{ Nombre: nombrePlan },{ limit: 1 });

    var planEstudioMateria = await db.select<PlanEstudioMateria>("PlanEstudioMateria",{ IdPlan: planEstudio.Id });
    var materias = [];

    for (let i = 0; i < planEstudioMateria.length; i++) {
      var materia: Materia = { Id: 0, Descripcion: "" };
      materia = await db.selectOne<Materia>("Materia", { Id: planEstudioMateria[i].IdMateria });

      var cronograma : Cronograma = await db.selectOne<Cronograma>("Cronograma", {
        Id: planEstudioMateria[i].IdCronograma
      });

      var turno =  mapTurno(cronograma.IdTurno);
      var franjaHoraria = mapFranjaHoraria(cronograma.IdFranjaHoraria);

      materias.push({
        ...materia,
        cuatrimestre: planEstudioMateria[i].Cuatrimestre,
        planEstudioMateriaId: planEstudioMateria[i].Id,
        turnoId: cronograma.IdTurno,
        turno: turno,
        franjaHorariaId: cronograma.IdFranjaHoraria,
        franjaHoraria: franjaHoraria,
        dia: cronograma.Dia
      });
    }

    return res.json({ planEstudio, materias });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function getPlanesEstudioByCarreraId(req: Request,res: Response): Promise<Response> {
  const idCarrera = req.params.CarreraId;
  try {
    const db = await getInstanceDB();

    const planEstudio = await db.select<PlanEstudio>("PlanEstudio", {
      IdCarrera: idCarrera,
    });

    return res.json(planEstudio);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function createMateria(req: Request,res: Response): Promise<Response> {
  const newMateria = req.body.materia;
  const correlativas = req.body.correlativas;

  var idMateria = 0;

  try {
    const db = await getInstanceDB();

    const materias = await db.query("SELECT * FROM Materia WHERE Descripcion = ?",newMateria.Descripcion);

    if (materias.length != 0) {
      return res.status(400).json({
        msg: errorMsg.ERROR_MATERIA_EXISTE,
      });
    }

    await db.transaction(async (t) => {
      await t.insert<Materia>("Materia", { ...newMateria });
      idMateria = await t.getLastInsertId();

      correlativas.forEach(async (element: number) => {
        var newCorrelativa: Correlativa = {
          IdCorrelativa: element,
          IdMateria: idMateria,
        };
        await t.insert<Correlativa>("Correlativa", { ...newCorrelativa });
      });
    });

    return res.json(newMateria);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function updateMateria(req: Request,res: Response): Promise<Response> {
  const newMateria = req.body.materia;
  const correlativas = req.body.correlativas;

  try {
    const db = await getInstanceDB();

    const materias = await db.query("SELECT * FROM Materia WHERE Id = ?",newMateria.Id);

    if (materias.length == 0) {
      return res.status(400).json({
        msg: errorMsg.ERROR_MATERIA_NO_EXISTE,
      });
    }

    await db.transaction(async (t) => {
      await t.update<Materia>("Materia",{ Descripcion: newMateria.Descripcion },{ Id: newMateria.Id });

      await t.delete<Correlativa>("Correlativa", { IdMateria: newMateria.Id });

      correlativas.forEach(async (element: number) => {
        var newCorrelativa: Correlativa = {
          IdCorrelativa: element,
          IdMateria: newMateria.Id,
        };
        await t.insert<Correlativa>("Correlativa", { ...newCorrelativa });
      });
    });

    return res.json(newMateria);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function getMaterias(req: Request,res: Response): Promise<Response> {
  try {
    const db = await getInstanceDB();

    const materias = await db.select<Materia>("Materia");

    return res.json(materias);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function getMateriaById(req: Request,res: Response): Promise<Response> {
  const materiaId = req.params.materiaId;

  try {
    const db = await getInstanceDB();

    const materia = await db.selectOne<Materia>("Materia", { Id: materiaId });
    var correlativas = await db.select<Correlativa>("Correlativa", {
      IdMateria: materiaId,
    });
    var materiasCorrelativas: Materia[] = [];

    for (let i = 0; i < correlativas.length; i++) {
      var materiaC: Materia = { Id: 0, Descripcion: "" };
      materiaC = await db.selectOne<Materia>("Materia", {
        Id: correlativas[i].IdCorrelativa,
      });

      materiasCorrelativas.push(materiaC);
    }

    return res.json({ materia, materiasCorrelativas });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function getTurnos(req: Request,res: Response): Promise<Response> {
    try {
        const db = await getInstanceDB();

        var turnos = await db.select<Turno>("Turno");

        return res.json(turnos);

    } catch (error) {
        console.log(error);
        return res.status(500).json({
          msg: errorMsg.ERROR_INESPERADO,
        });
    }
 }

 export async function getFranjaHoraria(req: Request,res: Response): Promise<Response> {
    try {
        const db = await getInstanceDB();

        var franjasHorarias = await db.select<FranjaHoraria>("FranjaHoraria");

        return res.json(franjasHorarias);

    } catch (error) {
        console.log(error);
        return res.status(500).json({
          msg: errorMsg.ERROR_INESPERADO,
        });
    }
 }

export async function generarCronograma(req: Request,res: Response): Promise<Response> {
    const cronogramas = req.body.cronogramas;
    
    try {
        const db = await getInstanceDB();

        for (let i = 0; i < cronogramas.length; i++) {
            var cronograma : Cronograma = { IdFranjaHoraria: cronogramas[i].IdFranjaHoraria, IdTurno: cronogramas[i].IdTurno, Dia: cronogramas[i].Dia };
            var IdCronograma = 0;

            await db.transaction(async (t) => {
                await t.insert<Cronograma>("Cronograma",{...cronograma});
                IdCronograma = await t.getLastInsertId();
                await t.update<PlanEstudioMateria>("PlanEstudioMateria",{IdCronograma : IdCronograma}, {Id: cronogramas[i].IdPlanEstudioMateria});
            })
        }

        return res.json("Cronogramas generados correctamente");

    } catch (error) {
        console.log(error);
        return res.status(500).json({
          msg: errorMsg.ERROR_INESPERADO,
        });
    }
}

export async function getCronogramaPorNombrePlan(req: Request,res: Response): Promise<Response> {
    const nombrePlan = req.params.idPlan;
    var result = [];

    try {
        const db = await getInstanceDB();

        var [planEstudio] = await db.select<PlanEstudio>("PlanEstudio",{ Nombre: nombrePlan },{ limit: 1 });

        var planEstudioMateria = await db.select<PlanEstudioMateria>("PlanEstudioMateria",{ IdPlan: planEstudio.Id });

        for (let i = 0; i < planEstudioMateria.length; i++) {
            var materia: Materia = { Id: 0, Descripcion: "" };
            materia = await db.selectOne<Materia>("Materia", { Id: planEstudioMateria[i].IdMateria });
      
            var cronograma : Cronograma = await db.selectOne<Cronograma>("Cronograma", {
              Id: planEstudioMateria[i].IdCronograma
            });
      
            var turno =  mapTurno(cronograma.IdTurno);
            var franjaHoraria = mapFranjaHoraria(cronograma.IdFranjaHoraria);
      
            result.push({
              ...materia,
              cuatrimestre: planEstudioMateria[i].Cuatrimestre,
              planEstudioMateriaId: planEstudioMateria[i].Id,
              turnoId: cronograma.IdTurno,
              turno: turno,
              franjaHorariaId: cronograma.IdFranjaHoraria,
              franjaHoraria: franjaHoraria,
              dia: cronograma.Dia
            });
        }

        return res.json(result);
          
    } catch(error) {
        console.log(error);
        return res.status(500).json({
          msg: errorMsg.ERROR_INESPERADO,
        });
    }
}