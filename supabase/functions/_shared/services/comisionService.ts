// ─────────────────────────────────────────────────────────────
// Lógica de negocio: comisiones (procesar-comision, mp-webhook-comision)
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as reservasDao from '../dao/reservasDao.ts';
import * as comisionesDao from '../dao/comisionesDao.ts';
import { validarPuedeProcesarVencida } from '../domain/reservaEstado.ts';
import { MONTO_COMISION } from '../domain/comision.ts';
import { getPaymentProvider } from '../clients/paymentProvider.ts';
import { enviarEmail } from '../clients/resendClient.ts';
import { cobroComisionHtml } from '../utils/emailTemplates.ts';

export class ReservaNoEncontradaError extends Error {}
export class ValidacionError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Marca la reserva como trabajo_concretado, crea la comisión,
 * genera el link de pago y envía el email interno con el mensaje de WhatsApp.
 */
export async function procesarVencida(db: SupabaseClient, reservaId: string) {
  const reserva = await reservasDao.obtenerConPrestador(db, reservaId);
  if (!reserva) throw new ReservaNoEncontradaError('Reserva no encontrada');

  try {
    validarPuedeProcesarVencida(reserva);
  } catch (e) {
    const err = e as { status: number; message: string };
    throw new ValidacionError(err.message, err.status);
  }

  await reservasDao.marcarTrabajoConcretado(db, reservaId);

  const comision = await comisionesDao.crear(db, {
    reserva_id: reservaId,
    prestador_id: reserva.prestador_id,
    monto: MONTO_COMISION,
    estado: 'comision_pendiente',
  });

  const appUrl = Deno.env.get('APP_URL') || 'https://MrServicios.com';
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

    await comisionesDao.actualizarLinkPago(db, comision.id, {
      estado: 'link_pago_generado',
      mp_preference_id: mpResult.preferenciaId,
      mp_init_point: mpResult.linkPago,
      link_generado_at: new Date().toISOString(),
    });
  } catch (mpErr) {
    console.error('[comisionService.procesarVencida] Error generando MP link:', mpErr);
    // Continuar sin el link; la comisión queda en comision_pendiente
  }

  const adminEmail = Deno.env.get('NOTIFICATION_EMAIL');
  const nombrePrestador = `${reserva.prestadores?.nombre ?? ''} ${reserva.prestadores?.apellido ?? ''}`.trim();
  const telefonoPrestador = reserva.prestadores?.telefono ?? '-';
  const diaFormateado = new Date(reserva.dia + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const turnoLabel = reserva.turno === 'mañana' ? 'Mañana' : 'Tarde';
  const linkPago = mpResult?.linkPago ?? '(link no generado — configurar MercadoPago)';

  const mensajeWA = `Hola ${reserva.prestadores?.nombre ?? ''}! Se concretó la reserva del trabajo programado para el ${diaFormateado} (${turnoLabel}). Te dejamos el link para abonar la comisión correspondiente de $${MONTO_COMISION.toLocaleString('es-AR')}:\n\n${linkPago}\n\nMuchas gracias.`;

  if (adminEmail) {
    const resultado = await enviarEmail({
      to: adminEmail,
      subject: `Cobro comisión — ${nombrePrestador}`,
      html: cobroComisionHtml({
        nombrePrestador,
        telefonoPrestador,
        categoria: reserva.prestadores?.categoria,
        clienteNombre: reserva.nombre,
        clienteApellido: reserva.apellido,
        clienteTelefono: reserva.telefono,
        diaFormateado,
        turnoLabel,
        zona: reserva.zona,
        descripcionTrabajo: reserva.descripcion_trabajo,
        montoComision: MONTO_COMISION,
        linkPago,
        mensajeWA,
      }),
    });
    if (resultado.enviado) {
      await comisionesDao.marcarEmailEnviado(db, comision.id);
    } else if (!('skipped' in resultado) || !resultado.skipped) {
      console.error('[comisionService.procesarVencida] Error enviando email');
    }
  } else {
    console.warn('[comisionService.procesarVencida] Falta NOTIFICATION_EMAIL');
  }

  const comisionFinal = await comisionesDao.obtenerPorId(db, comision.id);
  return { comision: comisionFinal, mensaje_wa: mensajeWA };
}

/** Procesa una notificación de webhook de MercadoPago y marca la comisión como pagada */
export async function procesarWebhookPago(db: SupabaseClient, body: unknown) {
  const payload = body as { type?: string };
  if (payload.type !== 'payment') {
    return { skipped: true, tipo: payload.type };
  }

  const provider = await getPaymentProvider();
  const pago = await provider.procesarWebhook(body);

  if (pago.estado !== 'approved') {
    return { skipped: true, estado: pago.estado };
  }

  const extRef = pago.referenciaExterna ?? '';
  if (!extRef.startsWith('comision_')) {
    return { skipped: true, ref: extRef };
  }

  const comisionId = extRef.replace('comision_', '');
  await comisionesDao.marcarPagada(db, comisionId, pago.pagoId, pago.estado);

  return { ok: true, comision_id: comisionId };
}
