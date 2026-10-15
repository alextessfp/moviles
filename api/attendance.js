import { applyCors } from './_lib/cors.js';
import { getDb } from './_lib/db.js';
import { requireAdmin } from './_lib/auth.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido.' });
  if (!requireAdmin(req, res)) return;
  try {
    const day = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date || '') ? req.query.date : new Date().toISOString().slice(0, 10);
    const { rows } = await getDb().query(`SELECT e.id, e.full_name AS name, e.position AS role, e.department,
      CASE WHEN a.check_in IS NULL THEN 'pendiente' WHEN a.check_out IS NOT NULL THEN 'salida' WHEN a.is_late THEN 'retardo' ELSE 'presente' END AS status,
      CASE WHEN a.check_in IS NULL THEN '—' ELSE to_char(a.check_in AT TIME ZONE 'America/Mexico_City', 'HH24:MI') END AS time,
      CASE WHEN a.check_in IS NOT NULL THEN left(regexp_replace(e.full_name, '(\\S)\\S*\\s*', '\\1', 'g'), 2) END AS initials,
      CASE WHEN a.check_in IS NOT NULL THEN a.check_in ELSE NULL END AS check_in, a.check_out
      FROM employees e LEFT JOIN attendance a ON a.employee_id=e.id AND a.work_date=$1::date
      WHERE e.active=true ORDER BY e.full_name`, [day]);
    return res.status(200).json({ records: rows, date: day });
  } catch (error) { console.error('attendance:list', error); return res.status(500).json({ error: error.message || 'No fue posible consultar la asistencia.' }); }
}
