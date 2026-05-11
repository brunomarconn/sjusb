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
import { getSupabaseAdmin } from '../_shared/supabase-admin.ts';
import { getPaymentProvider } from '../_shared/payment-provider.ts';
import { corsPreflightResponse, okResponse, errorResponse } from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  try {
    const body = await req.json().catch(() => ({}));
    console.log('[mp-webhook-comision] Webhook recibido:', JSON.stringify(body));

    if (body.type !== 'payment') {
      return okResponse({ skipped: true, tipo: body.type });
    }

    const provider = await getPaymentProvider();
    const pago = await provider.procesarWebhook(body);

    if (pago.estado !== 'approved') {
      console.log('[mp-webhook-comision] Pago no aprobado:', pago.estado);
      return okResponse({ skipped: true, estado: pago.estado });
    }

    // external_reference tiene formato "comision_<uuid>"
    const extRef = pago.referenciaExterna ?? '';
    if (!extRef.startsWith('comision_')) {
      console.log('[mp-webhook-comision] Referencia no es de comisión:', extRef);
      return okResponse({ skipped: true, ref: extRef });
    }

    const comisionId = extRef.replace('comision_', '');
    const db = getSupabaseAdmin();

    const { error } = await db
      .from('comisiones')
      .update({
        estado: 'comision_pagada',
        mp_payment_id: pago.pagoId,
        mp_payment_estado: pago.estado,
        pagado_at: new Date().toISOString(),
      })
      .eq('id', comisionId);

    if (error) throw error;

    console.log('[mp-webhook-comision] Comisión marcada como pagada:', comisionId);
    return okResponse({ ok: true, comision_id: comisionId });

  } catch (err) {
    console.error('[mp-webhook-comision] Excepción:', err);
    return errorResponse('Error interno', 500, String(err));
  }
});
