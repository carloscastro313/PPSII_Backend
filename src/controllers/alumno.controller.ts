import { Request, Response } from 'express'
import getInstanceDB  from '../database'
import { TiposUsuario } from '../enums/tiposUsuario';
import Usuario from '../interface/Usuario'

export async function getAlumnos(req: Request, res: Response): Promise<Response>{
    const db = await getInstanceDB();
    const alumnos = await db.select<Usuario>("Usuarios",{TipoUsuario: TiposUsuario.Alumno});
    return res.json(alumnos);
}