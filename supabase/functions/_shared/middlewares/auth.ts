// ─────────────────────────────────────────────────────────────
// Autenticación / autorización para Edge Functions
// ─────────────────────────────────────────────────────────────
import { verificarToken } from '../security/jwt.ts';

/**
 * Valida que el header x-admin-secret coincida con la variable de entorno.
 */
export function validarAdminSecret(req: Request): boolean {
  const secret = req.headers.get('x-admin-secret');
  const expected = Deno.env.get('ADMIN_SECRET') || '';
  return Boolean(secret && expected && secret === expected);
}

/**
 * Valida que el header x-cron-secret coincida con la variable de entorno.
 * Usado por el cron de Postgres para llamar a funciones internas
 * (secreto separado de ADMIN_SECRET, rotable de forma independiente).
 */
export function validarCronSecret(req: Request): boolean {
  const secret = req.headers.get('x-cron-secret');
  const expected = Deno.env.get('CRON_SECRET') || '';
  return Boolean(secret && expected && secret === expected);
}

export interface Identidad {
  esAdmin: boolean;
  clienteDni: string | null;
  prestadorId: string | null;
}

/** true si la identidad no tiene ningún rol reconocido */
export function sinAutenticar(identidad: Identidad): boolean {
  return !identidad.esAdmin && !identidad.clienteDni && !identidad.prestadorId;
}

/**
 * Resuelve la identidad a partir de un JWT verificado (Authorization: Bearer <token>)
 * en vez de confiar en headers que el propio cliente podría falsificar
 * (x-cliente-dni / x-prestador-id). Admin sigue usando x-admin-secret, sin cambios.
 */
export async function resolverIdentidadJwt(req: Request): Promise<Identidad> {
  const esAdmin = validarAdminSecret(req);
  if (esAdmin) return { esAdmin: true, clienteDni: null, prestadorId: null };

  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return { esAdmin: false, clienteDni: null, prestadorId: null };

  const claims = await verificarToken(token);
  if (!claims) return { esAdmin: false, clienteDni: null, prestadorId: null };

  return {
    esAdmin: false,
    clienteDni: claims.rol === 'cliente' ? claims.sub : null,
    prestadorId: claims.rol === 'prestador' ? (claims.prestador_id ?? null) : null,
  };
}
