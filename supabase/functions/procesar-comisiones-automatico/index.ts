// ─────────────────────────────────────────────────────────────
// Edge Function: procesar-comisiones-automatico
// POST /functions/v1/procesar-comisiones-automatico
//
// Detecta todas las reservas vencidas y las procesa en un solo
// llamado (crea comisión + link de pago para cada una). La llama
// tanto el botón "Procesar todas" del admin (x-admin-secret) como
// el cron diario de Postgres (x-cron-secret).
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsPreflightResponse } from '../_shared/middlewares/cors.ts';
import { validarAdminSecret, validarCronSecret } from '../_shared/middlewares/auth.ts';
import { okResponse, errorResponse } from '../_shared/utils/responses.ts';
import { procesarTodasVencidas } from '../_shared/services/comisionService.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  if (!validarAdminSecret(req) && !validarCronSecret(req)) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const db = getSupabaseAdmin();
    const resultado = await procesarTodasVencidas(db);
    return okResponse(resultado);
  } catch (err) {
    console.error('[procesar-comisiones-automatico]', err);
    return errorResponse('Error interno', 500, String(err));
  }
});
