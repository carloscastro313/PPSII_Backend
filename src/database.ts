import { Connection, createConnection } from "mysql2";
import { MySQL2Extended, Transaction } from "mysql2-extended";
import { createPool, Pool } from "mysql2/promise";

var globalPool: Pool | undefined = undefined;
var globalConnection: Connection | undefined = undefined;

export default async function getInstanceDB(): Promise<MySQL2Extended> {
  if (globalPool) return new MySQL2Extended(globalPool);

  globalPool = await createPool({
    host: process.env.HOST,
    user: process.env.USUARIO,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
  });
  return new MySQL2Extended(globalPool);
}

export async function getConnectionDB(): Promise<Connection> {
  if (globalConnection) return globalConnection;

  globalConnection = await createConnection({
    host: process.env.HOST,
    user: process.env.USUARIO,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
  });
  return globalConnection;
}
