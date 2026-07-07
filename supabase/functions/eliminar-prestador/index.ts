// ─────────────────────────────────────────────────────────────
// Edge Function: eliminar-prestador
// POST /functions/v1/eliminar-prestador
// Elimina un prestador y datos relacionados. Solo admin.
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsPreflightResponse } from '../_shared/middlewares/cors.ts';
import { validarAdminSecret } from '../_shared/middlewares/auth.ts';
import { okResponse, errorResponse } from '../_shared/utils/responses.ts';
import { getErrorMessage } from '../_shared/utils/errors.ts';
import {
  eliminarPrestador,
  PrestadorNoEncontradoError,
  EliminacionFallidaError,
} from '../_shared/services/eliminarPrestadorService.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  if (!validarAdminSecret(req)) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const { prestador_id } = await req.json();
    const prestadorId = String(prestador_id || '').trim();
    if (!prestadorId) return errorResponse('prestador_id es requerido');

    const db = getSupabaseAdmin();
    const resultado = await eliminarPrestador(db, prestadorId);
    return okResponse({ ok: true, prestador_id: resultado.prestador_id });
  } catch (err) {
    if (err instanceof PrestadorNoEncontradoError) return errorResponse(err.message, 404);
    if (err instanceof EliminacionFallidaError) return errorResponse(err.message, 409);
    console.error('[eliminar-prestador]', err);
    return errorResponse('Error al eliminar prestador', 500, getErrorMessage(err));
  }
});
