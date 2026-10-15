import jwt from 'jsonwebtoken';
import { timingSafeEqual } from 'node:crypto';

export function signIn(req, res) {
  const { email, password } = req.body || {};
  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedEmail || !expectedPassword || !process.env.JWT_SECRET) return res.status(503).json({ error: 'Configura ADMIN_EMAIL, ADMIN_PASSWORD y JWT_SECRET para habilitar el acceso.' });
  const safeEqual = (a, b) => { const left = Buffer.from(String(a || '')); const right = Buffer.from(String(b || '')); return left.length === right.length && timingSafeEqual(left, right); };
  if (!safeEqual(email?.toLowerCase(), expectedEmail.toLowerCase()) || !safeEqual(password, expectedPassword)) return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
  const token = jwt.sign({ email: expectedEmail.toLowerCase(), role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '12h', issuer: 'rodalia-asistencia' });
  return res.json({ token, user: { email: expectedEmail.toLowerCase(), name: process.env.ADMIN_NAME || 'Administración' } });
}

export function requireAdmin(req, res) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token || !process.env.JWT_SECRET) { res.status(401).json({ error: 'Inicia sesión para consultar la información del personal.' }); return false; }
  try { req.admin = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'rodalia-asistencia' }); return true; }
  catch { res.status(401).json({ error: 'Tu sesión venció. Vuelve a iniciar sesión.' }); return false; }
}
