import pg from 'pg';

const { Pool } = pg;
let pool;
export function getDb() {
  if (!process.env.DATABASE_URL) throw new Error('Falta configurar DATABASE_URL con la conexión de PostgreSQL.');
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000, ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false } });
  return pool;
}
