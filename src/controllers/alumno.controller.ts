import { Request, Response } from 'express'
import getInstanceDB  from '../database'
import Usuario from '../interface/Usuario'

export async function getAlumnos(req: Request, res: Response): Promise<Response>{
    const db = await getInstanceDB();
    const alumnos = await db.select<Usuario>("Usuarios",{TipoUsuario: 4});
    return res.json(alumnos);
}