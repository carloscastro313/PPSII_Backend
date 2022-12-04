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
import InstanciaInscripcion from "../interface/InstanciaInscripcion";
import ExamenFinalAlumno from "../interface/ExamenFinalAlumno";
import mandarMail from "../helpers/mailer";
import ExamenFinal from "../interface/ExamenFinal";

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
  const id = req.params.idAlumno;

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

    var alumnoCarrera = await db.select<AlumnoCarrera>("AlumnoCarrera", {
      IdAlumno: usuario.Id,
    });

    var arrCarrera = await db.select<Carrera>("Carrera", {
      Id: alumnoCarrera[0].IdCarrera,
    });

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
      "select ma.Id as Id, ma.Descripcion as Descripcion, md.Id as IdMateriaDivision from AlumnoMaterias am inner join MateriaDivision md on am.IdMateriaDivision = md.Id inner join PlanEstudioMateria pem on pem.Id = md.IdPlanEstudioMateria inner join Materia ma on ma.Id = pem.IdMateria where am.IdAlumno = ? and (am.IdEstadoAcademico = ? or am.IdEstadoAcademico = ?)",
      [
        usuario.Id as number,
        EstadosAlumnoMateria.CursadaAprobada,
        EstadosAlumnoMateria.MateriaAprobada,
      ]
    );

    const alumnoMateriaCursando = await db.query<Materia>(
      "select ma.Id as Id, ma.Descripcion as Descripcion, md.Id as IdMateriaDivision from AlumnoMaterias am inner join MateriaDivision md on am.IdMateriaDivision = md.Id inner join PlanEstudioMateria pem on pem.Id = md.IdPlanEstudioMateria inner join Materia ma on ma.Id = pem.IdMateria where am.IdAlumno = ? and am.IdEstadoAcademico = ?",
      [usuario.Id as number, EstadosAlumnoMateria.CursadaRegular]
    );

    let materiasValidas = getMateriasValidas(
      arrMateriaCorrelativas,
      alumnoMateria,
      alumnoMateriaCursando
    );

    console.log(materiasValidas);

    let materiasDivisiones: any[] = [];

    await db.transaction(async (t) => {
      for (let i = 0; i < materiasValidas.length; i++) {
        const aux = await t.query(
          "select md.Id as Id, ma.Descripcion as Descripcion, cr.Dia as Dia ,tu.Descripcion as Turno, fh.Descripcion as FranjaHoraria from MateriaDivision md inner join DocenteMaterias dm on dm.IdMateriaDivision = md.Id  inner join PlanEstudioMateria pem on pem.Id = md.IdPlanEstudioMateria inner join Materia ma on ma.Id = pem.IdMateria inner join cronograma cr on cr.Id = md.IdCronograma inner join Turno tu on tu.Id = cr.IdTurno inner join FranjaHoraria fh on fh.Id = cr.IdFranjaHoraria where pem.Id = ?",
          [materiasValidas[i]]
        );
        if (aux.length > 0)
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

function getMateriasValidas(
  materias: any[],
  alumnoMaterias: Materia[],
  alumnoMateriaCursando: Materia[]
) {
  const arr = [];
  const alumnoMateriaIds = alumnoMaterias.map(({ Id }) => Id as number);
  const alumnoMateriaCorrelativasIds = alumnoMateriaCursando.map(
    ({ Id }) => Id as number
  );

  for (let i = 0; i < materias.length; i++) {
    if (
      alumnoMateriaIds.includes(materias[i].Id as number) ||
      alumnoMateriaCorrelativasIds.includes(materias[i].Id as number)
    )
      continue;

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

    var usuarios = await db.query<Usuario>(
      "SELECT * FROM Usuarios WHERE Id = ?",
      [IdAlumno]
    );
    var usuariosMails = usuarios.map(({ Mail }) => Mail as string);

    await mandarMail(
      usuariosMails,
      "FUISTE INSCRIPTO A UNA MATERIA",
      "Se te inscribio correctamente a la materia: " + materia.Descripcion,
      ""
    );

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

    let estadoAcademico: any[] = [];

    const alumnoMaterias = await db.query(
      `
      select 
      ma.Descripcion as Nombre, 
      IFNULL(ea.Descripcion,'No cursada') as Estado, 
      CASE
        WHEN am.Notafinal IS NULL THEN '-'
        WHEN am.Notafinal = 0 THEN '-'
        ELSE am.Notafinal
      END as Notafinal,
      pem.Cuatrimestre as Cuatrimestre, 
      am.IdEstadoAcademico as IdEstadoAcademico 
      from AlumnoMaterias am
      inner join EstadoAcademico ea on ea.Id = am.IdEstadoAcademico
      inner join MateriaDivision md on am.IdMateriaDivision = md.Id
      inner join PlanEstudioMateria pem on md.IdPlanEstudioMateria = pem.Id
      inner join Materia ma on ma.Id = pem.IdMateria
      where am.IdAlumno = ? and (am.IdEstadoAcademico = ? or am.IdEstadoAcademico = ? or am.IdEstadoAcademico = ?) 
      `,
      [
        id,
        EstadosAlumnoMateria.CursadaAprobada,
        EstadosAlumnoMateria.CursadaRegular,
        EstadosAlumnoMateria.MateriaAprobada,
      ]
    );

    const materiasCarrera = await db.query(
      `
    select distinct
    ma.Descripcion as Nombre, 
    'No cursada' as Estado, 
    '-' as  Notafinal,
    pem.Cuatrimestre as Cuatrimestre
    from AlumnoCarrera ac
    inner join Carrera ca on ca.Id = ac.IdCarrera
    inner join PlanEstudio pe on pe.Nombre = ca.PlanActual
    inner join PlanEstudioMateria pem on pem.IdPlan = pe.Id
    inner join Materia ma on ma.Id = pem.IdMateria
    where ac.IdAlumno = ? 
    `,
      [id, id]
    );

    estadoAcademico = [...alumnoMaterias, ...materiasCarrera];

    return res.json(filtrarAprobados(estadoAcademico));
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

function filtrarAprobados(arr: any[]) {
  const filtrarAprobados = arr
    .filter(
      (value) =>
        value.IdEstadoAcademico === EstadosAlumnoMateria.MateriaAprobada ||
        value.IdEstadoAcademico === EstadosAlumnoMateria.CursadaAprobada ||
        value.IdEstadoAcademico === EstadosAlumnoMateria.CursadaRegular
    )
    .map((value) => value.Nombre);

  return arr.filter((value) => {
    return (
      !filtrarAprobados.includes(value.Nombre) ||
      value.IdEstadoAcademico === EstadosAlumnoMateria.MateriaAprobada ||
      value.IdEstadoAcademico === EstadosAlumnoMateria.CursadaRegular ||
      value.IdEstadoAcademico === EstadosAlumnoMateria.CursadaAprobada
    );
  });
}

export async function getExamenesAnotados(req: Request, res: Response) {
  const bearerToken = req.header("authorization") as string;
  const { id } = getTokenId(bearerToken);

  try {
    const db = await getInstanceDB();

    const finalesPendiente = await db.query(
      `
      select ma.Descripcion as Materia, ef.Fecha as Fecha, cr.IdTurno as Turno, cr.IdFranjaHoraria as FranjaHoraria from AlumnoMaterias am
      inner join ExamenFinalAlumno efa on efa.IdAlumnoMateria = am.Id
      inner join ExamenFinal ef on ef.Id = efa.IdExamenFinal
      inner join DocenteMaterias dm on dm.Id = ef.IdDocenteMaterias
      inner join MateriaDivision md on md.Id = dm.IdMateriaDivision
      inner join PlanEstudioMateria pem on pem.Id = md.IdPlanEstudioMateria
      inner join Materia ma on ma.Id = pem.IdMateria
      inner join Cronograma cr on cr.Id = md.IdCronograma
      where efa.Nota = -1 and am.IdAlumno = ? 
    `,
      [id]
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
    let aux: any = {
      ...finales[i],
    };

    switch (aux.Turno) {
      case Turnos.Mañana:
        aux.FranjaHoraria = getMañana(aux.FranjaHoraria);
        break;
      case Turnos.Tarde:
        aux.FranjaHoraria = getTarde(aux.FranjaHoraria);
        break;
      case Turnos.Noche:
        aux.FranjaHoraria = getNoche(aux.FranjaHoraria);
        break;
      default:
        break;
    }
    delete aux.Turno;
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

export async function getNotasMaterias(req: Request, res: Response) {
  const bearerToken = req.header("authorization") as string;
  const { id } = getTokenId(bearerToken);
  // var materiasConNotas = [];

  try {
    const db = await getInstanceDB();

    var alumnoMaterias: any[] = await db.query(
      `
    select 
    ma.Id as IdMateria,
    ma.Descripcion as Descripcion,  
    am.NotaPrimerParcial as NotaPrimerParcial,
    am.NotaSegundoParcial as NotaSegundoParcial,  
    am.NotaRecuperatorioPrimerParcial as NotaRecuperatorioPrimerParcial,  
    am.NotaRecuperatorioPrimerParcial2 as NotaRecuperatorioPrimerParcial2,  
    am.NotaRecuperatorioSegundoParcial as NotaRecuperatorioSegundoParcial,  
    am.NotaRecuperatorioSegundoParcial2 as NotaRecuperatorioSegundoParcial2,  
    am.NotaFinal as NotaFinal,  
    ea.Descripcion as Estado  
    from AlumnoMaterias am 
    inner join EstadoAcademico ea on am.IdEstadoAcademico = ea.Id
    inner join MateriaDIvision md on am.IdMateriaDivision = md.Id
    inner join PlanEstudioMateria pem on pem.Id = md.IdPlanEstudioMateria
    inner join Materia ma on ma.Id = pem.IdMateria
    where am.IdAlumno = ? and am.IdEstadoAcademico != ?
    `,
      [id, EstadosAlumnoMateria.MateriaDesaprobada]
    );

    // for (let i = 0; i < alumnoMaterias.length; i++) {
    //   var materia = await db.selectOne<Materia>("Materia", {
    //     Id: alumnoMaterias[i].IdMateria,
    //   });

    //   var estadoAcademico = mapEstadosAlumnoMateria(
    //     alumnoMaterias[i].IdEstadoAcademico
    //   );

    //   if (
    //     alumnoMaterias[i].IdEstadoAcademico !=
    //     EstadosAlumnoMateria.MateriaDesaprobada
    //   ) {
    //     materiasConNotas.push({
    //       IdMateria: materia.Id,
    //       Nombre: materia.Descripcion,
    //       NotaPrimerParcial: alumnoMaterias[i].NotaPrimerParcial,
    //       NotaSegundoParcial: alumnoMaterias[i].NotaSegundoParcial,
    //       NotaRecuperatorioPrimerParcial:
    //         alumnoMaterias[i].NotaRecuperatorioPrimerParcial,
    //       NotaRecuperatorioSegundoParcial:
    //         alumnoMaterias[i].NotaRecuperatorioSegundoParcial,
    //       NotaRecuperatorioPrimerParcial2:
    //         alumnoMaterias[i].NotaRecuperatorioPrimerParcial2,
    //       NotaRecuperatorioSegundoParcial2:
    //         alumnoMaterias[i].NotaRecuperatorioSegundoParcial2,
    //       NotaFinal: alumnoMaterias[i].NotaFinal,
    //       EstadoAcademico: estadoAcademico,
    //     });
    //   }
    // }

    let arrNotas: any[] = [];

    alumnoMaterias.forEach((value) => {
      let {
        NotaPrimerParcial,
        NotaSegundoParcial,
        NotaRecuperatorioPrimerParcial,
        NotaRecuperatorioPrimerParcial2,
        NotaRecuperatorioSegundoParcial,
        NotaRecuperatorioSegundoParcial2,
        NotaFinal,
      } = value;

      NotaPrimerParcial = NotaPrimerParcial == 0 ? "-" : NotaPrimerParcial;
      NotaSegundoParcial = NotaSegundoParcial == 0 ? "-" : NotaSegundoParcial;
      NotaRecuperatorioPrimerParcial =
        NotaRecuperatorioPrimerParcial == 0
          ? "-"
          : NotaRecuperatorioPrimerParcial;
      NotaRecuperatorioPrimerParcial2 =
        NotaRecuperatorioPrimerParcial2 == 0
          ? "-"
          : NotaRecuperatorioPrimerParcial2;
      NotaRecuperatorioSegundoParcial =
        NotaRecuperatorioSegundoParcial == 0
          ? "-"
          : NotaRecuperatorioSegundoParcial;
      NotaRecuperatorioSegundoParcial2 =
        NotaRecuperatorioSegundoParcial2 == 0
          ? "-"
          : NotaRecuperatorioSegundoParcial2;
      NotaFinal = NotaFinal == 0 ? "-" : NotaFinal;

      arrNotas.push({
        ...value,
        NotaPrimerParcial,
        NotaSegundoParcial,
        NotaRecuperatorioPrimerParcial,
        NotaRecuperatorioPrimerParcial2,
        NotaRecuperatorioSegundoParcial,
        NotaRecuperatorioSegundoParcial2,
        NotaFinal,
      });
    });

    return res.json(arrNotas);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function getFinalesDisponible(req: Request, res: Response) {
  const bearerToken = req.header("authorization") as string;
  const { id } = getTokenId(bearerToken);

  try {
    const db = await getInstanceDB();

    const now = new Date();

    var values: BindValue[] = new Array(3);
    values[0] = now.toISOString();
    values[1] = now.toISOString();
    values[2] = 1;

    console.log(values);

    const instanciaInscripciones = await db.query<InstanciaInscripcion>(
      "SELECT * FROM InstanciaInscripcion WHERE FechaInicio <= ? AND FechaFinal >= ? AND IdTipo = ?",
      values
    );

    // if (instanciaInscripciones.length == 0) {
    //   return res.status(400).json({
    //     msg: "No hay instancias de inscripcion habilitadas",
    //   });
    // }

    var [carrera] = await db.select<AlumnoCarrera>(
      "AlumnoCarrera",
      { IdAlumno: id },
      { limit: 1 }
    );

    var arrCarrera = await db.select<Carrera>("Carrera", {
      Id: carrera.IdCarrera,
    });

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

    const alumnoMateriaAprobadas: Materia[] = await db.query<Materia>(
      `
    select ma.Id as Id, ma.Descripcion as Descripcion, md.Id as IdMateriaDivision from AlumnoMaterias am 
    inner join MateriaDivision md on am.IdMateriaDivision = md.Id 
    inner join PlanEstudioMateria pem on pem.Id = md.IdPlanEstudioMateria 
    inner join Materia ma on ma.Id = pem.IdMateria 
    where am.IdAlumno = ? and am.IdEstadoAcademico = ?
    `,
      [id, EstadosAlumnoMateria.MateriaAprobada]
    );

    const alumnoMateriaCursadas: any[] = await db.query(
      `
    select ma.Id as Id, ma.Descripcion as Descripcion, md.Id as IdMateriaDivision, am.Id as IdAlumnoMateria from AlumnoMaterias am 
    inner join MateriaDivision md on am.IdMateriaDivision = md.Id 
    inner join PlanEstudioMateria pem on pem.Id = md.IdPlanEstudioMateria 
    inner join Materia ma on ma.Id = pem.IdMateria 
    where am.IdAlumno = ? and am.IdEstadoAcademico = ?
    `,
      [id, EstadosAlumnoMateria.CursadaAprobada]
    );

    const materiasValidas = getFinalMateria(
      arrMateriaCorrelativas,
      alumnoMateriaAprobadas,
      alumnoMateriaCursadas
    );

    let finalesDisponibles: any[] = [];

    await db.transaction(async (t) => {
      for (let i = 0; i < materiasValidas.length; i++) {
        const aux = await t.query(
          `
          select md.Id as IdMateriaDivision, ma.Id as IdMateria, ef.Id as IdExamenFinal, ef.Fecha as Fechas, ma.Descripcion as Nombre, cr.IdTurno as Turno, cr.IdFranjaHoraria as FranjaHoraria from ExamenFinal ef
          inner join DocenteMaterias dm on dm.Id = ef.IdDocenteMaterias
          inner join MateriaDivision md on md.Id = dm.IdMateriaDivision
          inner join PlanEstudioMateria pem on pem.Id = md.IdPlanEstudioMateria
          inner join PlanEstudio pe on pe.Id = pem.IdPlan 
          inner join Materia ma on ma.Id = pem.IdMateria 
          inner join Cronograma cr on ef.IdCronograma = cr.Id
          where ma.Id = ? and pe.Nombre = ? and ef.Fecha > ?
          `,
          [
            materiasValidas[i],
            arrCarrera[0].PlanActual,
            instanciaInscripciones[0].FechaFinal || new Date(),
          ]
        );
        finalesDisponibles = [...finalesDisponibles, ...aux];
      }

      let examenFinalAlumno: any[] = [];

      for (let i = 0; i < alumnoMateriaCursadas.length; i++) {
        // const aux = await db.select<ExamenFinalAlumno>("ExamenFinalAlumno", {
        //   IdAlumnoMateria: alumnoMateriaCursadas[i].IdAlumnoMateria,
        //   Nota: -1,
        // });

        const aux = await db.query(
          `select ma.Id from ExamenFinalAlumno efa
          inner join AlumnoMaterias am on am.Id = efa.IdAlumnoMateria
          inner join MateriaDivision md on md.Id = am.IdMateriaDivision
          inner join PlanEstudioMateria pem on pem.Id = md.IdPlanEstudioMateria
          inner join Materia ma on ma.Id = pem.IdMateria
          where efa.IdAlumnoMateria = ? and Nota = -1`,
          [alumnoMateriaCursadas[i].IdAlumnoMateria]
        );

        if (aux.length > 0) examenFinalAlumno = [...examenFinalAlumno, ...aux];
      }

      let examenFinalAlumnoIds: number[] = examenFinalAlumno.map(
        (val) => val.Id as number
      );

      finalesDisponibles = finalesDisponibles.filter(
        (val) => !examenFinalAlumnoIds.includes(val.IdMateria)
      );
    });

    return res.json(transformFinalesPendiente(finalesDisponibles));
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

function getFinalMateria(
  materias: any[],
  alumnoMateriasAprobadas: Materia[],
  alumnoMateriasCursadas: Materia[]
) {
  const arr = [];
  const arrMaterias: any[] = [];
  const alumnoMateriaIds = alumnoMateriasAprobadas.map(
    ({ Id }) => Id as number
  );
  const alumnoMateriaCursadaIds = alumnoMateriasCursadas.map(
    ({ Id }) => Id as number
  );

  materias.forEach((val) => {
    if (alumnoMateriaCursadaIds.includes(val.Id)) arrMaterias.push(val);
  });

  for (let i = 0; i < arrMaterias.length; i++) {
    if (arrMaterias[i].correlativas.length > 0) {
      const correlativasIds: number[] = arrMaterias[i].correlativas.map(
        (value: any) => {
          return value.IdCorrelativa;
        }
      );

      if (!compareArrs(correlativasIds, alumnoMateriaIds)) continue;
    }

    arr.push(arrMaterias[i].Id);
  }

  return arr;
}

export async function createExamenFinalAlumno(req: Request, res: Response) {
  const { IdExamenFinal, IdMateriaDivision, IdMateria } = req.body;
  const bearerToken = req.header("authorization") as string;
  const { id } = getTokenId(bearerToken);

  try {
    const db = await getInstanceDB();

    const alumnoMaterias = await db.query<AlumnoMaterias>(
      `select am.Id as Id, am.IdAlumno as IdAlumno, ma.Id as IdMateria from AlumnoMaterias am 
    inner join MateriaDivision md on md.Id = am.IdMateriaDivision
    inner join PlanEstudioMateria pem on pem.Id = md.IdPlanEstudioMateria
    inner join Materia ma on ma.Id = pem.IdMateria
    where ma.Id = ? and am.IdEstadoAcademico = ?`,
      [IdMateria, EstadosAlumnoMateria.CursadaAprobada]
    );

    if (alumnoMaterias.length == 0) {
      return res.status(400).json({
        msg: "El alumno no puede inscribirse a esta materia",
      });
    }

    const IdAlumnoMateria = alumnoMaterias[0].Id || -1;

    await db.insert<ExamenFinalAlumno>("ExamenFinalAlumno", {
      IdExamenFinal,
      IdAlumnoMateria,
      Nota: -1,
    });

    var usuarios = await db.query<Usuario>(
      "SELECT * FROM Usuarios WHERE Id = ?",
      [alumnoMaterias[0].IdAlumno]
    );
    var usuariosMails = usuarios.map(({ Mail }) => Mail as string);

    var materia = await db.selectOne<Materia>("Materia", {
      Id: alumnoMaterias[0].IdMateria,
    });
    var examenFinal = await db.selectOne<ExamenFinal>("ExamenFinal", {
      Id: IdExamenFinal,
    });

    await mandarMail(
      usuariosMails,
      "FUISTE INSCRIPTO A UN FINAL",
      "Se te inscribio correctamente a un final de " +
        materia.Descripcion +
        " el dia: " +
        examenFinal.Fecha,
      ""
    );

    return res.json({
      msg: "La inscripcion se a realizado con exito",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}
