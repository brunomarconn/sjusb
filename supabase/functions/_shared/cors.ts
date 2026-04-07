// ─────────────────────────────────────────────────────────────
// CORS + helpers de respuesta para todas las Edge Functions
// ─────────────────────────────────────────────────────────────

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-admin-secret, x-cliente-dni, x-prestador-id',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
};

/** Respuesta exitosa en JSON */
export function okResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Respuesta de error en JSON */
export function errorResponse(
  message: string,
  status = 400,
  details?: unknown
): Response {
  const body: Record<string, unknown> = { error: message };
  if (details !== undefined) body.details = details;
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Respuesta preflight CORS */
export function corsPreflightResponse(): Response {
  return new Response('ok', { headers: corsHeaders });
}

/**
 * Valida que el header x-admin-secret coincida con la variable de entorno.
 * Retorna true si es válido, false si no.
 */
export function validarAdminSecret(req: Request): boolean {
  const secret = req.headers.get('x-admin-secret');
  const expected = Deno.env.get('ADMIN_SECRET') || '';
  return Boolean(secret && expected && secret === expected);
}
