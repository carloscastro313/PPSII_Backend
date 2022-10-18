import { createPool } from 'mysql2/promise';
const dotenv = require('dotenv');
dotenv.config()

export async function connect(){

    const connection = await createPool({
        host: process.env.HOST,
        user: process.env.USUARIO,
        database: process.env.DATABASE,
        password: process.env.PASSWORD,
        connectionLimit: 10
    });
    return connection;
}
