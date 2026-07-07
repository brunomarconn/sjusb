// ─────────────────────────────────────────────────────────────
// Lógica de negocio: notificación de nueva reserva (enviar-reserva)
// Sin acceso a DB — la reserva ya fue guardada por el cliente.
// ─────────────────────────────────────────────────────────────
import { enviarEmail } from '../clients/resendClient.ts';
import { nuevaReservaHtml } from '../utils/emailTemplates.ts';

export class ValidacionError extends Error {}

export interface NotificarNuevaReservaInput {
  prestador_nombre?: string;
  prestador_apellido?: string;
  prestador_categoria?: string;
  nombre: string;
  apellido: string;
  telefono: string;
  dia: string;
  turno: string;
}

export async function notificarNuevaReserva(input: NotificarNuevaReservaInput) {
  if (!input.nombre || !input.apellido || !input.telefono || !input.dia || !input.turno) {
    throw new ValidacionError('Faltan campos requeridos');
  }

  const notificationEmail = Deno.env.get('NOTIFICATION_EMAIL');
  if (!notificationEmail) {
    console.warn('[reservaNotificacionService] Falta NOTIFICATION_EMAIL');
    return { skipped: true };
  }

  const resultado = await enviarEmail({
    to: notificationEmail,
    subject: `Nueva reserva: ${input.nombre} ${input.apellido} → ${input.prestador_nombre ?? ''} ${input.prestador_apellido ?? ''}`,
    html: nuevaReservaHtml({
      nombre: input.nombre,
      apellido: input.apellido,
      telefono: input.telefono,
      dia: input.dia,
      turno: input.turno,
      prestadorNombre: input.prestador_nombre,
      prestadorApellido: input.prestador_apellido,
      prestadorCategoria: input.prestador_categoria,
    }),
  });

  if ('skipped' in resultado && resultado.skipped) return { skipped: true };
  if (!resultado.enviado) {
    const err = new Error('Error al enviar email') as Error & { details?: string };
    err.details = 'error' in resultado ? resultado.error : undefined;
    throw err;
  }
  return { sent: true };
}
