// ─────────────────────────────────────────────────────────────
// Edge Function: actualizar-estado-trabajo
// POST /functions/v1/actualizar-estado-trabajo
// Público, protegido por posesión del job_token. Un token solo puede
// mutar el estado de SU trabajo (nunca el de otro, nunca métricas
// del prestador directamente — eso lo hacen los triggers de la DB).
// Body: { job_token, estado }
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsPreflightResponse } from '../_shared/middlewares/cors.ts';
import { okResponse, errorResponse } from '../_shared/utils/responses.ts';
import {
  actualizarEstado,
  TrabajoNoEncontradoError,
  TransicionInvalidaError,
  ValidacionError,
} from '../_shared/services/trabajoEstadoService.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  try {
    const { job_token, estado } = await req.json();
    if (!job_token || !estado) return errorResponse('Faltan job_token o estado', 400);

    const db = getSupabaseAdmin();
    const trabajo = await actualizarEstado(db, job_token, estado);
    return okResponse(trabajo);
  } catch (err) {
    if (err instanceof TrabajoNoEncontradoError) return errorResponse(err.message, 404);
    if (err instanceof ValidacionError) return errorResponse(err.message, 400);
    if (err instanceof TransicionInvalidaError) return errorResponse(err.message, err.status);
    console.error('[actualizar-estado-trabajo]', err);
    return errorResponse('Error interno', 500, String(err));
  }
});
