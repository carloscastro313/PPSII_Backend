export enum Turnos{
    Mañana = 1,
    Tarde = 2,
    Noche = 3
}

export function mapTurno(id : number):string{
    var response = "";
    switch (id) {
        case Turnos.Mañana:
            response = "Mañana";
            break;
        case Turnos.Tarde:
            response = "Tarde";
            break;
        case Turnos.Noche:
            response = "Noche";
            break;
    }
    return response;
}