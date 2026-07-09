// ─────────────────────────────────────────────────────────────
// Edge Function: obtener-trabajo
// POST /functions/v1/obtener-trabajo
// Público, protegido por posesión del job_token (largo, no adivinable).
// Body: { job_token }
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsPreflightResponse } from '../_shared/middlewares/cors.ts';
import { okResponse, errorResponse } from '../_shared/utils/responses.ts';
import { obtenerPorToken, TrabajoNoEncontradoError } from '../_shared/services/trabajoEstadoService.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  try {
    const { job_token } = await req.json();
    if (!job_token) return errorResponse('Falta job_token', 400);

    const db = getSupabaseAdmin();
    const trabajo = await obtenerPorToken(db, job_token);
    return okResponse(trabajo);
  } catch (err) {
    if (err instanceof TrabajoNoEncontradoError) return errorResponse(err.message, 404);
    console.error('[obtener-trabajo]', err);
    return errorResponse('Error interno', 500, String(err));
  }
});
