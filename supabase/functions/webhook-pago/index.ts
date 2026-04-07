// ─────────────────────────────────────────────────────────────
// Edge Function: webhook-pago
// POST /functions/v1/webhook-pago
// Recibe notificaciones de la pasarela de pago.
// Transición: payment_pending → paid_pending_service (si aprobado)
//
// IMPORTANTE: Siempre retorna HTTP 200 a la pasarela para evitar reintentos.
// Los errores se loguean internamente.
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin, registrarEvento } from '../_shared/supabase-admin.ts';
import { corsPreflightResponse } from '../_shared/cors.ts';
import { getPaymentProvider } from '../_shared/payment-provider.ts';

// Siempre 200 a la pasarela
const OK = new Response('ok', { status: 200 });

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    // Body inválido — ignorar silenciosamente
    return OK;
  }

  try {
    const provider = await getPaymentProvider();
    const supabase = getSupabaseAdmin();

    // ── Parsear el webhook ─────────────────────────────────
    let webhookData;
    try {
      webhookData = await provider.procesarWebhook(body);
    } catch (e) {
      // Puede ser un tipo de notificación que no manejamos (p.ej. "merchant_order")
      console.warn('[webhook-pago] Webhook no procesable:', String(e));
      return OK;
    }

    if (!webhookData.referenciaExterna) {
      console.warn('[webhook-pago] Sin external_reference:', JSON.stringify(webhookData));
      return OK;
    }

    // ── Buscar la orden por ID (external_reference = orden.id) ───
    const { data: orden } = await supabase
      .from('ordenes')
      .select('id, estado, pago_referencia_externa, cliente_dni, monto_bruto')
      .eq('id', webhookData.referenciaExterna)
      .maybeSingle();

    if (!orden) {
      console.warn('[webhook-pago] Orden no encontrada para ref:', webhookData.referenciaExterna);
      return OK;
    }

    // ── Idempotencia: ignorar si ya se procesó este pago ──
    if (
      orden.pago_referencia_externa &&
      orden.pago_referencia_externa === webhookData.pagoId
    ) {
      console.info('[webhook-pago] Pago duplicado ignorado:', webhookData.pagoId);
      return OK;
    }

    // ── Procesar según estado del pago ─────────────────────
    if (webhookData.estado === 'approved') {
      // Solo transicionar si la orden está en un estado previo correcto
      if (orden.estado !== 'draft' && orden.estado !== 'payment_pending') {
        console.warn(
          `[webhook-pago] Orden ${orden.id} ya en estado ${orden.estado}, ignorando pago aprobado`
        );
        return OK;
      }

      // Actualizar a paid_pending_service
      const { error: updateError } = await supabase
        .from('ordenes')
        .update({
          estado: 'paid_pending_service',
          pago_referencia_externa: webhookData.pagoId,
          paid_at: new Date().toISOString(),
          pago_metadata: {
            pago_id: webhookData.pagoId,
            monto_pagado: webhookData.monto,
            ...(webhookData.metadata ?? {}),
          },
        })
        .eq('id', orden.id);

      if (updateError) {
        console.error('[webhook-pago] Error al actualizar orden:', updateError);
        return OK;
      }

      await registrarEvento(supabase, {
        ordenId: orden.id,
        tipo: 'pago_confirmado',
        estadoAnterior: orden.estado,
        estadoNuevo: 'paid_pending_service',
        datos: {
          pago_id: webhookData.pagoId,
          monto: webhookData.monto,
          ...(webhookData.metadata ?? {}),
        },
        creadoPor: 'webhook',
      });

      // ─────────────────────────────────────────────────────
      // 🎯 HOOK FUTURO — Sistema de Puntos
      // Cuando el pago se confirma, se podría emitir un evento
      // para notificar al sistema de puntos que hay un servicio pagado.
      // Descomentar cuando se implemente:
      //
      // await notificarSistemaPuntos(supabase, {
      //   clienteDni: orden.cliente_dni,
      //   ordenId: orden.id,
      //   evento: 'pago_confirmado',
      //   monto: orden.monto_bruto,
      // });
      // ─────────────────────────────────────────────────────

    } else if (webhookData.estado === 'rejected' || webhookData.estado === 'cancelled') {
      // Registrar el evento pero no cambiar estado de la orden
      await registrarEvento(supabase, {
        ordenId: orden.id,
        tipo: `pago_${webhookData.estado}`,
        estadoAnterior: orden.estado,
        estadoNuevo: orden.estado, // Sin cambio
        datos: { pago_id: webhookData.pagoId, ...(webhookData.metadata ?? {}) },
        creadoPor: 'webhook',
      });
    }

    return OK;
  } catch (err) {
    console.error('[webhook-pago] Error inesperado:', err);
    // Siempre 200 para que la pasarela no reintente
    return OK;
  }
});
