// ─────────────────────────────────────────────────────────────
// Edge Function: enviar-reserva
// POST /functions/v1/enviar-reserva  (--no-verify-jwt)
//
// Solo envía el email de notificación. La reserva ya fue
// guardada en la DB por el cliente antes de llamar a esta función.
//
// Variables de entorno necesarias:
//   RESEND_API_KEY      → API key de Resend (resend.com)
//   NOTIFICATION_EMAIL  → Email de destino
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsPreflightResponse } from '../_shared/middlewares/cors.ts';
import { okResponse, errorResponse } from '../_shared/utils/responses.ts';
import { notificarNuevaReserva, ValidacionError } from '../_shared/services/reservaNotificacionService.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  try {
    const body = await req.json().catch(() => ({}));
    const resultado = await notificarNuevaReserva(body);
    return okResponse(resultado);
  } catch (err) {
    if (err instanceof ValidacionError) return errorResponse(err.message, 400);
    console.error('[enviar-reserva]', err);
    const details = (err as { details?: string })?.details;
    if (details !== undefined) return errorResponse((err as Error).message, 500, details);
    return errorResponse('Error interno', 500, String(err));
  }
});
