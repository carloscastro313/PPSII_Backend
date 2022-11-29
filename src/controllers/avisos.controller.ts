import { Request, Response } from 'express'
import { errorMsg } from '../const/errors';
import getInstanceDB  from '../database'
import { EstadosAlumnoMateria } from '../enums/estadoAlumnoMateria';
import { TiposUsuario } from '../enums/tiposUsuario';
import AlumnoMaterias from '../interface/AlumnoMaterias';
import Avisos from '../interface/Avisos';
import AvisoUsuarios from '../interface/AvisoUsuarios';
import MateriaDivision from '../interface/MateriaDivision';
import Usuario from '../interface/Usuario';

export async function getAvisos(req: Request, res: Response): Promise<Response>{
    try{
        const db = await getInstanceDB();
        const avisos = await db.select<Avisos>("Avisos");

        return res.json(avisos);
    } catch (error) {
        console.log(error);
        return res.status(500).json({
        msg: errorMsg.ERROR_INESPERADO,
        });
    }
}

export async function getAvisoById(req: Request, res: Response): Promise<Response>{
    const idAviso = req.params.idAviso;

    try{
        const db = await getInstanceDB();
        const aviso = await db.select<Avisos>("Avisos",{Id: idAviso});

        return res.json(aviso);
    } catch (error) {
        console.log(error);
        return res.status(500).json({
        msg: errorMsg.ERROR_INESPERADO,
        });
    }
}

export async function createAviso(req: Request, res: Response): Promise<Response>{
    const newAviso = req.body;
    var idAviso = 0;

    try{
        const db = await getInstanceDB();

        await db.transaction(async (t) => {
            await t.insert<Avisos>("Avisos",{...newAviso});
            idAviso = await t.getLastInsertId();

            for(let i = 0; i < newAviso.Receptores.length; i++){
                var newAvisoUsuario : AvisoUsuarios = { IdAviso: idAviso, IdUsuario: newAviso.Receptores[i], Leido: 0 }
                await t.insert<AvisoUsuarios>("AvisoUsuarios",{...newAvisoUsuario});
            }
        })
        
        return res.json(newAviso);
    } catch (error) {
        console.log(error);
        return res.status(500).json({
        msg: errorMsg.ERROR_INESPERADO,
        });
    }
}

export async function marcarLeido(req: Request, res: Response): Promise<Response>{
    const aviso = req.body;
    try{
        const db = await getInstanceDB();

        await db.update<AvisoUsuarios>("AvisoUsuarios",{ Leido: 1 },{ IdAviso: aviso.IdAviso, IdUsuario: aviso.IdUsuario});

        return res.json({msg: "Leido"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({
        msg: errorMsg.ERROR_INESPERADO,
        });
    }
}

export async function traerAvisosNoLeidosPorUsuario(req: Request, res: Response): Promise<Response>{
    const idUsuario = req.params.idUsuario;

    try{
        const db = await getInstanceDB();

        var avisos = await db.select<AvisoUsuarios>("AvisoUsuarios",{IdUsuario: idUsuario, Leido: 0});

        return res.json(avisos);
    } catch (error) {
        console.log(error);
        return res.status(500).json({
        msg: errorMsg.ERROR_INESPERADO,
        });
    }
}

export async function traerTodosLosAvisosPorUsuario(req: Request, res: Response): Promise<Response>{
    const idUsuario = req.params.idUsuario;

    try{
        const db = await getInstanceDB();

        var avisos = await db.select<AvisoUsuarios>("AvisoUsuarios",{IdUsuario: idUsuario});

        return res.json(avisos);
    } catch (error) {

        console.log(error);
        
        return res.status(500).json({
        msg: errorMsg.ERROR_INESPERADO,
        });
    }
}

export async function traerGruposDePersonas(req: Request, res: Response): Promise<Response>{
    var response = [];
    try{
        const db = await getInstanceDB();

        var administraciones = await db.select<Usuario>("Usuario",{TipoUsuario: TiposUsuario.Administracion});
        var secretarias = await db.select<Usuario>("Usuario",{TipoUsuario: TiposUsuario.Secretaria});
        var docentes = await db.select<Usuario>("Usuario",{TipoUsuario: TiposUsuario.Docente});
        var alumnos = await db.select<Usuario>("Usuario",{TipoUsuario: TiposUsuario.Alumno});

        console.log("secretarias");
        console.log(secretarias);

        var adminIds = administraciones.map(({ Id }) => Id as number);
        var secretariasIds = secretarias.map(({ Id }) => Id as number);
        var docentesIds = docentes.map(({ Id }) => Id as number);
        var todosLosAlumnosIds = alumnos.map(({ Id }) => Id as number);

        response.push({
            Administracion: adminIds,
            Secretaria: secretariasIds,
            Docentes: docentesIds,
            TodosLosAlumnos: todosLosAlumnosIds,
        })

        console.log(response);

        var materiaDivision = await db.select<MateriaDivision>("MateriaDivision");

        // for(let i = 0; i < materiaDivision.length; i++){
        //     var alumnosPorDivision = await db.select<AlumnoMaterias>("AlumnoMaterias",{IdMateriaDivision: materiaDivision[i].Id});
        //     var division = materiaDivision[i].Division;
            
        //     response.push({
        //         Division: division,
        //         AlumnosDivisionId: alumnosPorDivision[i].Id
        //     });
        // }

        return res.json(response);
    } catch (error) {
        console.log(error);
        return res.status(500).json({
        msg: errorMsg.ERROR_INESPERADO,
        });
    }
}