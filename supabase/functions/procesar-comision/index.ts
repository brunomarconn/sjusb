// ─────────────────────────────────────────────────────────────
// Edge Function: procesar-comision
// POST /functions/v1/procesar-comision  (requiere x-admin-secret)
//
// Cuando una reserva activa llega a su fecha/turno sin cancelación:
//   1. Marca la reserva como trabajo_concretado
//   2. Crea comisión de $3000
//   3. Genera link de pago en MercadoPago
//   4. Envía email interno con link y mensaje WhatsApp listo
//
// Variables de entorno necesarias:
//   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
//   ADMIN_SECRET
//   PAYMENT_MODE          → "mock" | "mercadopago"
//   MERCADOPAGO_ACCESS_TOKEN
//   APP_URL               → URL pública del frontend
//   RESEND_API_KEY
//   NOTIFICATION_EMAIL
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsPreflightResponse } from '../_shared/middlewares/cors.ts';
import { validarAdminSecret } from '../_shared/middlewares/auth.ts';
import { okResponse, errorResponse } from '../_shared/utils/responses.ts';
import { procesarVencida, ReservaNoEncontradaError, ValidacionError } from '../_shared/services/comisionService.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  if (!validarAdminSecret(req)) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const { reserva_id } = await req.json();
    if (!reserva_id) return errorResponse('Falta reserva_id', 400);

    const db = getSupabaseAdmin();
    const resultado = await procesarVencida(db, reserva_id);
    return okResponse(resultado);
  } catch (err) {
    if (err instanceof ReservaNoEncontradaError) return errorResponse(err.message, 404);
    if (err instanceof ValidacionError) return errorResponse(err.message, err.status);
    console.error('[procesar-comision] Excepción:', err);
    return errorResponse('Error interno', 500, String(err));
  }
});
