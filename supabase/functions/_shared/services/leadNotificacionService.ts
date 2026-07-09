// ─────────────────────────────────────────────────────────────
// Lógica de negocio: notificación de nuevo lead (crear-lead)
// Reemplaza a reservaNotificacionService.ts del modelo viejo.
// ─────────────────────────────────────────────────────────────
import { enviarEmail } from '../clients/resendClient.ts';
import { nuevoLeadHtml } from '../utils/emailTemplates.ts';

export interface NotificarNuevoLeadInput {
  prestador_nombre?: string;
  prestador_apellido?: string;
  prestador_categoria?: string;
  vecino_nombre: string;
  vecino_telefono: string;
  servicio_descripcion?: string;
}

export async function notificarNuevoLead(input: NotificarNuevoLeadInput) {
  const notificationEmail = Deno.env.get('NOTIFICATION_EMAIL');
  if (!notificationEmail) {
    console.warn('[leadNotificacionService] Falta NOTIFICATION_EMAIL');
    return { skipped: true };
  }

  const resultado = await enviarEmail({
    to: notificationEmail,
    subject: `Nuevo contacto: ${input.vecino_nombre} → ${input.prestador_nombre ?? ''} ${input.prestador_apellido ?? ''}`,
    html: nuevoLeadHtml({
      vecinoNombre: input.vecino_nombre,
      vecinoTelefono: input.vecino_telefono,
      prestadorNombre: input.prestador_nombre,
      prestadorApellido: input.prestador_apellido,
      prestadorCategoria: input.prestador_categoria,
      servicioDescripcion: input.servicio_descripcion,
    }),
  });

  if ('skipped' in resultado && resultado.skipped) return { skipped: true };
  if (!resultado.enviado) {
    console.error('[leadNotificacionService] Error enviando email');
    return { skipped: false, error: true };
  }
  return { sent: true };
}
