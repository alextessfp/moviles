import { applyCors } from '../_lib/cors.js';
import { getDb } from '../_lib/db.js';
import { requireAdmin } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST' || !['check-in', 'check-out'].includes(req.query.action)) return res.status(405).json({ error: 'Acción no permitida.' });
  if (!requireAdmin(req, res)) return;
  const { employeeId } = req.body || {};
  if (!employeeId) return res.status(400).json({ error: 'Falta el identificador del colaborador.' });
  const db = getDb();
  try {
    if (req.query.action === 'check-in') {
      const { rows } = await db.query(`INSERT INTO attendance(employee_id,work_date,check_in,is_late)
        SELECT id,(now() AT TIME ZONE 'America/Mexico_City')::date,now(),(now() AT TIME ZONE 'America/Mexico_City')::time > time '08:15'
        FROM employees WHERE id=$1 AND active=true
        ON CONFLICT(employee_id,work_date) DO UPDATE SET check_in=EXCLUDED.check_in,is_late=EXCLUDED.is_late,updated_at=now()
        RETURNING employee_id AS id,CASE WHEN is_late THEN 'retardo' ELSE 'presente' END AS status,to_char(check_in AT TIME ZONE 'America/Mexico_City','HH24:MI') AS time`, [employeeId]);
      if (!rows.length) return res.status(404).json({ error: 'Colaborador no encontrado.' });
      return res.status(200).json({ record: rows[0] });
    }
    const { rows } = await db.query(`UPDATE attendance SET check_out=now(),updated_at=now() WHERE employee_id=$1 AND work_date=(now() AT TIME ZONE 'America/Mexico_City')::date RETURNING employee_id AS id,check_out`, [employeeId]);
    if (!rows.length) return res.status(404).json({ error: 'No hay una entrada registrada para hoy.' });
    return res.status(200).json({ record: rows[0] });
  } catch (error) { console.error('attendance:write', error); return res.status(500).json({ error: error.message || 'No fue posible guardar la asistencia.' }); }
}
