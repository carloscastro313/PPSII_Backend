export enum FranjasHorarias{
    PrimeraHora = 1,
    SegundaHora = 2,
    BloqueCompleto = 3
}

export function mapFranjaHoraria(id : number):string{
    var response = "";
    switch (id) {
        case FranjasHorarias.PrimeraHora:
            response = "Primera hora";
            break;
        case FranjasHorarias.SegundaHora:
            response = "Segunda hora";
            break;
        case FranjasHorarias.BloqueCompleto:
            response = "Bloque completo";
            break;
    }
    return response;
}