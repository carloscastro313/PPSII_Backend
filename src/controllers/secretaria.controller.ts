import { Request, Response } from 'express'
import getInstanceDB  from '../database'
import { TiposUsuario } from '../enums/tiposUsuario';
import Usuario from '../interface/Usuario'

export async function getSecretarias(req: Request, res: Response): Promise<Response>{
    const db = await getInstanceDB();
    const secretarias = await db.select<Usuario>("Usuarios",{TipoUsuario: TiposUsuario.Secretaria});
    return res.json(secretarias);
}