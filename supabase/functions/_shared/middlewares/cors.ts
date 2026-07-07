// ─────────────────────────────────────────────────────────────
// CORS para todas las Edge Functions
// ─────────────────────────────────────────────────────────────

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-admin-secret, x-cliente-dni, x-prestador-id',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
};

/** Respuesta preflight CORS */
export function corsPreflightResponse(): Response {
  return new Response('ok', { headers: corsHeaders });
}
