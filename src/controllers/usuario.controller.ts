import { Request, Response } from 'express'
import { connect } from '../database'
import Usuario from '../interface/Usuario'
import bcrypt from 'bcrypt'

export async function getUsuarios(req: Request, res: Response): Promise<Response>{
    const conn = await connect();
    const usuarios = await conn.query('SELECT * FROM usuarios');
    return res.json(usuarios[0]);
}

export async function createUsuario(req: Request, res: Response){
    const newUsuario: Usuario = req.body;
    const conn = await connect();

    const hashedPassword = await bcrypt.hash(newUsuario.contraseña,10);

    await conn.query('INSERT INTO usuarios SET ?', {
        nombre: newUsuario.nombre,
        apellido: newUsuario.apellido,
        tipoUsuario: newUsuario.tipoUsuario,
        dni: newUsuario.dni,
        mail: newUsuario.mail,
        contraseña: hashedPassword
    });
    console.log(newUsuario);

    return res.json({
        message: 'Usuario Created'
    });
}

export async function login(req: Request, res: Response){

    const { mail, password } = req.body;

    const conn = await connect();
    const usuario = await conn.query('SELECT Nombre, Apellido, Mail FROM usuarios WHERE mail = ?', [mail]);

    res.json({
        msg: 'Login',
        body: usuario
    })
}

export async function getUsuario(req: Request, res: Response): Promise<Response>{
    const id = req.params.usuarioId;
    const conn = await connect();

    const usuario = await conn.query('SELECT Nombre ,Apellido, TipoUsuario, Dni, Mail FROM usuarios WHERE id = ?', [id]);
    return res.json(usuario[0]);
}

export async function deleteUsuario(req: Request, res: Response){
    const id = req.params.usuarioId;
    const conn = await connect();

    const usuario = await conn.query('DELETE FROM usuarios WHERE id = ?', [id]);
    return res.json({
        message: 'Usuario Deleted'
    });
}

export async function updateUsuario(req: Request, res: Response){
    const id = req.params.usuarioId;
    const updateUsuario: Usuario = req.body;
    const conn = await connect();

    await conn.query('UPDATE usuarios SET ? WHERE id = ?', [updateUsuario , id]);
    console.log([updateUsuario]);

    return res.json({
        message: 'Usuario Updated'
    });
}