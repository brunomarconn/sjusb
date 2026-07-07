// ─────────────────────────────────────────────────────────────
// Autenticación / autorización para Edge Functions
// ─────────────────────────────────────────────────────────────

/**
 * Valida que el header x-admin-secret coincida con la variable de entorno.
 */
export function validarAdminSecret(req: Request): boolean {
  const secret = req.headers.get('x-admin-secret');
  const expected = Deno.env.get('ADMIN_SECRET') || '';
  return Boolean(secret && expected && secret === expected);
}

export interface Identidad {
  esAdmin: boolean;
  clienteDni: string | null;
  prestadorId: string | null;
}

/**
 * Resuelve la identidad del requester a partir de los headers
 * (x-admin-secret / x-cliente-dni / x-prestador-id). No lanza error
 * si no hay ninguna — el llamador decide si es obligatoria.
 */
export function resolverIdentidad(req: Request): Identidad {
  return {
    esAdmin: validarAdminSecret(req),
    clienteDni: req.headers.get('x-cliente-dni'),
    prestadorId: req.headers.get('x-prestador-id'),
  };
}

/** true si la identidad no tiene ningún rol reconocido */
export function sinAutenticar(identidad: Identidad): boolean {
  return !identidad.esAdmin && !identidad.clienteDni && !identidad.prestadorId;
}
