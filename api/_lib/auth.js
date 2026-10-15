import jwt from 'jsonwebtoken';
import { promisify } from 'node:util';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { getDb } from './db.js';

const scrypt = promisify(scryptCallback);

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `${salt.toString('hex')}:${Buffer.from(hash).toString('hex')}`;
}

async function verifyPassword(password, encoded) {
  const [saltHex, hashHex] = String(encoded || '').split(':');
  if (!saltHex || !hashHex) return false;
  try {
    const expected = Buffer.from(hashHex, 'hex');
    const actual = Buffer.from(await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length));
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch { return false; }
}

export async function signIn(req, res) {
  const { email, password } = req.body || {};
  if (!email?.trim() || !password || !process.env.JWT_SECRET) return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
  try {
    const { rows } = await getDb().query(`SELECT u.id, u.email, u.password_hash, u.role, u.employee_id,
      COALESCE(e.full_name, u.full_name) AS name
      FROM app_users u LEFT JOIN employees e ON e.id=u.employee_id
      WHERE lower(u.email)=lower($1) AND u.active=true AND (u.employee_id IS NULL OR e.active=true) LIMIT 1`, [email.trim()]);
    const account = rows[0];
    if (!account || !(await verifyPassword(password, account.password_hash))) return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    const user = { id: String(account.id), email: account.email, name: account.name, role: account.role, employeeId: account.employee_id == null ? null : String(account.employee_id) };
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '12h', issuer: 'rodalia-asistencia' });
    return res.json({ token, user });
  } catch (error) {
    console.error('auth:login', error);
    return res.status(503).json({ error: 'No fue posible validar el acceso. Verifica la conexión con la base de datos.' });
  }
}

export function requireAuth(req, res) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token || !process.env.JWT_SECRET) { res.status(401).json({ error: 'Inicia sesión para consultar la información.' }); return false; }
  try { req.user = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'rodalia-asistencia' }); return true; }
  catch { res.status(401).json({ error: 'Tu sesión venció. Vuelve a iniciar sesión.' }); return false; }
}

export function requireAdmin(req, res) {
  if (!requireAuth(req, res)) return false;
  if (req.user.role !== 'admin') { res.status(403).json({ error: 'Esta acción requiere una cuenta de administrador.' }); return false; }
  return true;
}
