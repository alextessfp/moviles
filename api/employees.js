import { applyCors } from './_lib/cors.js';
import { getDb } from './_lib/db.js';
import { requireAdmin } from './_lib/auth.js';
import { hashPassword } from './_lib/auth.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  if (req.method === 'GET') {
    try { const { rows } = await db.query('SELECT id,full_name AS name,position AS role,department,active FROM employees ORDER BY full_name'); return res.status(200).json({ employees: rows }); }
    catch (error) { console.error('employees:list', error); return res.status(500).json({ error: 'No fue posible consultar el personal.' }); }
  }
  if (req.method === 'POST') {
    const { name, role, department = 'Administración', email, password } = req.body || {};
    if (!name?.trim() || !role?.trim() || !email?.trim() || !password) return res.status(400).json({ error: 'Nombre, puesto, correo y contraseña inicial son obligatorios.' });
    if (password.length < 8) return res.status(400).json({ error: 'La contraseña inicial debe tener al menos 8 caracteres.' });
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query('INSERT INTO employees(full_name,position,department) VALUES($1,$2,$3) RETURNING id,full_name AS name,position AS role,department,active', [name.trim(), role.trim(), department]);
      const passwordHash = await hashPassword(password);
      await client.query(`INSERT INTO app_users(email,full_name,password_hash,role,employee_id)
        VALUES(lower($1),$2,$3,'worker',$4)`, [email.trim(), name.trim(), passwordHash, rows[0].id]);
      await client.query('COMMIT');
      return res.status(201).json({ employee: rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('employees:create', error);
      if (error.code === '23505') return res.status(409).json({ error: 'El nombre o el correo ya están registrados.' });
      return res.status(500).json({ error: 'No fue posible agregar al colaborador.' });
    } finally { client.release(); }
  }
  return res.status(405).json({ error: 'Método no permitido.' });
}
