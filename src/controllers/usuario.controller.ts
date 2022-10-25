import { Request, Response } from "express";
import getInstanceDB from "../database";
import { errorMsg } from "../const/errors";
import Usuario from "../interface/Usuario";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getTokenId } from "../helpers/jwt";

export async function getUsuarios(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const db = await getInstanceDB();
    const usuarios = await db.select<Usuario>("Usuarios");

    return res.json(usuarios);
  } catch (error) {
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function createUsuario(req: Request, res: Response) {
  const newUsuario = req.body;

  try {
    const db = await getInstanceDB();

    newUsuario.Contraseña = await bcrypt.hash(newUsuario.Contraseña, 10);

    console.log(newUsuario);
    await db.insert("Usuarios", { ...newUsuario });

    return res.json({
      msg: "Usuario creado",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function login(req: Request, res: Response) {
  const { Mail, Contraseña } = req.body;

  try {
    const db = await getInstanceDB();

    const usuario = await db.selectOne<Usuario>("Usuarios", { Mail: Mail });
    console.log(usuario.Contraseña);

    if (usuario == null) {
      //No existe usuario
      return res.status(400).json({
        msg: "Error",
        body: errorMsg.ERROR_EMAIL_NO_EXISTE,
      });
    }

    const result = await bcrypt.compare(Contraseña, usuario.Contraseña);
    console.log(result);
    if (!result) {
      //Password incorrecto
      return res.status(400).json({
        msg: "Error",
        body: errorMsg.ERROR_CONSTRASEÑA_INCORRECTA,
      });
    }

    //Login Exitoso
    const token = jwt.sign(
      { id: usuario.Id },
      process.env.SECRET || "SECRETO",
      { expiresIn: "1h" }
    );

    return res.json({
      msg: "Login exitoso",
      token,
      usuario,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function checkSesion(req: Request, res: Response) {
  try {
    const bearerToken = req.header("authorization") as string;
    const { id } = getTokenId(bearerToken);
    const db = await getInstanceDB();
    const usuario = await db.selectOne<Usuario>("Usuarios", { Id: id });

    if (!usuario)
      return res.status(400).json({
        msg: "Error",
        body: errorMsg.ERROR_EMAIL_NO_EXISTE,
      });

    const token = jwt.sign(
      { id: usuario.Id },
      process.env.SECRET || "SECRETO",
      { expiresIn: "1h" }
    );

    return res.json({
      msg: "Login exitoso",
      token,
      usuario,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function getUsuario(
  req: Request,
  res: Response
): Promise<Response> {
  const id = req.params.UsuarioId;
  try {
    const db = await getInstanceDB();

    const usuario = await db.select<Usuario>("Usuarios", { Id: id });

    return res.json(usuario);
  } catch (error) {
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function deleteUsuario(req: Request, res: Response) {
  const id = req.params.UsuarioId;
  try {
    const db = await getInstanceDB();

    const existe = await db.select<Usuario>("Usuarios", { Id: id });

    if (existe == null)
      return res.status(400).json({
        msg: "No existe el usuario",
      });

    const usuario = await db.delete<Usuario>("Usuarios", { Id: id });

    return res.json({
      msg: "Se a eliminado el usuario",
      usuario,
    });
  } catch (error) {
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function updateUsuario(req: Request, res: Response) {
  const id = req.params.UsuarioId;
  const newUsuario = req.body;

  await bcrypt.hash(newUsuario.Contraseña, 10).then((hash) => {
    newUsuario.Contraseña = hash;
  });

  try {
    const db = await getInstanceDB();

    const existe = await db.select<Usuario>("Usuarios", { Id: id });

    if (existe == null)
      return res.status(400).json({
        msg: "No existe el usuario",
      });

    await db.update<Usuario>("Usuarios", { ...newUsuario }, { Id: id });

    return res.json({
      msg: "Se a modificado el usuario",
      newUsuario,
    });
  } catch (error) {
    console.log(error);
    console.log(newUsuario.Contraseña);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}
