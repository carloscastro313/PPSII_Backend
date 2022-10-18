import { Request, Response } from 'express'
import { connect } from '../database'
import tipoUsuario from '../interface/TipoUsuario'

export async function getTipoUsuarios(req: Request, res: Response): Promise<Response>{
    const conn = await connect();
    const tipoUsuarios = await conn.query('SELECT * FROM tipoUsuarios');
    return res.json(tipoUsuarios[0]);
}

export async function getTipoUsuario(req: Request, res: Response): Promise<Response>{
    const id = req.params.tipoUsuarioId;
    const conn = await connect();

    const usuario = await conn.query('SELECT * FROM usuarios WHERE id = ?', [id]);
    return res.json(usuario[0]);
}