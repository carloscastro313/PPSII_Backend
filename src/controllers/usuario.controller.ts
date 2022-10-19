import { Request, Response } from "express";
import getInstanceDB from "../database";
import { errorMsg } from "../const/errors";
import Usuario from "../interface/Usuario";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function getUsuarios(req: Request,res: Response): Promise<Response> {
  
  try {
    const db = await getInstanceDB();
    const usuarios = await db.select<Usuario>("Usuarios");
  
    return res.json(usuarios);
  } catch (error) {

    console.log(error);

    return res.status(500).json({
      error,
    })
  }
}

export async function createUsuario(req: Request, res: Response) {
  const newUsuario: Usuario = req.body;

  try {
    const db = await getInstanceDB();
  
    newUsuario.Contraseña = await bcrypt.hash(newUsuario.Contraseña, 10);
  
    await db.insert<Usuario>("Usuarios",{
      ...newUsuario
    });
  
    console.log(newUsuario);
  
    return res.json({
      message: "Usuario Created",
    });
    
  } catch (error) {
    return res.status(500).json({
      error,
    })
  }
}

export async function login(req: Request, res: Response) {
  const { mail, password } = req.body;

  try {
    const db = await getInstanceDB();
  
    const usuario = await db.selectOne<Usuario>("Usuarios",{Mail: mail});
    console.log(usuario.Contraseña);

    if (usuario == null) {
      //No existe usuario
      return res.status(400).json({
        msg: "Error",
        body: errorMsg.ERROR_EMAIL_NO_EXISTE,
      });
    } 

    const result = await bcrypt.compare(password, usuario.Contraseña)
    
    if (!result) {
      //Password incorrecto
      return res.status(400).json({
        msg: "Error",
        body: errorMsg.ERROR_CONSTRASEÑA_INCORRECTA,
      });  
    }

    //Login Exitoso
    const token = jwt.sign(
      { mail },
      process.env.SECRET || "SECRETO",
      { expiresIn: "1h" }
    );

    return res.json({
      msg: "Login exitoso",
      token,
    });
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error,
    })
  }
}

export async function getUsuario(req: Request,res: Response): Promise<Response> {
  const id = req.params.UsuarioId;
  try {
    const db = await getInstanceDB();

    const usuario = await db.select<Usuario>("Usuarios",{Id: id});

    return res.json(usuario);
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      error
    })
  }
}

export async function deleteUsuario(req: Request, res: Response) {
  const id = req.params.UsuarioId;
  try {
    const db = await getInstanceDB();

    const existe = await db.select<Usuario>("Usuarios",{Id: id});

    if (existe == null) return res.status(400).json({
      msg: "No existe el usuario"
    })

    const usuario = await db.delete<Usuario>("Usuarios",{Id: id});
  
    return res.json({
      message: "Se a eliminado el usuario",
      usuario
    });
  } catch (error) {
    
    return res.status(500).json({
      error,
    })
  }
}

export async function updateUsuario(req: Request, res: Response) {
  const id = req.params.UsuarioId;
  try {
    const db = await getInstanceDB();

    const existe = await db.select<Usuario>("Usuarios",{Id: id});

    if (existe == null) return res.status(400).json({
      msg: "No existe el usuario"
    })

    const usuario = await db.update<Usuario>("Usuarios",{Id: id});
  
    return res.json({
      message: "Se a modificado el usuario",
      usuario
    });
  } catch (error) {
    
    return res.status(500).json({
      error,
    })
  }
}
