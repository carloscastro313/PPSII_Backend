import { Request, Response } from 'express'
import { connect } from '../database'
import { Alumno } from '../interface/Alumno'

export async function getAlumnos(req: Request, res: Response): Promise<Response>{
    const conn = await connect();
    const alumnos = await conn.query('SELECT * FROM alumnos');
    return res.json(alumnos[0]);
}

export async function createAlumno(req: Request, res: Response){
    const newAlumno: Alumno = req.body;
    const conn = await connect();

    await conn.query('INSERT INTO alumnos SET ?', [newAlumno]);
    console.log(newAlumno);

    return res.json({
        message: 'Alumno Created'
    });
}

export async function getAlumno(req: Request, res: Response): Promise<Response>{
    const id = req.params.alumnoId;
    const conn = await connect();

    const alumno = await conn.query('SELECT * FROM alumnos WHERE id = ?', [id]);
    return res.json(alumno[0]);
}

export async function deleteAlumno(req: Request, res: Response){
    const id = req.params.alumnoId;
    const conn = await connect();

    const alumno = await conn.query('DELETE FROM alumnos WHERE id = ?', [id]);
    return res.json({
        message: 'Alumno Deleted'
    });
}

export async function updateAlumno(req: Request, res: Response){
    const id = req.params.alumnoId;
    const updateAlumno: Alumno = req.body;
    const conn = await connect();

    await conn.query('UPDATE alumnos SET ? WHERE id = ?', [updateAlumno , id]);
    console.log([updateAlumno]);

    return res.json({
        message: 'Alumno Updated'
    });
}