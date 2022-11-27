export enum EstadosAlumnoMateria{
    NoCursada = 1,
    CursadaRegular = 2,
    CursadaAprobada = 3,
    MateriaDesaprobada = 4,
    MateriaAprobada = 5
}

export function mapEstadosAlumnoMateria(id : number):string{
    var response = "";
    switch (id) {
        case EstadosAlumnoMateria.NoCursada:
            response = "No cursada";
            break;
        case EstadosAlumnoMateria.CursadaRegular:
            response = "Cursada regular";
            break;
        case EstadosAlumnoMateria.CursadaAprobada:
            response = "Cursada aprobada";
            break;
        case EstadosAlumnoMateria.MateriaDesaprobada:
            response = "Materia desaprobada";
            break;
        case EstadosAlumnoMateria.MateriaAprobada:
            response = "Materia aprobada";
            break;
    }
    return response;
}