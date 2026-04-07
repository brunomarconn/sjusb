// ─────────────────────────────────────────────────────────────
// Edge Function: generar-pago
// POST /functions/v1/generar-pago
// Genera el link de pago para una orden en estado 'draft'.
// Transición: draft → payment_pending
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin, registrarEvento } from '../_shared/supabase-admin.ts';
import { corsPreflightResponse, okResponse, errorResponse } from '../_shared/cors.ts';
import { validarTransicion } from '../_shared/state-machine.ts';
import { getPaymentProvider } from '../_shared/payment-provider.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  try {
    const { orden_id } = await req.json();
    if (!orden_id) return errorResponse('orden_id es requerido');

    const supabase = getSupabaseAdmin();

    // ── Obtener la orden ───────────────────────────────────
    const { data: orden, error: fetchError } = await supabase
      .from('ordenes')
      .select('*')
      .eq('id', orden_id)
      .single();

    if (fetchError || !orden) return errorResponse('Orden no encontrada', 404);

    // Idempotencia: si ya tiene link activo, devolverlo directamente
    if (orden.estado === 'payment_pending' && orden.pago_link) {
      return okResponse({ pago_link: orden.pago_link, orden, ya_generado: true });
    }

    // ── Validar transición de estado ───────────────────────
    try {
      validarTransicion(orden.estado, 'payment_pending');
    } catch (e) {
      return errorResponse(String(e), 409);
    }

    // ── Obtener URLs ───────────────────────────────────────
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const webhookUrl = `${supabaseUrl}/functions/v1/webhook-pago`;

    // ── Generar pago en la pasarela ─────────────────────────
    const provider = await getPaymentProvider();

    const resultado = await provider.crearPago({
      ordenId: orden.id,
      item: {
        titulo: orden.titulo,
        descripcion: orden.descripcion || orden.titulo,
        monto: orden.monto_bruto,
      },
      clienteEmail: orden.cliente_email ?? undefined,
      successUrl: `${appUrl}/orden/${orden.id}?pago=exitoso`,
      failureUrl:  `${appUrl}/orden/${orden.id}?pago=error`,
      pendingUrl:  `${appUrl}/orden/${orden.id}?pago=pendiente`,
      webhookUrl,
    });

    // ── Actualizar la orden ────────────────────────────────
    const { data: ordenActualizada, error: updateError } = await supabase
      .from('ordenes')
      .update({
        estado: 'payment_pending',
        pago_link: resultado.linkPago,
        pago_preferencia_id: resultado.preferenciaId,
        pago_metadata: resultado.metadata ?? {},
      })
      .eq('id', orden.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // ── Registrar evento ───────────────────────────────────
    await registrarEvento(supabase, {
      ordenId: orden.id,
      tipo: 'pago_generado',
      estadoAnterior: 'draft',
      estadoNuevo: 'payment_pending',
      datos: {
        preferencia_id: resultado.preferenciaId,
        pago_link: resultado.linkPago,
        proveedor: Deno.env.get('PAYMENT_MODE') ?? 'mock',
      },
      creadoPor: 'sistema',
    });

    return okResponse({
      pago_link: resultado.linkPago,
      preferencia_id: resultado.preferenciaId,
      orden: ordenActualizada,
    });
  } catch (err) {
    console.error('[generar-pago]', err);
    return errorResponse('Error al generar el pago', 500, String(err));
  }
});
