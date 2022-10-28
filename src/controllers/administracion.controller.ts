import { Request, Response } from 'express'
import { BindValue } from 'mysql2-extended';
import { errorMsg } from '../const/errors';
import getInstanceDB  from '../database'
import { TiposUsuario } from '../enums/tiposUsuario';
import TipoInstanciaInscripcion from '../interface/TipoInstanciaInscripcion';
import Usuario from '../interface/Usuario';

export async function getAdministraciones(req: Request, res: Response): Promise<Response>{
    const db = await getInstanceDB();
    const administraciones = await db.select<Usuario>("Usuarios",{TipoUsuario: TiposUsuario.Administracion});
    return res.json(administraciones);
}

export async function getInstanciaInscripcionActivas(req: Request, res: Response): Promise<Response>{
    try{
        const db = await getInstanceDB();
        const now = new Date;

        var values : BindValue[] = new Array(2);
        values[0] = now.toISOString();
        values[1] = now.toISOString();

        console.log(values);

        const instanciaInscripciones = await db.query("SELECT * FROM InstanciaInscripcion WHERE FechaInicio <= ? AND FechaFinal >= ?",values);
        return res.json(instanciaInscripciones);
    } catch(error){
        console.log(error);
        return res.status(500).json({
            msg: errorMsg.ERROR_INESPERADO,
        });
    }
}

export async function getTipoInstanciaInscripciones(req: Request, res: Response): Promise<Response>{
    try{
        const db = await getInstanceDB();

        const tipoInstanciasInscripcion = await db.select<TipoInstanciaInscripcion>("TipoInstanciaInscripcion");

        return res.json(tipoInstanciasInscripcion);
    } catch(error){
        console.log(error);
        return res.status(500).json({
            msg: errorMsg.ERROR_INESPERADO,
        });
    }
}

export async function createInstanciaInscripcion(req: Request, res: Response): Promise<Response>{
    const newInstanciaInscripcion = req.body;

    try{
        const db = await getInstanceDB();

        const now = new Date;

        var values : BindValue[] = new Array(3);
        values[0] = now.toISOString();
        values[1] = now.toISOString();
        values[2] = newInstanciaInscripcion.IdTipo.toString();

        console.log(values);

        const instanciaInscripciones = await db.query("SELECT * FROM InstanciaInscripcion WHERE FechaInicio <= ? AND FechaFinal >= ? AND IdTipo = ?",values);

        if(instanciaInscripciones.length != 0){
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



