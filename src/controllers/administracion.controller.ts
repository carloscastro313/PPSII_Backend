import { Request, Response } from 'express'
import getInstanceDB  from '../database'
import { TiposUsuario } from '../enums/tiposUsuario';
import Usuario from '../interface/Usuario'

export async function getAdministraciones(req: Request, res: Response): Promise<Response>{
    const db = await getInstanceDB();
    const administraciones = await db.select<Usuario>("Usuarios",{TipoUsuario: TiposUsuario.Administracion});
    return res.json(administraciones);
}