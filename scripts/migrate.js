import { readFile } from 'node:fs/promises';
import pg from 'pg';

if (!process.env.DATABASE_URL) throw new Error('Define DATABASE_URL antes de ejecutar npm run db:migrate.');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false } });
try { await pool.query(await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8')); console.log('Esquema de Rodalia instalado correctamente.'); }
finally { await pool.end(); }
