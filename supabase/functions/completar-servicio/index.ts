// ─────────────────────────────────────────────────────────────
// Edge Function: completar-servicio
// POST /functions/v1/completar-servicio
// Marca el servicio como realizado. Solo admin.
// Transición: paid_pending_service → service_completed
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsPreflightResponse } from '../_shared/middlewares/cors.ts';
import { validarAdminSecret } from '../_shared/middlewares/auth.ts';
import { okResponse, errorResponse } from '../_shared/utils/responses.ts';
import {
  completarServicio,
  ValidacionError,
  OrdenNoEncontradaError,
  TransicionInvalidaError,
} from '../_shared/services/ordenesService.ts';
import type { CompletarServicioInput } from '../_shared/dto/ordenes.dto.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  if (!validarAdminSecret(req)) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const body = (await req.json()) as CompletarServicioInput;
    const db = getSupabaseAdmin();
    const ordenActualizada = await completarServicio(db, body);

    return okResponse({
      mensaje: 'Servicio marcado como completado. Podés liberar los fondos.',
      orden: ordenActualizada,
    });
  } catch (err) {
    if (err instanceof ValidacionError) return errorResponse(err.message, 400);
    if (err instanceof OrdenNoEncontradaError) return errorResponse(err.message, 404);
    if (err instanceof TransicionInvalidaError) return errorResponse(err.message, 409);
    console.error('[completar-servicio]', err);
    return errorResponse('Error interno', 500, String(err));
  }
});
