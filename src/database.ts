import { MySQL2Extended } from 'mysql2-extended';
import { createPool } from 'mysql2/promise';

async function getInstanceDB(){

    const connection = await createPool({
        host: process.env.HOST,
        user: process.env.USUARIO,
        database: process.env.DATABASE,
        password: process.env.PASSWORD,
        connectionLimit: 50
    });
    return new MySQL2Extended(connection);
}

export default getInstanceDB;