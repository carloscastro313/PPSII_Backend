import { Request, Response } from "express";
import { BindValue } from "mysql2-extended";
import { ListFormat } from "typescript";
import { errorMsg } from "../const/errors";
import getInstanceDB from "../database";
import { FranjasHorarias, mapFranjaHoraria } from "../enums/franjaHoraria";
import { TiposUsuario } from "../enums/tiposUsuario";
import { mapTurno, Turnos } from "../enums/turnos";
import List from "../helpers/list";
import Carrera from "../interface/Carrera";
import Correlativa from "../interface/Correlativa";
import Cronograma from "../interface/Cronograma";
import FranjaHoraria from "../interface/FranjaHoraria";
import MateriaDivision from "../interface/MateriaDivision";
import Materia from "../interface/Materia";
import PlanEstudio from "../interface/PlanEstudio";
import PlanEstudioMateria from "../interface/PlanEstudioMateria";
import TipoInstanciaInscripcion from "../interface/TipoInstanciaInscripcion";
import Turno from "../interface/Turno";
import Usuario from "../interface/Usuario";
import DocenteMaterias from "../interface/DocenteMaterias";
import ExamenFinal from "../interface/ExamenFinal";
import InstanciaInscripcion from "../interface/InstanciaInscripcion";

export async function getAdministraciones(
  req: Request,
  res: Response
): Promise<Response> {
  const db = await getInstanceDB();

  const administraciones = await db.select<Usuario>("Usuarios", {
    TipoUsuario: TiposUsuario.Administracion,
  });

  return res.json(administraciones);
}

export async function getInstanciaInscripcionActivas(
  req: Request,
  res: Response
): Promise<Response> {
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

export async function getTipoInstanciaInscripciones(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const db = await getInstanceDB();

    const tipoInstanciasInscripcion = await db.select<TipoInstanciaInscripcion>(
      "TipoInstanciaInscripcion"
    );

    return res.json(tipoInstanciasInscripcion);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function createInstanciaInscripcion(
  req: Request,
  res: Response
): Promise<Response> {
  const newInstanciaInscripcion = req.body;

  try {
    const db = await getInstanceDB();

    const now = new Date();

    var values: BindValue[] = new Array(3);
    values[0] = now.toISOString();
    values[1] = now.toISOString();
    values[2] = newInstanciaInscripcion.IdTipo.toString();

    console.log(values);

    const instanciaInscripciones = await db.query(
      "SELECT * FROM InstanciaInscripcion WHERE FechaInicio <= ? AND FechaFinal >= ? AND IdTipo = ?",
      values
    );

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

export async function createCarrera(
  req: Request,
  res: Response
): Promise<Response> {
  const newCarrera = req.body;

  try {
    const db = await getInstanceDB();

    const carreras = await db.query(
      "SELECT * FROM Carrera WHERE Descripcion = ?",
      newCarrera.Descripcion
    );

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

export async function updateCarrera(
  req: Request,
  res: Response
): Promise<Response> {
  const newCarrera = req.body;

  try {
    const db = await getInstanceDB();

    await db.update<Carrera>(
      "Carrera",
      { ...newCarrera },
      { Id: newCarrera.Id }
    );

    return res.json(newCarrera);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function getCarreras(
  req: Request,
  res: Response
): Promise<Response> {
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

export async function createPlanEstudio(
  req: Request,
  res: Response
): Promise<Response> {
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

      await t.update<PlanEstudio>(
        "PlanEstudio",
        { ...newPlanEstudio, FechaCreacion: now },
        { Id: idPlan }
      );

      await t.update<Carrera>(
        "Carrera",
        { PlanActual: newPlanEstudio.Nombre },
        { Id: newPlanEstudio.IdCarrera }
      );

      for (let i = 0; i < materias.length; i++) {
        var planEstudioMateria: PlanEstudioMateria = {
          IdPlan: idPlan,
          IdMateria: materias[i].IdMateria,
          Cuatrimestre: materias[i].Cuatrimestre,
        };

        await t.insert<PlanEstudioMateria>("PlanEstudioMateria", {
          ...planEstudioMateria,
        });
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

export async function createMateriasDivision(
  req: Request,
  res: Response
): Promise<Response> {
  var materiasDivision = req.body.materiasDivision;
  var cronogramasModificados = req.body.cronogramasModificados;
  try {
    const db = await getInstanceDB();

    console.log(materiasDivision);

    await db.transaction(async (t) => {
      //CREACION DE MATERIASDIVISION
      for (let i = 0; i < materiasDivision.length; i++) {
        var cronograma: Cronograma = {
          IdFranjaHoraria: materiasDivision[i].IdFranjaHoraria,
          IdTurno: materiasDivision[i].IdTurno,
          Dia: materiasDivision[i].Dia,
        };

        await t.insert<Cronograma>("Cronograma", {
          ...cronograma,
        });

        var IdCronograma = await t.getLastInsertId();

        var materiaDivision: MateriaDivision = {
          IdCronograma: IdCronograma,
          IdPlanEstudioMateria: materiasDivision[i].IdPlanEstudioMateria,
          Division: materiasDivision[i].Division,
        };

        await t.insert<MateriaDivision>("MateriaDivision", {
          ...materiaDivision,
        });
      }
      //ACTUALIZACION DE CRONOGRAMAS MODIFICADOS
      for (let j = 0; j < cronogramasModificados.length; j++) {
        var cronogramaMod: Cronograma = {
          IdFranjaHoraria: cronogramasModificados[j].IdFranjaHoraria,
          IdTurno: cronogramasModificados[j].IdTurno,
          Dia: cronogramasModificados[j].Dia,
        };

        await t.update<Cronograma>(
          "Cronograma",
          {
            IdFranjaHoraria: cronogramaMod.IdFranjaHoraria,
            IdTurno: cronogramaMod.IdTurno,
            Dia: cronogramaMod.Dia,
          },
          { Id: cronogramasModificados[j].Id }
        );
      }
    });

    return res.json({
      msg: "Divisiones de materias y cronogramas asignados correctamente",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function getPlanesEstudio(
  req: Request,
  res: Response
): Promise<Response> {
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

export async function getPlanesEstudioById(
  req: Request,
  res: Response
): Promise<Response> {
  const nombrePlan = req.params.idPlan;
  try {
    const db = await getInstanceDB();

    var [planEstudio] = await db.select<PlanEstudio>(
      "PlanEstudio",
      { Nombre: nombrePlan },
      { limit: 1 }
    );

    var planEstudioMateria = await db.select<PlanEstudioMateria>(
      "PlanEstudioMateria",
      { IdPlan: planEstudio.Id }
    );

    console.log(planEstudioMateria);

    var materiasDivision = [];

    for (let i = 0; i < planEstudioMateria.length; i++) {
      var materiaDiv = [];

      materiaDiv = await db.select<MateriaDivision>("MateriaDivision", {
        IdPlanEstudioMateria: planEstudioMateria[i].Id,
      });

      console.log(materiaDiv);

      var materia: Materia = await db.selectOne<Materia>("Materia", {
        Id: planEstudioMateria[i].IdMateria,
      });

      for (let j = 0; j < materiaDiv.length; j++) {
        var cronograma: Cronograma = await db.selectOne<Cronograma>(
          "Cronograma",
          {
            Id: materiaDiv[j].IdCronograma,
          }
        );

        var turno = mapTurno(cronograma.IdTurno);
        var franjaHoraria = mapFranjaHoraria(cronograma.IdFranjaHoraria);

        materiasDivision.push({
          MateriaDivision: materiaDiv[j],
          IdMateria: materia.Id,
          IdPlanEstudioMateria: planEstudioMateria[i].Id,
          Descripcion: materia.Descripcion,
          Cuatrimestre: planEstudioMateria[i].Cuatrimestre,
          IdCronograma: cronograma.Id,
          Turno: turno,
          IdTurno: cronograma.IdTurno,
          FranjaHoraria: franjaHoraria,
          IdFranjaHoraria: cronograma.IdFranjaHoraria,
          Dia: cronograma.Dia,
        });
      }
    }

    return res.json({ planEstudio, materiasDivision });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function getPlanesEstudioByIdMaterias(
  req: Request,
  res: Response
): Promise<Response> {
  const nombrePlan = req.params.idPlan;
  try {
    const db = await getInstanceDB();

    var [planEstudio] = await db.select<PlanEstudio>(
      "PlanEstudio",
      { Nombre: nombrePlan },
      { limit: 1 }
    );

    var planEstudioMateria = await db.select<PlanEstudioMateria>(
      "PlanEstudioMateria",
      { IdPlan: planEstudio.Id }
    );

    var materias = [];

    for (let i = 0; i < planEstudioMateria.length; i++) {
      var materia: Materia = await db.selectOne<Materia>("Materia", {
        Id: planEstudioMateria[i].IdMateria,
      });

      materias.push({
        ...materia,
        IdPlanEstudioMateria: planEstudioMateria[i].Id,
        cuatrimestre: planEstudioMateria[i].Cuatrimestre,
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

export async function getPlanesEstudioByCarreraId(
  req: Request,
  res: Response
): Promise<Response> {
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

export async function createMateria(
  req: Request,
  res: Response
): Promise<Response> {
  const newMateria = req.body.materia;
  const correlativas = req.body.correlativas;

  var idMateria = 0;

  try {
    const db = await getInstanceDB();

    const materias = await db.query(
      "SELECT * FROM Materia WHERE Descripcion = ?",
      newMateria.Descripcion
    );

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

export async function updateMateria(
  req: Request,
  res: Response
): Promise<Response> {
  const newMateria = req.body.materia;
  const correlativas = req.body.correlativas;

  try {
    const db = await getInstanceDB();

    const materias = await db.query(
      "SELECT * FROM Materia WHERE Id = ?",
      newMateria.Id
    );

    if (materias.length == 0) {
      return res.status(400).json({
        msg: errorMsg.ERROR_MATERIA_NO_EXISTE,
      });
    }

    await db.transaction(async (t) => {
      await t.update<Materia>(
        "Materia",
        { Descripcion: newMateria.Descripcion },
        { Id: newMateria.Id }
      );

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

export async function getMaterias(
  req: Request,
  res: Response
): Promise<Response> {
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

export async function getMateriaById(
  req: Request,
  res: Response
): Promise<Response> {
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

export async function getTurnos(
  req: Request,
  res: Response
): Promise<Response> {
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

export async function getFranjaHoraria(
  req: Request,
  res: Response
): Promise<Response> {
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

export async function asignarDocenteAMateria(req: Request,res: Response): Promise<Response>{
  try{
    const db = await getInstanceDB();

    var idDocente = req.body.idDocente;
    var idMateriaDivision = req.body.idMateriaDivision;

    var materiaDivisionActual = await db.selectOne<MateriaDivision>("MateriaDivision",{Id: idMateriaDivision});
    var cronogramaMateriaDivisionActual = await db.selectOne<Cronograma>("Cronograma",{Id: materiaDivisionActual.IdCronograma});
    var docenteMaterias = await db.select<DocenteMaterias>("DocenteMaterias",{IdDocente: idDocente});

    for (let i = 0; i < docenteMaterias.length; i++) {

      var materiasDivisionDocente = await db.selectOne<MateriaDivision>("MateriaDivision",{Id: docenteMaterias[i].IdMateriaDivision});
      var cronogramaParaMateria = await db.selectOne<Cronograma>("Cronograma",{Id: materiasDivisionDocente.IdCronograma});

      if(!franjaHorariaValida(cronogramaMateriaDivisionActual, cronogramaParaMateria))
      {
        return res.status(400).json({
          msg: errorMsg.ERROR_DOCENTE_NO_DISPONIBLE_EN_CRONOGRAMA
        });
      }
    }

    var docenteConMismaDivision = await db.select<DocenteMaterias>("DocenteMaterias",{IdMateriaDivision: idMateriaDivision});
    
    //MODIFICAR DOCENTE DE MATERIA
    if(docenteConMismaDivision.length != 0){
      await db.delete<DocenteMaterias>("DocenteMaterias",{IdMateriaDivision: idMateriaDivision});
    }

    var newDocenteMateria : DocenteMaterias = { IdDocente : idDocente, IdMateriaDivision: idMateriaDivision}

    await db.insert<DocenteMaterias>("DocenteMaterias",newDocenteMateria);

    return res.json({
      msg: "Docente asignado a la materia de la division correctamente"
    });
  }catch(error){
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

function franjaHorariaValida(cronogramaActual : Cronograma, cronogramaDocente : Cronograma){

  if(cronogramaActual.Dia != cronogramaDocente.Dia || cronogramaActual.IdTurno != cronogramaDocente.IdTurno)
    return true;

  if(cronogramaActual.IdFranjaHoraria == FranjasHorarias.BloqueCompleto || cronogramaDocente.IdFranjaHoraria == FranjasHorarias.BloqueCompleto ||  cronogramaActual.IdFranjaHoraria == cronogramaDocente.IdFranjaHoraria)
    return false;

  return true;
}


export async function getCronogramaDocente(
  req: Request,
  res: Response
): Promise<Response> {
  const nombrePlan = req.params.idPlan;
  try {
    const db = await getInstanceDB();

    var [planEstudio] = await db.select<PlanEstudio>(
      "PlanEstudio",
      { Nombre: nombrePlan },
      { limit: 1 }
    );

    var planEstudioMateria = await db.select<PlanEstudioMateria>(
      "PlanEstudioMateria",
      { IdPlan: planEstudio.Id }
    );

    console.log(planEstudioMateria);

    var materiasDivision = [];

    for (let i = 0; i < planEstudioMateria.length; i++) {
      var materiaDiv = [];

      materiaDiv = await db.select<MateriaDivision>("MateriaDivision", {
        IdPlanEstudioMateria: planEstudioMateria[i].Id,
      });

      console.log(materiaDiv);

      var materia: Materia = await db.selectOne<Materia>("Materia", {
        Id: planEstudioMateria[i].IdMateria,
      });

      for (let j = 0; j < materiaDiv.length; j++) {
        var cronograma: Cronograma = await db.selectOne<Cronograma>(
          "Cronograma",
          {
            Id: materiaDiv[j].IdCronograma,
          }
        );
          var Docente = null;
        const id = materiaDiv[j].Id || -1;
        
        var resultDocente = await db.query("select * from DocenteMaterias dm inner join usuarios u on u.Id = dm.IdDocente where dm.IdMateriaDivision = ? limit 1",[id]);

        if(resultDocente.length > 0)
          Docente = resultDocente[0];

        var turno = mapTurno(cronograma.IdTurno);
        var franjaHoraria = mapFranjaHoraria(cronograma.IdFranjaHoraria);

        materiasDivision.push({
          MateriaDivision: materiaDiv[j],
          IdMateria: materia.Id,
          IdPlanEstudioMateria: planEstudioMateria[i].Id,
          Descripcion: materia.Descripcion,
          Cuatrimestre: planEstudioMateria[i].Cuatrimestre,
          IdCronograma: cronograma.Id,
          Turno: turno,
          IdTurno: cronograma.IdTurno,
          FranjaHoraria: franjaHoraria,
          IdFranjaHoraria: cronograma.IdFranjaHoraria,
          Dia: cronograma.Dia,
          Docente
        });
      }
    }

    return res.json({ planEstudio, materiasDivision });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}


export async function createInstanciaFinal(
  req: Request,
  res: Response
): Promise<Response> {
  const newInstanciaInscripcion = req.body.newInstanciaInscripcion;
  const fechaInicioPrimera = req.body.primeraSemana;
  const fechaInicioSegunda = req.body.segundaSemana;

  const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  try {
    const db = await getInstanceDB();

    const now = new Date();

    const instanciaInscripciones = await db.query(
      "SELECT * FROM InstanciaInscripcion WHERE FechaInicio <= ? AND FechaFinal >= ? AND IdTipo = ?",
      [now.toISOString(),now.toISOString(),newInstanciaInscripcion.IdTipo.toString()]
    );

    if (instanciaInscripciones.length != 0) {
      return res.status(400).json({
        msg: errorMsg.ERROR_INSTANCIA_ACTIVA,
      });
    }

    await db.insert("InstanciaInscripcion", { ...newInstanciaInscripcion });

    const divisionDocente = await db.query("select cr.Id as IdCronograma, dm.Id as IdDocenteMaterias, cr.Dia as Dia from MateriaDivision md inner join DocenteMaterias dm on md.Id = dm.IdMateriaDivision inner join Cronograma cr on cr.Id = md.IdCronograma");

    const fecha1 = new Date(fechaInicioPrimera);
    const fecha2 = new Date(fechaInicioSegunda);

    const primeraSemana = getFechas(fecha1);
    const segundaSemana = getFechas(fecha2);

    let finales: any[]= [];

    finales = [...finales, generarExamenFinal(divisionDocente, primeraSemana)];
    finales = [...finales, generarExamenFinal(divisionDocente, segundaSemana)];

    for (let i = 0; i < finales.length; i++) {
      await db.insert<ExamenFinal>("ExamenFinal",finales[i]);
    }

    return res.json({newInstanciaInscripcion, finales});
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}


function getFechas(fecha: Date){
  const fechas = [];
  const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  
  for (let i = 0; i < 7; i++) {
    const aux = new Date(fecha);
    aux.setDate(aux.getDate() + i);

    if(weekday[aux.getUTCDay()] != "Sunday")
      fechas.push(aux)
  }

  return fechas;
}

function generarExamenFinal(divisiones: any[], arrFecha: Date[]){
  let arr: any[] = [];
  const weekday = ["Domingo","Lunes","Martes","Miercoles","Jueves","Viernes","Sabado"];

  for (let i = 0; i < arrFecha.length; i++) {
    let strAux = weekday[arrFecha[i].getUTCDay()];
    
    const arrDivisiones = divisiones.filter((value : any) => value.Dia === strAux);

    arr = [...arr, ...arrDivisiones.map((value: any) =>{ return {IdCronograma: value.IdCronograma, IdDocenteMaterias: value.IdDocenteMaterias, Fecha: `${arrFecha[i].getUTCFullYear()}-${arrFecha[i].getUTCMonth()}-${arrFecha[i].getUTCDate()} 00:00:00.000`}})]
  }

  return arr;
}