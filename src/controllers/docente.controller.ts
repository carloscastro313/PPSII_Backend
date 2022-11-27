import { Request, Response } from 'express'
import { body } from 'express-validator';
import { MySQL2Extended } from 'mysql2-extended';
import { errorMsg } from '../const/errors';
import getInstanceDB  from '../database'
import { EstadosAlumnoMateria } from '../enums/estadoAlumnoMateria';
import { EstadosAlumnoCarrera } from '../enums/estadosAlumnoCarrera';
import { mapFranjaHoraria } from '../enums/franjaHoraria';
import { TiposUsuario } from '../enums/tiposUsuario';
import { mapTurno } from '../enums/turnos';
import AlumnoMaterias from '../interface/AlumnoMaterias';
import Cronograma from '../interface/Cronograma';
import DocenteMaterias from '../interface/DocenteMaterias';
import ExamenFinal from '../interface/ExamenFinal';
import Materia from '../interface/Materia';
import MateriaDivision from '../interface/MateriaDivision';
import PlanEstudioMateria from '../interface/PlanEstudioMateria';
import Usuario from '../interface/Usuario'

export async function getDocentes(req: Request, res: Response): Promise<Response>{
    try{
        const db = await getInstanceDB();

        const docentesUsuarios = await db.select<Usuario>("Usuarios",{TipoUsuario: TiposUsuario.Docente});

        return res.json(docentesUsuarios);
    }catch(error){
        console.log(error);
        return res.status(500).json({
          msg: errorMsg.ERROR_INESPERADO,
        });
    }

}

export async function getMateriasDivisionDocente(req: Request, res: Response): Promise<Response>{
    const idUsuario = req.params.idUsuario;
    var materiasDivision = [];

    try{
        const db = await getInstanceDB();

        var docenteMaterias = await db.select<DocenteMaterias>("DocenteMaterias",{IdDocente: idUsuario});

        for (let i = 0; i < docenteMaterias.length; i++) {

            var materiaDivision = await db.selectOne<MateriaDivision>("MateriaDivision",{Id: docenteMaterias[i].IdMateriaDivision});
            var planEstudioMateria = await db.selectOne<PlanEstudioMateria>("PlanEstudioMateria",{Id: materiaDivision.IdPlanEstudioMateria});
            var materia = await db.selectOne<Materia>("Materia",{Id:planEstudioMateria.IdMateria});
            var cronograma = await db.selectOne<Cronograma>("Cronograma",{Id: materiaDivision.IdCronograma});
            
            var turno = mapTurno(cronograma.IdTurno);
            var franjaHoraria = mapFranjaHoraria(cronograma.IdFranjaHoraria);

            materiasDivision.push({
                IdMateria: materia.Id,
                Materia: materia.Descripcion,
                Cuatrimestre: planEstudioMateria.Cuatrimestre,
                Division: materiaDivision.Division,
                IdCronograma:cronograma.Id,
                Dia: cronograma.Dia,
                Turno: turno,
                FranjaHoraria: franjaHoraria,
            });
        }

        return res.json(materiasDivision);
    }catch(error){
        console.log(error);
        return res.status(500).json({
          msg: errorMsg.ERROR_INESPERADO,
        });
    }
}

export async function agregarNotasAAlumno(req: Request, res: Response): Promise<Response>{

    var idAlumnoMateria = req.body.idAlumnoMateria;
    var notas = req.body.notas;

    try{
        const db = await getInstanceDB();

        var alumnoMateria = await db.selectOne<AlumnoMaterias>("AlumnoMaterias",{Id: idAlumnoMateria});
        
        if(
            alumnoMateria.IdEstadoAcademico == EstadosAlumnoMateria.MateriaAprobada ||
            alumnoMateria.IdEstadoAcademico == EstadosAlumnoMateria.NoCursada ||
            alumnoMateria.IdEstadoAcademico == EstadosAlumnoMateria.MateriaDesaprobada
        ){
            return res.status(400).json({
                msg: errorMsg.ERROR_NO_SE_PUEDE_MODIFICAR_NOTAS_ALUMNO,
            });
        }

        alumnoMateria.NotaPrimerParcial = notas.PrimerParcial;
        alumnoMateria.NotaSegundoParcial = notas.PrimerParcial;
        alumnoMateria.NotaRecuperatorioPrimerParcial = notas.RecuperatorioPrimerParcial;
        alumnoMateria.NotaRecuperatorioSegundoParcial = notas.RecuperatorioSegundoParcial;
        alumnoMateria.NotaRecuperatorioPrimerParcial2 = notas.RecuperatorioPrimerParcial2;
        alumnoMateria.NotaRecuperatorioSegundoParcial2 = notas.RecuperatorioSegundoParcial2;

        alumnoMateria.IdEstadoAcademico = estadoAlumnoMateriaSegunNotas(alumnoMateria);

        if(
            alumnoMateria.IdEstadoAcademico == EstadosAlumnoMateria.MateriaAprobada ||
            alumnoMateria.IdEstadoAcademico == EstadosAlumnoMateria.MateriaDesaprobada
        ){
            alumnoMateria.NotaFinal = notaFinalAlumnoMateriaSegunNotas(alumnoMateria);
        }

        await db.update<AlumnoMaterias>("AlumnoMaterias", alumnoMateria, {Id: alumnoMateria.Id});

        return res.json("Notas actualizadas correctamente");
    }catch(error){
        console.log(error);
        return res.status(500).json({
          msg: errorMsg.ERROR_INESPERADO,
        });
    }
}

export async function agregarNotaFinalAAlumno(req: Request, res: Response): Promise<Response>{

    var idExamenFinal = req.body.idAlumnoMateria;
    var nota = req.body.nota;

    try{
        const db = await getInstanceDB();

        // TO DO (REPLANTEAR FINALES)

        return res.json("Nota final actualizada correctamente");
    }catch(error){
        console.log(error);
        return res.status(500).json({
          msg: errorMsg.ERROR_INESPERADO,
        });
    }
}


function estadoAlumnoMateriaSegunNotas(alumnoMateria:AlumnoMaterias) : number{
    var response = 0;

    var primerParcial : number[] = [
        alumnoMateria.NotaPrimerParcial,
        alumnoMateria.NotaRecuperatorioPrimerParcial,
        alumnoMateria.NotaRecuperatorioPrimerParcial2,
    ];

    var segundoParcial : number[] = [
        alumnoMateria.NotaSegundoParcial,
        alumnoMateria.NotaRecuperatorioSegundoParcial,
        alumnoMateria.NotaRecuperatorioSegundoParcial2,
    ]

    var notaMasAltaPrimerParcial = 0;
    var notaMasAltaSegundoParcial = 0;

    for (let i = 0; i < primerParcial.length; i++) {
        if(primerParcial[i] >= notaMasAltaPrimerParcial){
            notaMasAltaPrimerParcial = primerParcial[i];
        }
    }

    for (let i = 0; i < segundoParcial.length; i++) {
        if(segundoParcial[i] >= notaMasAltaSegundoParcial){
            notaMasAltaSegundoParcial = segundoParcial[i];
        }
    }

    if(notaMasAltaPrimerParcial == 0 || notaMasAltaSegundoParcial == 0){
        response = EstadosAlumnoMateria.CursadaRegular;
    }

    if((notaMasAltaPrimerParcial < 4 && notaMasAltaPrimerParcial != 0) || (notaMasAltaSegundoParcial < 4 && notaMasAltaSegundoParcial != 0)){
        response = EstadosAlumnoMateria.MateriaDesaprobada;
    }

    if(notaMasAltaPrimerParcial >= 4 && notaMasAltaSegundoParcial >= 4){
        response = EstadosAlumnoMateria.CursadaAprobada;
    } 

    if(notaMasAltaPrimerParcial >= 6 && notaMasAltaSegundoParcial >= 6){
        response = EstadosAlumnoMateria.MateriaAprobada;
    }

    return response;
}

function notaFinalAlumnoMateriaSegunNotas(alumnoMateria:AlumnoMaterias) : number{
    var response = 0;

    var primerParcial : number[] = [
        alumnoMateria.NotaPrimerParcial,
        alumnoMateria.NotaRecuperatorioPrimerParcial,
        alumnoMateria.NotaRecuperatorioPrimerParcial2,
    ];

    var segundoParcial : number[] = [
        alumnoMateria.NotaSegundoParcial,
        alumnoMateria.NotaRecuperatorioSegundoParcial,
        alumnoMateria.NotaRecuperatorioSegundoParcial2,
    ]

    var notaMasAltaPrimerParcial = 0;
    var notaMasAltaSegundoParcial = 0;

    for (let i = 0; i < primerParcial.length; i++) {
        if(primerParcial[i] >= notaMasAltaPrimerParcial){
            notaMasAltaPrimerParcial = primerParcial[i];
        }
    }
    
    for (let i = 0; i < segundoParcial.length; i++) {
        if(segundoParcial[i] >= notaMasAltaSegundoParcial){
            notaMasAltaSegundoParcial = segundoParcial[i];
        }
    }

    return (notaMasAltaPrimerParcial * notaMasAltaSegundoParcial)/2;
}