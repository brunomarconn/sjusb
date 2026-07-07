// ─────────────────────────────────────────────────────────────
// Edge Function: mp-webhook-comision
// POST /functions/v1/mp-webhook-comision  (sin autenticación — llamado por MercadoPago)
//
// Recibe notificaciones de pago de MercadoPago y marca la
// comisión correspondiente como pagada.
//
// MercadoPago envía: { type: "payment", data: { id: "12345" }, ... }
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsPreflightResponse } from '../_shared/middlewares/cors.ts';
import { okResponse, errorResponse } from '../_shared/utils/responses.ts';
import { procesarWebhookPago } from '../_shared/services/comisionService.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  try {
    const body = await req.json().catch(() => ({}));
    console.log('[mp-webhook-comision] Webhook recibido:', JSON.stringify(body));

    const db = getSupabaseAdmin();
    const resultado = await procesarWebhookPago(db, body);
    return okResponse(resultado);
  } catch (err) {
    console.error('[mp-webhook-comision] Excepción:', err);
    return errorResponse('Error interno', 500, String(err));
  }
});
