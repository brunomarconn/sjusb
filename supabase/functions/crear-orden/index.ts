// ─────────────────────────────────────────────────────────────
// Edge Function: crear-orden
// POST /functions/v1/crear-orden
// Crea una orden en estado 'draft'. Solo admin.
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsPreflightResponse } from '../_shared/middlewares/cors.ts';
import { validarAdminSecret } from '../_shared/middlewares/auth.ts';
import { okResponse, errorResponse } from '../_shared/utils/responses.ts';
import { crearOrden, ValidacionError, PrestadorNoEncontradoError } from '../_shared/services/ordenesService.ts';
import type { CrearOrdenInput } from '../_shared/dto/ordenes.dto.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  if (!validarAdminSecret(req)) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const body = (await req.json()) as CrearOrdenInput;
    const db = getSupabaseAdmin();
    const orden = await crearOrden(db, body);
    return okResponse({ orden }, 201);
  } catch (err) {
    if (err instanceof ValidacionError) return errorResponse(err.message, 400);
    if (err instanceof PrestadorNoEncontradoError) return errorResponse(err.message, 404);
    console.error('[crear-orden]', err);
    return errorResponse('Error interno al crear la orden', 500, String(err));
  }
});
