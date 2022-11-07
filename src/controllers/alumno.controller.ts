import { Request, Response } from 'express'
import getInstanceDB  from '../database'
import { TiposUsuario } from '../enums/tiposUsuario';
import Usuario from '../interface/Usuario'
import bcrypt from "bcrypt";
import { errorMsg } from '../const/errors';
import AlumnoCarrera from '../interface/AlumnoCarrera';
import { EstadosAlumnoCarrera } from '../enums/estadosAlumnoCarrera';
import { BindValue } from 'mysql2-extended';

export async function getAlumnos(req: Request, res: Response): Promise<Response>{
    const db = await getInstanceDB();
    const alumnos = await db.select<Usuario>("Usuarios",{TipoUsuario: TiposUsuario.Alumno});
    return res.json(alumnos);
}

export async function getAlumnosPorIdMateria(req: Request, res: Response): Promise<Response>{
  //TO DO
  const idMateria = req.params.idMateria;
  try{
    const db = await getInstanceDB();

    const alumnos = await (await db.select<Usuario>("Usuarios",{TipoUsuario: TiposUsuario.Alumno}));

  } catch (error) {
    console.log(error);
    return res.status(500).json({
    msg: errorMsg.ERROR_INESPERADO,
    });
  }

  return res.json();
}

export async function createAlumno(req: Request, res: Response) {
    const newUsuario = req.body.Alumno;
    const carreraId = req.body.CarreraId;
    var idAlumno = 0;

    var values : BindValue[] = new Array(2);
    values[0] = newUsuario.DNI;
    values[1] = carreraId;
  
    try {
      const db = await getInstanceDB();
      
      newUsuario.Contraseña = await bcrypt.hash(newUsuario.Contraseña, 10);
      
      const alumnoValidacion = await db.query("SELECT * FROM Usuarios u INNER JOIN AlumnoCarrera ac ON ac.IdAlumno = u.Id WHERE u.DNI = ? AND ac.IdCarrera = ?",values);
      
      if(alumnoValidacion.length != 0){
        return res.status(400).json({
            msg: errorMsg.ERROR_ALUMNO_EXISTE_EN_CARRERA,
        });
      }

      await db.transaction(async t => { 
        await t.insert<Usuario>("Usuarios", { ...newUsuario }); 
        idAlumno = await t.getLastInsertId();
      });

      if(idAlumno != 0){
        var alumnoCarrera : AlumnoCarrera = {IdAlumno: idAlumno, IdCarrera: carreraId, IdEstadoCarrera: EstadosAlumnoCarrera.EnCurso}
        await db.insert<AlumnoCarrera>("AlumnoCarrera", {...alumnoCarrera}); 
        
        return res.json({
          msg: "El alumno se creo con exito. El legajo del alumno creado es " + idAlumno,
        });
      }

    } catch (error) {
      console.log(error);
      return res.status(500).json({
        msg: errorMsg.ERROR_INESPERADO,
      });
    }
  }