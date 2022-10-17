import { createPool } from 'mysql2/promise';

export async function connect(){

    const connection = await createPool({
        host: 'localhost',
        user: 'root',
        database: 'PPSII',
        connectionLimit: 10,
        password:'valentino2001'
    });
    return connection;
}
