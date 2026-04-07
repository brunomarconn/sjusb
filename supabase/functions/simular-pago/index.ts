// ─────────────────────────────────────────────────────────────
// Edge Function: simular-pago
// POST /functions/v1/simular-pago
// Solo disponible en PAYMENT_MODE=mock.
// Simula la aprobación o rechazo de un pago enviando un webhook
// a la misma función webhook-pago internamente.
//
// Body: { orden_id: string, estado?: "approved" | "rejected" }
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  corsPreflightResponse,
  okResponse,
  errorResponse,
} from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  // ── Solo disponible en modo mock ───────────────────────
  const paymentMode = Deno.env.get('PAYMENT_MODE') ?? 'mock';
  if (paymentMode !== 'mock') {
    return errorResponse('Este endpoint solo está disponible en modo mock', 403);
  }

  try {
    const { orden_id, estado = 'approved' } = await req.json();
    if (!orden_id) return errorResponse('orden_id es requerido');

    if (!['approved', 'rejected', 'cancelled'].includes(estado)) {
      return errorResponse('estado debe ser: approved, rejected o cancelled');
    }

    // ── Construir el payload del webhook mock ──────────────
    const pagoId = `MOCK-PAY-${Date.now()}`;
    const webhookPayload = {
      ordenId: orden_id,
      pagoId,
      estado,
    };

    // ── Llamar internamente al webhook-pago ────────────────
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookUrl  = `${supabaseUrl}/functions/v1/webhook-pago`;

    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // El service role key se usa para autenticar la llamada interna
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`webhook-pago respondió ${resp.status}: ${text}`);
    }

    return okResponse({
      mensaje: `Pago simulado (${estado}) enviado al webhook.`,
      pago_id: pagoId,
      orden_id,
      estado,
    });
  } catch (err) {
    console.error('[simular-pago]', err);
    return errorResponse('Error al simular el pago', 500, String(err));
  }
});
