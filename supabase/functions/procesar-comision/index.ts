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
import { getSupabaseAdmin } from '../_shared/supabase-admin.ts';
import {
  corsPreflightResponse,
  okResponse,
  errorResponse,
  validarAdminSecret,
} from '../_shared/cors.ts';
import { getPaymentProvider } from '../_shared/payment-provider.ts';

const MONTO_COMISION = 3000;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  if (!validarAdminSecret(req)) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const { reserva_id } = await req.json();
    if (!reserva_id) return errorResponse('Falta reserva_id', 400);

    const db = getSupabaseAdmin();

    // 1. Obtener reserva + prestador
    const { data: reserva, error: rErr } = await db
      .from('reservas')
      .select('*, prestadores(id, nombre, apellido, categoria, telefono)')
      .eq('id', reserva_id)
      .maybeSingle();

    if (rErr) throw rErr;
    if (!reserva) return errorResponse('Reserva no encontrada', 404);

    if (reserva.estado !== 'reserva_activa') {
      return errorResponse(`La reserva ya está en estado "${reserva.estado}"`, 409);
    }

    // 2. Verificar que la fecha ya pasó (UTC-3 Argentina)
    const ahoraAR = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const hoyAR = ahoraAR.toISOString().slice(0, 10);
    if (reserva.dia >= hoyAR) {
      return errorResponse('La reserva aún no venció (fecha futura o de hoy)', 422);
    }

    // 3. Marcar como trabajo_concretado
    const { error: updErr } = await db
      .from('reservas')
      .update({ estado: 'trabajo_concretado', trabajo_concretado_at: new Date().toISOString() })
      .eq('id', reserva_id);
    if (updErr) throw updErr;

    // 4. Crear comisión
    const { data: comision, error: cErr } = await db
      .from('comisiones')
      .insert({
        reserva_id,
        prestador_id: reserva.prestador_id,
        monto: MONTO_COMISION,
        estado: 'comision_pendiente',
      })
      .select()
      .single();
    if (cErr) throw cErr;

    // 5. Generar link de MercadoPago
    const appUrl = Deno.env.get('APP_URL') || 'https://serviciosya.com';
    const provider = await getPaymentProvider();

    let mpResult: { linkPago: string; preferenciaId: string } | null = null;
    try {
      mpResult = await provider.crearPago({
        ordenId: `comision_${comision.id}`,
        item: {
          titulo: 'Comisión por reserva concretada',
          descripcion: `Reserva de ${reserva.prestadores?.categoria} – ${reserva.dia} ${reserva.turno}`,
          monto: MONTO_COMISION,
        },
        clienteEmail: undefined,
        successUrl: `${appUrl}/prestadores?pago=ok`,
        failureUrl: `${appUrl}/prestadores?pago=error`,
        pendingUrl: `${appUrl}/prestadores?pago=pendiente`,
        webhookUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mp-webhook-comision`,
      });

      await db.from('comisiones').update({
        estado: 'link_pago_generado',
        mp_preference_id: mpResult.preferenciaId,
        mp_init_point: mpResult.linkPago,
        link_generado_at: new Date().toISOString(),
      }).eq('id', comision.id);
    } catch (mpErr) {
      console.error('[procesar-comision] Error generando MP link:', mpErr);
      // Continuar sin el link; la comisión queda en comision_pendiente
    }

    // 6. Enviar email al administrador
    const resendKey  = Deno.env.get('RESEND_API_KEY');
    const adminEmail = Deno.env.get('NOTIFICATION_EMAIL');

    const nombrePrestador = `${reserva.prestadores?.nombre ?? ''} ${reserva.prestadores?.apellido ?? ''}`.trim();
    const telefonoPrestador = reserva.prestadores?.telefono ?? '-';
    const diaFormateado = new Date(reserva.dia + 'T12:00:00').toLocaleDateString('es-AR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const turnoLabel = reserva.turno === 'mañana' ? 'Mañana' : 'Tarde';
    const linkPago = mpResult?.linkPago ?? '(link no generado — configurar MercadoPago)';

    const mensajeWA = `Hola ${reserva.prestadores?.nombre ?? ''}! Se concretó la reserva del trabajo programado para el ${diaFormateado} (${turnoLabel}). Te dejamos el link para abonar la comisión correspondiente de $${MONTO_COMISION.toLocaleString('es-AR')}:\n\n${linkPago}\n\nMuchas gracias.`;

    if (resendKey && adminEmail) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'ServiciosYa <onboarding@resend.dev>',
            to: [adminEmail],
            subject: `Cobro comisión — ${nombrePrestador}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a1a2e;color:#fff;padding:32px;border-radius:12px;">
                <h1 style="color:#e2b040;margin:0 0 8px;">ServiciosYa</h1>
                <p style="color:#9ca3af;margin:0 0 24px;">Comisión generada automáticamente</p>

                <div style="background:#16213e;border:1px solid #e2b040;border-radius:8px;padding:20px;margin-bottom:16px;">
                  <h2 style="color:#e2b040;margin:0 0 12px;">Prestador</h2>
                  <p style="margin:4px 0;"><strong>Nombre:</strong> ${nombrePrestador}</p>
                  <p style="margin:4px 0;"><strong>Teléfono:</strong> ${telefonoPrestador}</p>
                  <p style="margin:4px 0;"><strong>Servicio:</strong> ${reserva.prestadores?.categoria ?? '-'}</p>
                </div>

                <div style="background:#16213e;border:1px solid #e2b040;border-radius:8px;padding:20px;margin-bottom:16px;">
                  <h2 style="color:#e2b040;margin:0 0 12px;">Reserva</h2>
                  <p style="margin:4px 0;"><strong>Cliente:</strong> ${reserva.nombre} ${reserva.apellido}</p>
                  <p style="margin:4px 0;"><strong>Teléfono cliente:</strong> ${reserva.telefono}</p>
                  <p style="margin:4px 0;"><strong>Fecha:</strong> ${diaFormateado}</p>
                  <p style="margin:4px 0;"><strong>Turno:</strong> ${turnoLabel}</p>
                  ${reserva.zona ? `<p style="margin:4px 0;"><strong>Zona:</strong> ${reserva.zona}</p>` : ''}
                  ${reserva.descripcion_trabajo ? `<p style="margin:4px 0;"><strong>Trabajo:</strong> ${reserva.descripcion_trabajo}</p>` : ''}
                </div>

                <div style="background:#16213e;border:1px solid #e2b040;border-radius:8px;padding:20px;margin-bottom:16px;">
                  <h2 style="color:#e2b040;margin:0 0 12px;">Comisión</h2>
                  <p style="margin:4px 0;font-size:24px;font-weight:bold;color:#e2b040;">$${MONTO_COMISION.toLocaleString('es-AR')}</p>
                  <p style="margin:8px 0;">
                    <a href="${linkPago}" style="background:#e2b040;color:#1a1a2e;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">
                      Cobrar ahora
                    </a>
                  </p>
                </div>

                <div style="background:#0f2d0f;border:1px solid #4ade80;border-radius:8px;padding:20px;">
                  <h3 style="color:#4ade80;margin:0 0 8px;">Mensaje para copiar y enviar por WhatsApp</h3>
                  <p style="color:#d1fae5;font-size:13px;line-height:1.6;white-space:pre-line;">${mensajeWA}</p>
                </div>
              </div>
            `,
          }),
        });

        await db.from('comisiones').update({ email_enviado: true }).eq('id', comision.id);
      } catch (emailErr) {
        console.error('[procesar-comision] Error enviando email:', emailErr);
      }
    } else {
      console.warn('[procesar-comision] Faltan RESEND_API_KEY o NOTIFICATION_EMAIL');
    }

    // 7. Retornar comisión actualizada
    const { data: comisionFinal } = await db
      .from('comisiones')
      .select('*')
      .eq('id', comision.id)
      .single();

    return okResponse({ comision: comisionFinal, mensaje_wa: mensajeWA });

  } catch (err) {
    console.error('[procesar-comision] Excepción:', err);
    return errorResponse('Error interno', 500, String(err));
  }
});
