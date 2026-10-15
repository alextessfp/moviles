import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import pg from 'pg';

const scrypt = promisify(scryptCallback);

if (!process.env.DATABASE_URL) throw new Error('Define DATABASE_URL antes de ejecutar npm run db:migrate.');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false } });
try {
  await pool.query(await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8'));
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const salt = randomBytes(16);
    const hash = Buffer.from(await scrypt(process.env.ADMIN_PASSWORD, salt, 64));
    const passwordHash = `${salt.toString('hex')}:${hash.toString('hex')}`;
    await pool.query(`INSERT INTO app_users(email,full_name,password_hash,role)
      VALUES(lower($1),$2,$3,'admin')
      ON CONFLICT(email) DO UPDATE SET full_name=EXCLUDED.full_name,password_hash=EXCLUDED.password_hash,role='admin',employee_id=NULL,active=true`,
    [process.env.ADMIN_EMAIL.trim(), process.env.ADMIN_NAME || 'Administración', passwordHash]);
    console.log(`Cuenta administradora ${process.env.ADMIN_EMAIL.trim()} creada o actualizada.`);
  } else console.log('Define ADMIN_EMAIL y ADMIN_PASSWORD para crear la cuenta administradora.');
  console.log('Esquema de Rodalia instalado correctamente.');
}
finally { await pool.end(); }
