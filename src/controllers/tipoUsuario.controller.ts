import { Request, Response } from 'express'
import getInstanceDB  from '../database'
import TipoUsuario from '../interface/TipoUsuario'

export async function getTipoUsuarios(req: Request, res: Response): Promise<Response>{
    const db = await getInstanceDB();
    const tipoUsuarios = await db.select<TipoUsuario>("TipoUsuario");
    return res.json(tipoUsuarios);
}

export async function getTipoUsuario(req: Request, res: Response): Promise<Response>{
    const id = req.params.TipoUsuarioId;
    const db = await getInstanceDB();

    const tipoUsuario = await db.select<TipoUsuario>("TipoUsuario",{ Id: id });
    return res.json(tipoUsuario);
}