import { Request, Response } from "express";
import getInstanceDB from "../database";
import { errorMsg } from "../const/errors";
import Usuario from "../interface/Usuario";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getTokenId } from "../helpers/jwt";
import { TiposUsuario } from "../enums/tiposUsuario";
import MateriaDivision from "../interface/MateriaDivision";

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
  var idUsuario = 0;

  try {
    const db = await getInstanceDB();

    newUsuario.Contraseña = await bcrypt.hash(newUsuario.Contraseña, 10);
    console.log(newUsuario);

    var usuario = await db.query(
      "SELECT * FROM Usuarios WHERE Mail = ?",
      newUsuario.Mail
    );

    console.log(usuario);

    if (usuario.length != 0) {
      return res.status(400).json({
        msg: errorMsg.ERROR_EMAIL_TOMADO,
      });
    }

    usuario = await db.query(
      "SELECT * FROM Usuarios WHERE DNI = ?",
      newUsuario.DNI
    );

    if (usuario.length != 0) {
      return res.status(400).json({
        msg: errorMsg.ERROR_DNI_YA_EXISTE,
      });
    }

    await db.transaction(async (t) => {
      await t.insert<Usuario>("Usuarios", { ...newUsuario });
      idUsuario = await t.getLastInsertId();
    });

    return res.json({
      msg: "Usuario creado con exito. El legajo es " + idUsuario,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function login(req: Request, res: Response) {
  const { Legajo, Contraseña } = req.body;

  try {
    const db = await getInstanceDB();
    var usuario = null;
    try {
      usuario = await db.selectOne<Usuario>("Usuarios", { Id: Legajo });
    } catch (error) {
      return res.status(400).json({
        msg: "Error",
        body: errorMsg.ERROR_LEGAJO_NO_EXISTE,
      });
    }
    const result = await bcrypt.compare(Contraseña, usuario.Contraseña);

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

    try {
      var usuario = await db.selectOne<Usuario>("Usuarios", { Id: id });
    } catch (error) {
      return res.status(400).json({
        msg: "Error",
        body: errorMsg.ERROR_LEGAJO_NO_EXISTE,
      });
    }

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

  if (newUsuario.Contraseña != null) {
    await bcrypt.hash(newUsuario.Contraseña, 10).then((hash) => {
      newUsuario.Contraseña = hash;
    });
  }

  try {
    const db = await getInstanceDB();

    const [existe] = await db.select<Usuario>("Usuarios", { Id: id });

    if (existe == null)
      return res.status(400).json({
        msg: "No existe el usuario",
      });

    var usuario = await db.query(
      "SELECT * FROM Usuarios WHERE Mail = ?",
      newUsuario.Mail
    );

    console.log(usuario);

    if (usuario.length != 0 && existe.Mail != newUsuario.Mail) {
      return res.status(400).json({
        msg: errorMsg.ERROR_EMAIL_TOMADO,
      });
    }

    usuario = await db.query(
      "SELECT * FROM Usuarios WHERE DNI = ?",
      newUsuario.DNI
    );

    console.log(existe.DNI);

    if (usuario.length != 0 && existe.DNI != newUsuario.DNI) {
      return res.status(400).json({
        msg: errorMsg.ERROR_DNI_YA_EXISTE,
      });
    }

    await db.update<Usuario>("Usuarios", { ...newUsuario }, { Id: id });

    return res.json({
      msg: "Se a modificado el usuario",
      newUsuario,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}

export async function gruposDeGente(req: Request, res: Response): Promise<Response> {
  console.log("hola");
  return res.json("hola");
}

export async function traerGruposDePersonas(req: Request, res: Response): Promise<Response>{
  var response = [];

  try{
      const db = await getInstanceDB();

      var administraciones = await db.select<Usuario>("Usuario",{TipoUsuario: TiposUsuario.Administracion});
      var secretarias = await db.select<Usuario>("Usuario",{TipoUsuario: TiposUsuario.Secretaria});
      var docentes = await db.select<Usuario>("Usuario",{TipoUsuario: TiposUsuario.Docente});
      var alumnos = await db.select<Usuario>("Usuario",{TipoUsuario: TiposUsuario.Alumno});

      console.log("secretarias");
      console.log(secretarias);

      var adminIds = administraciones.map(({ Id }) => Id as number);
      var secretariasIds = secretarias.map(({ Id }) => Id as number);
      var docentesIds = docentes.map(({ Id }) => Id as number);
      var todosLosAlumnosIds = alumnos.map(({ Id }) => Id as number);

      response.push({
          Administracion: adminIds,
          Secretaria: secretariasIds,
          Docentes: docentesIds,
          TodosLosAlumnos: todosLosAlumnosIds,
      })

      console.log(response);

      var materiaDivision = await db.select<MateriaDivision>("MateriaDivision");

      // for(let i = 0; i < materiaDivision.length; i++){
      //     var alumnosPorDivision = await db.select<AlumnoMaterias>("AlumnoMaterias",{IdMateriaDivision: materiaDivision[i].Id});
      //     var division = materiaDivision[i].Division;
          
      //     response.push({
      //         Division: division,
      //         AlumnosDivisionId: alumnosPorDivision[i].Id
      //     });
      // }

      return res.json(response);
  } catch (error) {
      console.log(error);
      return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
      });
  }
}
export async function cambiarContraseña(req: Request, res: Response) {
  const id = req.params.UsuarioId;
  let Contraseña = req.body.Contraseña;

  try {
    const db = await getInstanceDB();

    const [existe] = await db.select<Usuario>("Usuarios", { Id: id });

    if (existe == null)
      return res.status(400).json({
        msg: "No existe el usuario",
      });

    Contraseña = await bcrypt.hash(Contraseña, 10);

    await db.update<Usuario>("Usuarios", { Contraseña }, { Id: id });

    return res.json({
      msg: "Se a modificado el usuario",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: errorMsg.ERROR_INESPERADO,
    });
  }
}
