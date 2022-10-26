import { Request, Response } from 'express'
import getInstanceDB  from '../database'
import { TiposUsuario } from '../enums/tiposUsuario';
import Usuario from '../interface/Usuario'

export async function getDocentes(req: Request, res: Response): Promise<Response>{
    const db = await getInstanceDB();
    const docentes = await db.select<Usuario>("Usuarios",{TipoUsuario: TiposUsuario.Docente});
    return res.json(docentes);
}