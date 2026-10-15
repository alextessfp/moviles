import { applyCors } from './_lib/cors.js';

export default function handler(_req, res) {
  applyCors(_req, res);
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ ok: true, service: 'rodalia-asistencia', databaseConfigured: Boolean(process.env.DATABASE_URL) });
}
