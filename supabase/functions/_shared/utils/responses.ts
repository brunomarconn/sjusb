// ─────────────────────────────────────────────────────────────
// Helpers de respuesta HTTP compartidos por todos los controllers
// ─────────────────────────────────────────────────────────────
import { corsHeaders } from '../middlewares/cors.ts';

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
