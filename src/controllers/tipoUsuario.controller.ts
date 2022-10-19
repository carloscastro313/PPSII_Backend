import { Request, Response } from 'express'
import getInstanceDB  from '../database'
import TipoUsuario from '../interface/TipoUsuario'
import Usuario from '../interface/Usuario'

export async function getTipoUsuarios(req: Request, res: Response): Promise<Response>{
    const db = await getInstanceDB();
    const tipoUsuarios = await db.select<TipoUsuario>("TipoUsuario");
    return res.json(tipoUsuarios);
}

export async function getTipoUsuario(req: Request, res: Response): Promise<Response>{
    const id = req.params.TipoUsuarioId;
    const db = await getInstanceDB();

    // const usuario = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
    const usuario = await db.select<Usuario>("Usuarios");
    return res.json(usuario);
}