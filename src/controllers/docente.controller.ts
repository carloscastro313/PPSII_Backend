import e, { Request, Response } from "express";
import { body } from "express-validator";
import { MySQL2Extended } from "mysql2-extended";
import { errorMsg } from "../const/errors";
import getInstanceDB from "../database";
import { EstadosAlumnoMateria } from "../enums/estadoAlumnoMateria";
import { EstadosAlumnoCarrera } from "../enums/estadosAlumnoCarrera";
import { mapFranjaHoraria } from "../enums/franjaHoraria";
import { TiposUsuario } from "../enums/tiposUsuario";
import { mapTurno } from "../enums/turnos";
import { getTokenId } from "../helpers/jwt";
import mandarMail from "../helpers/mailer";
import AlumnoMaterias from "../interface/AlumnoMaterias";
import Cronograma from "../interface/Cronograma";
import DocenteMaterias from "../interface/DocenteMaterias";
import ExamenFinal from "../interface/ExamenFinal";
import ExamenFinalAlumno from "../interface/ExamenFinalAlumno";
import Materia from "../interface/Materia";
import MateriaDivision from "../interface/MateriaDivision";
import PlanEstudioMateria from "../interface/PlanEstudioMateria";
import Usuario from "../interface/Usuario";

export async function getDocentes(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const db = await getInstanceDB();

    const docentesUsuarios = await db.select<Usuario>("Usuarios", {
      TipoUsuario: TiposUsuario.Docente,
    });

    return res.json(docentesUsuarios);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function getMateriasDivisionDocente(
  req: Request,
  res: Response
): Promise<Response> {
  const idUsuario = req.params.idUsuario;
  var materiasDivision = [];

  try {
    const db = await getInstanceDB();

    var docenteMaterias = await db.select<DocenteMaterias>("DocenteMaterias", {
      IdDocente: idUsuario,
    });

    for (let i = 0; i < docenteMaterias.length; i++) {
      var materiaDivision = await db.selectOne<MateriaDivision>(
        "MateriaDivision",
        { Id: docenteMaterias[i].IdMateriaDivision }
      );
      var planEstudioMateria = await db.selectOne<PlanEstudioMateria>(
        "PlanEstudioMateria",
        { Id: materiaDivision.IdPlanEstudioMateria }
      );
      var materia = await db.selectOne<Materia>("Materia", {
        Id: planEstudioMateria.IdMateria,
      });
      var cronograma = await db.selectOne<Cronograma>("Cronograma", {
        Id: materiaDivision.IdCronograma,
      });

      var turno = mapTurno(cronograma.IdTurno);
      var franjaHoraria = mapFranjaHoraria(cronograma.IdFranjaHoraria);

      materiasDivision.push({
        IdMateria: materia.Id,
        IdMateriaDivision: materiaDivision.Id,
        Materia: materia.Descripcion,
        Cuatrimestre: planEstudioMateria.Cuatrimestre,
        Division: materiaDivision.Division,
        IdCronograma: cronograma.Id,
        Dia: cronograma.Dia,
        Turno: turno,
        FranjaHoraria: franjaHoraria,
      });
    }

    return res.json(materiasDivision);
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

    var materiaDivision = await db.selectOne<MateriaDivision>(
      "MateriaDivision",
      { Id: idMateriaDivision }
    );
    var alumnosMateriaDivision = await db.select<AlumnoMaterias>(
      "AlumnoMaterias",
      { IdMateriaDivision: materiaDivision.Id }
    );

    for (let i = 0; i < alumnosMateriaDivision.length; i++) {
      if (
        alumnosMateriaDivision[i].IdEstadoAcademico ==
        EstadosAlumnoMateria.CursadaRegular
      ) {
        var alumnoActual = await db.selectOne<Usuario>("Usuarios", {
          Id: alumnosMateriaDivision[i].IdAlumno,
        });

        alumnos.push({
          Nombre: alumnoActual.Nombre,
          Apellido: alumnoActual.Apellido,
          Mail: alumnoActual.Mail,
          DNI: alumnoActual.DNI,
          AlumnoMateriaDivision: alumnosMateriaDivision[i],
        });
      }
    }

    return res.json(alumnos);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function agregarNotasAAlumno(
  req: Request,
  res: Response
): Promise<Response> {
  var idAlumnoMateria = req.body.idAlumnoMateria;
  var notas = req.body.notas;
  var aprobarCursada = req.body.aprobarCursada;

  try {
    const db = await getInstanceDB();

    var alumnoMateria = await db.selectOne<AlumnoMaterias>("AlumnoMaterias", {
      Id: idAlumnoMateria,
    });

    if (
      alumnoMateria.IdEstadoAcademico == EstadosAlumnoMateria.MateriaAprobada ||
      alumnoMateria.IdEstadoAcademico == EstadosAlumnoMateria.NoCursada ||
      alumnoMateria.IdEstadoAcademico == EstadosAlumnoMateria.MateriaDesaprobada
    ) {
      return res.status(400).json({
        msg: errorMsg.ERROR_NO_SE_PUEDE_MODIFICAR_NOTAS_ALUMNO,
      });
    }

    alumnoMateria.NotaPrimerParcial = notas.NotaPrimerParcial;
    alumnoMateria.NotaSegundoParcial = notas.NotaSegundoParcial;
    alumnoMateria.NotaRecuperatorioPrimerParcial =
      notas.NotaRecuperatorioPrimerParcial;
    alumnoMateria.NotaRecuperatorioSegundoParcial =
      notas.NotaRecuperatorioSegundoParcial;
    alumnoMateria.NotaRecuperatorioPrimerParcial2 =
      notas.NotaRecuperatorioPrimerParcial2;
    alumnoMateria.NotaRecuperatorioSegundoParcial2 =
      notas.NotaRecuperatorioSegundoParcial2;

    alumnoMateria.IdEstadoAcademico =
      estadoAlumnoMateriaSegunNotas(alumnoMateria,aprobarCursada);

    if (
      alumnoMateria.IdEstadoAcademico == EstadosAlumnoMateria.MateriaAprobada ||
      alumnoMateria.IdEstadoAcademico == EstadosAlumnoMateria.MateriaDesaprobada
    ) {
      alumnoMateria.NotaFinal = notaFinalAlumnoMateriaSegunNotas(alumnoMateria);
    }

    await db.update<AlumnoMaterias>("AlumnoMaterias", alumnoMateria, {
      Id: alumnoMateria.Id,
    });

    var usuario = await db.query<Usuario>(
      "SELECT * FROM Usuarios WHERE Id = ?",
      [alumnoMateria.IdAlumno]
    );
    var usuariosMails = usuario.map(({ Mail }) => Mail as string);

    var materiaDivision = await db.selectOne<MateriaDivision>(
      "MateriaDivision",
      { Id: alumnoMateria.IdMateriaDivision }
    );
    var planEstudioMateria = await db.selectOne<PlanEstudioMateria>(
      "PlanEstudioMateria",
      { Id: materiaDivision.IdPlanEstudioMateria }
    );
    var materia = await db.selectOne<Materia>("materia", {
      Id: planEstudioMateria.IdMateria,
    });

    await mandarMail(
      usuariosMails,
      "ACTUALIZACION DE NOTAS",
      "Se actualizaron tus notas para la materia: " + materia.Descripcion,
      ""
    );

    return res.json("Notas actualizadas correctamente");
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function agregarNotaFinalAAlumno(
  req: Request,
  res: Response
): Promise<Response> {

  var idExamenFinalAlumno = req.body.idExamenFinalAlumno;
  var idAlumnoMateria = req.body.idAlumnoMateria;
  var nota = req.body.nota;

  var date = new Date();

  try {
    const db = await getInstanceDB();

    var examenFinalAlumno = await db.selectOne<ExamenFinalAlumno>(
      "ExamenFinalAlumno",
      { Id: idExamenFinalAlumno }
    );
    var examenFinal = await db.selectOne<ExamenFinal>("ExamenFinal", {
      Id: examenFinalAlumno.IdExamenFinal,
    });

    if (
      date.getUTCFullYear() === examenFinal.Fecha.getUTCFullYear() &&
      date.getUTCMonth() === examenFinal.Fecha.getUTCMonth() &&
      date.getUTCDate() === examenFinal.Fecha.getUTCDate()
    ) {
      await db.update<ExamenFinalAlumno>(
        "ExamenFinalAlumno",
        { Nota: nota },
        { Id: idExamenFinalAlumno }
      );
      if (nota >= 4) {
        await db.update<AlumnoMaterias>(
          "AlumnoMateria",
          { IdEstadoAcademico: EstadosAlumnoMateria.MateriaAprobada },
          { Id: idAlumnoMateria }
        );
      }
    } else {
      return res.status(400).json({
        msg: errorMsg.ERROR_DOCENTE_YA_NO_PUEDE_CALIFICAR_FINAL,
      });
    }

    var alumnoMateria = await db.selectOne<AlumnoMaterias>("AlumnoMaterias", {
      Id: idAlumnoMateria,
    });

    var usuario = await db.query<Usuario>(
      "SELECT * FROM Usuarios WHERE Id = ?",
      [alumnoMateria.IdAlumno]
    );
    var usuariosMails = usuario.map(({ Mail }) => Mail as string);

    var materiaDivision = await db.selectOne<MateriaDivision>(
      "MateriaDivision",
      { Id: alumnoMateria.IdMateriaDivision }
    );
    var planEstudioMateria = await db.selectOne<PlanEstudioMateria>(
      "PlanEstudioMateria",
      { Id: materiaDivision.IdPlanEstudioMateria }
    );
    var materia = await db.selectOne<Materia>("materia", {
      Id: planEstudioMateria.IdMateria,
    });

    await mandarMail(
      usuariosMails,
      "NOTA DE FINAL",
      "Te corrigieron el final de la materia " + materia.Descripcion,
      ""
    );

    return res.json({
      msg: "Nota de final actualizada correctamente",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function desaprobarAlumno(req: Request,res: Response): Promise<Response> {
    try{
        var idAlumnoMateria = req.body.idAlumnoMateria;

        const db = await getInstanceDB();

        await db.update<AlumnoMaterias>("AlumnoMaterias",{IdEstadoAcademico: EstadosAlumnoMateria.MateriaDesaprobada},{Id: idAlumnoMateria});

        return res.json({
            msg: "Alumno desaprobado correctamente.",
          });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: errorMsg.ERROR_INESPERADO,
        });
    }
}

function estadoAlumnoMateriaSegunNotas(alumnoMateria: AlumnoMaterias,aprobarCursada: boolean): number {
  var cantPrimero = 0;
  var cantSegundo = 0;

  var primerParcial: number[] = [
    alumnoMateria.NotaPrimerParcial,
    alumnoMateria.NotaRecuperatorioPrimerParcial,
    alumnoMateria.NotaRecuperatorioPrimerParcial2,
  ];

  var segundoParcial: number[] = [
    alumnoMateria.NotaSegundoParcial,
    alumnoMateria.NotaRecuperatorioSegundoParcial,
    alumnoMateria.NotaRecuperatorioSegundoParcial2,
  ];

  var notaMasAltaPrimerParcial = 0;
  var notaMasAltaSegundoParcial = 0;

  for (let i = 0; i < primerParcial.length; i++) {
    if (primerParcial[i] >= notaMasAltaPrimerParcial) {
      notaMasAltaPrimerParcial = primerParcial[i];
    }
    if (primerParcial[i] > 0) {
      cantPrimero++;
    }
  }

  for (let i = 0; i < segundoParcial.length; i++) {
    if (segundoParcial[i] >= notaMasAltaSegundoParcial) {
      notaMasAltaSegundoParcial = segundoParcial[i];
    }

    if (segundoParcial[i] > 0) {
      cantSegundo++;
    }
  }

  if (notaMasAltaPrimerParcial == 0 || notaMasAltaSegundoParcial == 0) {
    return EstadosAlumnoMateria.CursadaRegular;
  }

  if (
    notaMasAltaPrimerParcial < 4 &&
    cantPrimero === 3 &&
    notaMasAltaSegundoParcial < 4 &&
    cantSegundo === 3
  ) {
    return EstadosAlumnoMateria.MateriaDesaprobada;
  }

  if ((notaMasAltaPrimerParcial >= 4 &&
    notaMasAltaPrimerParcial < 6 &&
    notaMasAltaSegundoParcial >= 4 &&
    notaMasAltaSegundoParcial < 6) && aprobarCursada) {
    return EstadosAlumnoMateria.CursadaAprobada;
  }

  if (notaMasAltaPrimerParcial >= 6 && notaMasAltaSegundoParcial >= 6) {
    return EstadosAlumnoMateria.MateriaAprobada;
  }

  return EstadosAlumnoMateria.CursadaRegular;
}

function notaFinalAlumnoMateriaSegunNotas(
  alumnoMateria: AlumnoMaterias
): number {
  var response = 0;

  var primerParcial: number[] = [
    alumnoMateria.NotaPrimerParcial,
    alumnoMateria.NotaRecuperatorioPrimerParcial,
    alumnoMateria.NotaRecuperatorioPrimerParcial2,
  ];

  var segundoParcial: number[] = [
    alumnoMateria.NotaSegundoParcial,
    alumnoMateria.NotaRecuperatorioSegundoParcial,
    alumnoMateria.NotaRecuperatorioSegundoParcial2,
  ];

  var notaMasAltaPrimerParcial = 0;
  var notaMasAltaSegundoParcial = 0;

  for (let i = 0; i < primerParcial.length; i++) {
    if (primerParcial[i] >= notaMasAltaPrimerParcial) {
      notaMasAltaPrimerParcial = primerParcial[i];
    }
  }

  for (let i = 0; i < segundoParcial.length; i++) {
    if (segundoParcial[i] >= notaMasAltaSegundoParcial) {
      notaMasAltaSegundoParcial = segundoParcial[i];
    }
  }

  return (notaMasAltaPrimerParcial * notaMasAltaSegundoParcial) / 2;
}

export async function getFinalDocente(req: Request, res: Response) {
  const { anio, mes } = req.query;
  const bearerToken = req.header("authorization") as string;
  const { id } = getTokenId(bearerToken);

  try {
    const db = await getInstanceDB();

    const listaExamen = await db.query(
      "select ef.Id as Id, ma.Descripcion as Descripcion, tu.Descripcion as Turno, fh.Descripcion as FranjaHoraria, ef.Fecha as Fecha from DocenteMaterias dm inner join ExamenFinal ef on ef.IdDocenteMaterias = dm.Id inner join MateriaDivision md on md.Id = dm.IdMateriaDivision inner join PlanEstudioMateria pem on pem.Id = md.IdPlanEstudioMateria inner join Materia ma on ma.Id = pem.IdMateria inner join Cronograma cr on ef.IdCronograma = cr.Id inner join Turno tu on tu.Id = cr.IdTurno inner join FranjaHoraria fh on fh.Id = cr.IdFranjaHoraria where dm.IdDocente = ? and YEAR(ef.Fecha) = ? and MONTH(ef.Fecha) = ?",
      [id, anio, mes]
    );

    return res.json(listaExamen);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function getFinalAlumno(req: Request, res: Response) {
  const idExamenFinal = req.params.idExamenFinal;

  try {
    const db = await getInstanceDB();

    const listaAlumnos = await db.query(
      "select efa.Id as IdExamenFinalAlumno, am.Id as IdAlumnoMaterias, us.Nombre as Nombre, us.Apellido as Apellido from ExamenFinalAlumno efa inner join AlumnoMaterias am on am.Id = efa.IdAlumnoMateria inner join usuarios us on us.Id = am.IdAlumno where efa.Id = ?",
      [idExamenFinal]
    );

    return res.json(listaAlumnos);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}
