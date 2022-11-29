import { Request, Response } from "express";
import getInstanceDB from "../database";
import { TiposUsuario } from "../enums/tiposUsuario";
import Usuario from "../interface/Usuario";
import bcrypt from "bcrypt";
import { errorMsg } from "../const/errors";
import AlumnoCarrera from "../interface/AlumnoCarrera";
import { EstadosAlumnoCarrera } from "../enums/estadosAlumnoCarrera";
import { BindValue } from "mysql2-extended";
import AlumnoMaterias from "../interface/AlumnoMaterias";
import {
  EstadosAlumnoMateria,
  mapEstadosAlumnoMateria,
} from "../enums/estadoAlumnoMateria";
import Carrera from "../interface/Carrera";
import PlanEstudio from "../interface/PlanEstudio";
import Correlativa from "../interface/Correlativa";
import Materia from "../interface/Materia";
import { getTokenId } from "../helpers/jwt";
import { FranjasHorarias } from "../enums/franjaHoraria";
import { Turnos } from "../enums/turnos";

export async function getAlumnos(
  req: Request,
  res: Response
): Promise<Response> {
  const db = await getInstanceDB();
  const alumnos = await db.select<Usuario>("Usuarios", {
    TipoUsuario: TiposUsuario.Alumno,
  });
  return res.json(alumnos);
}

export async function getAlumnosPorIdMateria(
  req: Request,
  res: Response
): Promise<Response> {
  const idMateria = req.params.idMateria;
  var alumnos = [];

  try {
    const db = await getInstanceDB();

    var alumnosMaterias = await db.select<AlumnoMaterias>("AlumnoMaterias", {
      IdMateria: idMateria,
    });

    for (let i = 0; i < alumnosMaterias.length; i++) {
      var alum = await db.selectOne<Usuario>("Usuario", {
        Id: alumnosMaterias[i].IdAlumno,
      });

      var estadoAcademico = mapEstadosAlumnoMateria(
        alumnosMaterias[i].IdEstadoAcademico
      );

      alumnos.push({
        IdAlumno: alum.Id,
        Nombre: alum.Nombre,
        Apellido: alum.Apellido,
        DNI: alum.DNI,
        IdEstadoAcademico: alumnosMaterias[i].IdEstadoAcademico,
        EstadoAcademico: estadoAcademico,
      });
    }

    return res.json(alumnos);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function getAlumnosPorIdMateriaDivision(
  req: Request,
  res: Response
): Promise<Response> {
  const idMateriaDivision = req.params.idMateriaDivision;
  var alumnos = [];

  try {
    const db = await getInstanceDB();

    var alumnosMaterias = await db.select<AlumnoMaterias>("AlumnoMaterias", {
      IdMateria: idMateriaDivision,
    });

    for (let i = 0; i < alumnosMaterias.length; i++) {
      var alum = await db.selectOne<Usuario>("Usuario", {
        Id: alumnosMaterias[i].IdAlumno,
      });

      var estadoAcademico = mapEstadosAlumnoMateria(
        alumnosMaterias[i].IdEstadoAcademico
      );

      alumnos.push({
        IdAlumno: alum.Id,
        Nombre: alum.Nombre,
        Apellido: alum.Apellido,
        DNI: alum.DNI,
        IdEstadoAcademico: alumnosMaterias[i].IdEstadoAcademico,
        EstadoAcademico: estadoAcademico,
      });
    }
    return res.json(alumnos);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function createAlumno(req: Request, res: Response) {
  const newUsuario = req.body.Alumno;
  const carreraId = req.body.CarreraId;
  var idAlumno = 0;

  var values: BindValue[] = new Array(2);
  values[0] = newUsuario.DNI;
  values[1] = carreraId;

  try {
    const db = await getInstanceDB();

    newUsuario.Contraseña = await bcrypt.hash(newUsuario.Contraseña, 10);

    const alumnoValidacion = await db.query(
      "SELECT * FROM Usuarios u INNER JOIN AlumnoCarrera ac ON ac.IdAlumno = u.Id WHERE u.DNI = ? AND ac.IdCarrera = ?",
      values
    );

    if (alumnoValidacion.length != 0) {
      return res.status(400).json({
        msg: errorMsg.ERROR_ALUMNO_EXISTE_EN_CARRERA,
      });
    }

    await db.transaction(async (t) => {
      await t.insert<Usuario>("Usuarios", { ...newUsuario });
      idAlumno = await t.getLastInsertId();
    });

    if (idAlumno != 0) {
      var alumnoCarrera: AlumnoCarrera = {
        IdAlumno: idAlumno,
        IdCarrera: carreraId,
        IdEstadoCarrera: EstadosAlumnoCarrera.EnCurso,
      };
      await db.insert<AlumnoCarrera>("AlumnoCarrera", { ...alumnoCarrera });

      return res.json({
        msg:
          "El alumno se creo con exito. El legajo del alumno creado es " +
          idAlumno,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function getInscripcionMateria(req: Request, res: Response) {
  const carreraId = req.params.CarreraId;
  const bearerToken = req.header("authorization") as string;
  const { id } = getTokenId(bearerToken);

  try {
    const db = await getInstanceDB();

    try {
      var usuario = await db.selectOne<Usuario>("Usuarios", { Id: id });
    } catch (error) {
      return res.status(400).json({
        msg: "Error",
        body: errorMsg.ERROR_LEGAJO_NO_EXISTE,
      });
    }
    var arrCarrera = await db.select<Carrera>("Carrera", { Id: carreraId });

    if (arrCarrera.length == 0) {
      return res.status(400).json({
        msg: "Carrera no existe",
      });
    }

    var arrPlanEstudio = await db.select<PlanEstudio>("PlanEstudio", {
      Nombre: arrCarrera[0].PlanActual,
    });
    console.log(arrPlanEstudio);
    if (arrPlanEstudio.length == 0) {
      return res.status(400).json({
        msg: "Plan de estudio no existe",
      });
    }

    const idPlan = arrPlanEstudio[0].Id || -1;

    var arrMateriaCorrelativas: any = [];

    await db.transaction(async (t) => {
      var materias = await t.query<Materia>(
        "select ma.Id as Id, ma.Descripcion as Descripcion, pem.Id as IdPlanEstudioMateria from PlanEstudioMateria pem inner join Materia ma on pem.IdMateria = ma.Id where pem.IdPlan = ?",
        [idPlan]
      );
      var arrcorrelativas = await t.select<Correlativa>("Correlativa");
      materias.forEach((materia: any) => {
        arrMateriaCorrelativas.push({
          ...materia,
          correlativas: arrcorrelativas.filter(
            (value) => value.IdMateria === materia.Id
          ),
        });
      });
    });

    const alumnoMateria = await db.query<Materia>(
      "select ma.Id as Id, ma.Descripcion as Descripcion, md.Id as IdMateriaDivision from AlumnoMaterias am inner join MateriaDivision md on am.IdMateriaDivision = md.Id inner join PlanEstudioMateria pem on pem.Id = md.IdPlanEstudioMateria inner join Materia ma on ma.Id = pem.IdMateria where am.IdAlumno = ? and am.IdEstadoAcademico = ? or am.IdEstadoAcademico = ?",
      [
        usuario.Id as number,
        EstadosAlumnoMateria.CursadaAprobada,
        EstadosAlumnoMateria.MateriaAprobada,
      ]
    );

    const materiasValidas = getMateriasValidas(
      arrMateriaCorrelativas,
      alumnoMateria
    );

    console.log(materiasValidas);

    let materiasDivisiones: any[] = [];

    await db.transaction(async (t) => {
      for (let i = 0; i < materiasValidas.length; i++) {
        const aux = await t.query(
          "select md.Id as Id, ma.Descripcion as Descripcion, tu.Descripcion as Turno, fh.Descripcion as FranjaHoraria from MateriaDivision md inner join PlanEstudioMateria pem on pem.Id = md.IdPlanEstudioMateria inner join Materia ma on ma.Id = pem.IdMateria inner join cronograma cr on cr.Id = md.IdCronograma inner join Turno tu on tu.Id inner join FranjaHoraria fh on fh.Id = cr.IdFranjaHoraria where pem.Id = ?",
          [materiasValidas[i]]
        );
        materiasDivisiones = [...materiasDivisiones, ...aux];
      }
    });

    return res.json(materiasDivisiones);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

function getMateriasValidas(materias: any[], alumnoMaterias: Materia[]) {
  const arr = [];
  const alumnoMateriaIds = alumnoMaterias.map(({ Id }) => Id as number);

  for (let i = 0; i < materias.length; i++) {
    if (alumnoMateriaIds.includes(materias[i].Id as number)) continue;

    if (materias[i].correlativas != null) {
      const correlativasIds: number[] = materias[i].correlativas.map(
        (value: any) => {
          return value.IdCorrelativa;
        }
      );

      if (!compareArrs(correlativasIds, alumnoMateriaIds)) continue;
    }

    arr.push(materias[i].IdPlanEstudioMateria);
  }

  return arr;
}

function compareArrs(arr1: number[], arr2: number[]) {
  var flag = true;

  for (let i = 0; i < arr1.length; i++) {
    if (!arr2.includes(arr1[i])) flag = false;
  }

  return flag;
}

export async function inscribirAlumnoMateria(req: Request, res: Response) {
  const { IdAlumno, IdMateriaDivision } = req.body;

  try {
    const db = await getInstanceDB();

    const [materia]: any = await db.query(
      `select ma.Id as Id from MateriaDivision md 
      inner join PlanEstudioMateria pem on md.IdPlanEstudioMateria = pem.Id 
      inner join Materia ma on pem.IdMateria = ma.Id 
      where md.Id = ? `,
      [IdMateriaDivision]
    );

    const existeAlumnoMateria = db.query(
      `select * from AlumnoMaterias am
      inner join MateriaDivision md on am.IdMateriaDivision = md.Id 
      inner join PlanEstudioMateria pem on md.IdPlanEstudioMateria = pem.Id 
      inner join Materia ma on pem.IdMateria = ma.Id 
      where am.IdAlumno = ? and ma.Id = ? and am.IdEstadoAcademico != ?`,
      [IdAlumno, materia.Id, EstadosAlumnoMateria.MateriaDesaprobada]
    );

    if ((await existeAlumnoMateria).length > 0) {
      return res.status(400).json({
        msg: "El alumno ya esta inscripto a esta materia",
      });
    }

    await db.insert("AlumnoMaterias", {
      IdAlumno,
      IdMateriaDivision,
      IdEstadoAcademico: EstadosAlumnoMateria.CursadaRegular,
    });

    return res.json({
      msg: "El alumno se a inscribio con exito a la materia",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function getMateriasPlan(req: Request, res: Response) {
  const bearerToken = req.header("authorization") as string;
  const { id } = getTokenId(bearerToken);

  try {
    const db = await getInstanceDB();

    const [carrera]: any = await db.query(
      `select * from AlumnoCarrera ac
      inner join Carrera ca on ca.Id = ac.IdCarrera
      where ac.IdAlumno = ?`,
      [id]
    );

    const planEstudioMateria = await db.query(
      `select pe.Nombre as Plan, ma.Descripcion as Nombre, pem.Cuatrimestre as Cuatrimestre from PlanEstudio pe 
    inner join PlanEstudioMateria pem on pem.IdPlan = pe.Id 
    inner join Materia ma on ma.Id = pem.IdMateria
    where pe.Nombre = ?`,
      [carrera.PlanActual]
    );

    return res.json(planEstudioMateria);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function getEstadoAcademico(req: Request, res: Response) {
  const bearerToken = req.header("authorization") as string;
  const { id } = getTokenId(bearerToken);

  try {
    const db = await getInstanceDB();

    const estadoAcademico = await db.query(
      `
    select ma.Descripcion as Nombre, IFNULL(ea.Descripcion,'No cursada') as Estado, IFNULL(am.Notafinal,'-') as Notafinal, pem.Cuatrimestre as Cuatrimestre from AlumnoCarrera ac
    inner join Carrera ca on ca.Id = ac.IdCarrera
    inner join PlanEstudio pe on pe.Nombre = ca.PlanActual
    inner join PlanEstudioMateria pem on pem.IdPlan = pe.Id
    inner join Materia ma on ma.Id = pem.IdMateria
    left join MateriaDivision md on md.IdPlanEstudioMateria = pem.Id
    left join AlumnoMaterias am on am.IdMateriaDivision = md.Id and am.IdAlumno = ?
    left join EstadoAcademico ea on am.IdEstadoAcademico is not null and am.IdEstadoAcademico = ea.Id
    where ac.IdAlumno = ? 
    `,
      [id, id]
    );

    return res.json(estadoAcademico);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function getExamenesAnotados(req: Request, res: Response) {
  const bearerToken = req.header("authorization") as string;
  const { id } = getTokenId(bearerToken);

  try {
    const db = await getInstanceDB();

    const finalesPendiente = await db.query(
      `
      select ef.Fecha as Fecha, ma.Descripcion as Materia, cr.IdFranjaHoraria as IdFranjaHoraria, cr.IdTurno as IdTurno from AlumnoMaterias am
      inner join ExamenFinalAlumno efa on efa.IdAlumnoMateria = am.Id
      inner join ExamenFinal ef on ef.Id = efa.IdExamenFinal
      inner join DocenteMaterias dm on dm.Id = ef.IdDocenteMaterias
      inner join MateriaDivision md on md.Id = dm.IdMateriaDivision
      inner join PlanEstudioMateria pem on pem.Id = md.IdPlanEstudioMateria
      inner join Materia ma on ma.Id = pem.IdMateria
      inner join Cronograma cr on cr.Id = md.IdCronograma
      where efa.Nota = -1
    `,
      [id, id]
    );

    return res.json(transformFinalesPendiente(finalesPendiente));
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

function transformFinalesPendiente(finales: any[]) {
  const arr = [];

  for (let i = 0; i < finales.length; i++) {
    const { Fecha, Materia, IdFranjaHoraria, IdTurno } = finales[i];
    let aux: any = {
      Fecha,
      Materia,
    };

    switch (IdTurno) {
      case Turnos.Mañana:
        aux.FranjaHoraria = getMañana(IdFranjaHoraria);
        break;
      case Turnos.Tarde:
        aux.FranjaHoraria = getTarde(IdFranjaHoraria);
        break;
      case Turnos.Noche:
        aux.FranjaHoraria = getNoche(IdFranjaHoraria);
        break;
      default:
        break;
    }

    arr.push(aux);
  }

  return arr;
}

const getMañana = (IdFranjaHoraria: number) => {
  switch (IdFranjaHoraria) {
    case FranjasHorarias.PrimeraHora:
      return "8:30 - 10:30";
    case FranjasHorarias.SegundaHora:
      return "10:30 - 12:30";
    case FranjasHorarias.BloqueCompleto:
      return "8:30 - 12:30";
    default:
      break;
  }
};

const getTarde = (IdFranjaHoraria: number) => {
  switch (IdFranjaHoraria) {
    case FranjasHorarias.PrimeraHora:
      return "13:30 - 15:30";
    case FranjasHorarias.SegundaHora:
      return "15:30 - 17:30";
    case FranjasHorarias.BloqueCompleto:
      return "13:30 - 17:30";
    default:
      break;
  }
};

const getNoche = (IdFranjaHoraria: number) => {
  switch (IdFranjaHoraria) {
    case FranjasHorarias.PrimeraHora:
      return "18:30 - 20:30";
    case FranjasHorarias.SegundaHora:
      return "20:30 - 22:30";
    case FranjasHorarias.BloqueCompleto:
      return "18:30 - 22:30";
    default:
      break;
  }
};
