import { applyCors } from './_lib/cors.js';
import { getDb } from './_lib/db.js';
import { requireAdmin } from './_lib/auth.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (!requireAdmin(req, res)) return;
  const db = getDb();
  if (req.method === 'GET') {
    try { const { rows } = await db.query('SELECT id,full_name AS name,position AS role,department,active FROM employees ORDER BY full_name'); return res.status(200).json({ employees: rows }); }
    catch (error) { console.error('employees:list', error); return res.status(500).json({ error: 'No fue posible consultar el personal.' }); }
  }
  if (req.method === 'POST') {
    const { name, role, department = 'Administración' } = req.body || {};
    if (!name?.trim() || !role?.trim()) return res.status(400).json({ error: 'Nombre y puesto son obligatorios.' });
    try { const { rows } = await db.query('INSERT INTO employees(full_name,position,department) VALUES($1,$2,$3) RETURNING id,full_name AS name,position AS role,department,active', [name.trim(), role.trim(), department]); return res.status(201).json({ employee: rows[0] }); }
    catch (error) { console.error('employees:create', error); return res.status(500).json({ error: 'No fue posible agregar al colaborador.' }); }
  }
  return res.status(405).json({ error: 'Método no permitido.' });
}
