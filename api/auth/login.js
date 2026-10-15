import { applyCors } from '../_lib/cors.js';
import { signIn } from '../_lib/auth.js';
export default function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });
  return signIn(req, res);
}
