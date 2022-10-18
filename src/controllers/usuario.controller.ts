import { Request, Response } from 'express'
import { connect } from '../database'
import { errorMsg } from '../const/errors'
import Usuario from '../interface/Usuario'
import bcrypt from 'bcrypt'
import { RowDataPacket } from 'mysql2'
import jwt from 'jsonwebtoken'

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

    conn.query('SELECT * FROM usuarios WHERE mail = ' + mail, function(err, results){
        if(err){
            console.log(err);
        } else {
            console.log(3);
            if(results.length == 0){
                //No existe usuario
                return res.json({
                    msg: 'Error',
                    body: errorMsg.ERROR_EMAIL_NO_EXISTE
                });
            } else {
                //Existe
                const userPassword = results[0].password;
                
                bcrypt.compare(password,userPassword).then((result) =>{
                    if(result){
                        //Login Exitoso
                        const token = jwt.sign({
                            mail: mail
                        }, process.env.SECRET || 'SECRETO', { expiresIn: '1h'})

                        return res.json({
                            msg: 'Login exitoso',
                            body: token
                        });
                    } else {
                        //Password incorrecto
                        return res.json({
                            msg: 'Error',
                            body: errorMsg.ERROR_CONSTRASEÑA_INCORRECTA
                        });
                    }
                });
            }
        }
    });
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