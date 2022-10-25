import { MySQL2Extended } from "mysql2-extended";
import { createPool, Pool } from "mysql2/promise";

var globalPool: Pool | undefined = undefined;

async function getInstanceDB(): Promise<MySQL2Extended> {
  if (globalPool) return new MySQL2Extended(globalPool);

  globalPool = await createPool({
    host: process.env.HOST,
    user: process.env.USUARIO,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
  });
  return new MySQL2Extended(globalPool);
}

export default getInstanceDB;
