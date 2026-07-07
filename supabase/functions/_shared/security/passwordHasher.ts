// ─────────────────────────────────────────────────────────────
// Hasheo de contraseñas con bcrypt. Se usa bcryptjs (puro JS, sin
// Web Worker) en vez de deno.land/x/bcrypt porque el runtime de
// Supabase Edge Functions no soporta Worker.
// ─────────────────────────────────────────────────────────────
import bcrypt from 'https://esm.sh/bcryptjs@2.4.3';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  return bcrypt.compare(plain, stored);
}

/** true si `stored` ya es un hash bcrypt ($2a$/$2b$/$2y$...), false si sigue siendo texto plano legacy */
export function esHashBcrypt(stored: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(stored);
}
