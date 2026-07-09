// ─────────────────────────────────────────────────────────────
// Edge Function: panel-prestador
// POST /functions/v1/panel-prestador
// Devuelve el panel completo del prestador (datos + trabajos + membresías).
// Acepta:
//   - Authorization: Bearer <jwt>  (login por DNI existente)
//   - body: { provider_token }     (link tokenizado /p/:providerToken, sin login)
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsPreflightResponse } from '../_shared/middlewares/cors.ts';
import { resolverIdentidadJwt } from '../_shared/middlewares/auth.ts';
import { okResponse, errorResponse } from '../_shared/utils/responses.ts';
import { obtenerPanel, NoAutorizadoError, PrestadorNoEncontradoError } from '../_shared/services/panelPrestadorService.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  try {
    const body = await req.json().catch(() => ({}));
    const identidad = await resolverIdentidadJwt(req);

    const db = getSupabaseAdmin();
    const panel = await obtenerPanel(db, {
      providerToken: body.provider_token ?? null,
      prestadorId: identidad.prestadorId,
    });
    return okResponse(panel);
  } catch (err) {
    if (err instanceof NoAutorizadoError) return errorResponse(err.message, 401);
    if (err instanceof PrestadorNoEncontradoError) return errorResponse(err.message, 404);
    console.error('[panel-prestador]', err);
    return errorResponse('Error interno', 500, String(err));
  }
});
