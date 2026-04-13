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
import {
  corsPreflightResponse,
  okResponse,
  errorResponse,
} from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  try {
    const body = await req.json().catch(() => ({}));
    const {
      prestador_nombre,
      prestador_apellido,
      prestador_categoria,
      nombre,
      apellido,
      telefono,
      dia,
      turno,
    } = body as Record<string, string>;

    if (!nombre || !apellido || !telefono || !dia || !turno) {
      return errorResponse('Faltan campos requeridos', 400);
    }

    const resendApiKey      = Deno.env.get('RESEND_API_KEY');
    const notificationEmail = Deno.env.get('NOTIFICATION_EMAIL');

    if (!resendApiKey || !notificationEmail) {
      console.warn('[enviar-reserva] Faltan env vars:', { resendApiKey: Boolean(resendApiKey), notificationEmail: Boolean(notificationEmail) });
      return okResponse({ skipped: true });
    }

    const diaFormateado = new Date(dia + 'T12:00:00').toLocaleDateString('es-AR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const emailPayload = {
      from: 'MServicios <onboarding@resend.dev>',
      to: [notificationEmail],
      subject: `Nueva reserva: ${nombre} ${apellido} → ${prestador_nombre ?? ''} ${prestador_apellido ?? ''}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a1a2e;color:#fff;padding:32px;border-radius:12px;">
          <div style="text-align:center;margin-bottom:24px;">
            <h1 style="color:#e2b040;margin:0;">MServicios</h1>
            <p style="color:#9ca3af;margin:4px 0;">Nueva reserva recibida</p>
          </div>

          <div style="background:#16213e;border:1px solid #e2b040;border-radius:8px;padding:20px;margin-bottom:16px;">
            <h2 style="color:#e2b040;margin:0 0 12px;">Cliente</h2>
            <p style="margin:6px 0;"><strong>Nombre:</strong> ${nombre} ${apellido}</p>
            <p style="margin:6px 0;"><strong>Teléfono:</strong> ${telefono}</p>
          </div>

          <div style="background:#16213e;border:1px solid #e2b040;border-radius:8px;padding:20px;margin-bottom:16px;">
            <h2 style="color:#e2b040;margin:0 0 12px;">Reserva</h2>
            <p style="margin:6px 0;"><strong>Prestador:</strong> ${prestador_nombre ?? '-'} ${prestador_apellido ?? ''}</p>
            <p style="margin:6px 0;"><strong>Servicio:</strong> ${prestador_categoria ?? '-'}</p>
            <p style="margin:6px 0;"><strong>Fecha:</strong> ${diaFormateado}</p>
            <p style="margin:6px 0;"><strong>Turno:</strong> ${turno === 'mañana' ? '🌅 Mañana' : '🌆 Tarde'}</p>
          </div>

          <div style="background:#e2b040;border-radius:8px;padding:16px;text-align:center;">
            <p style="color:#1a1a2e;font-weight:bold;margin:0;">
              💰 Recordá cobrar los $3.000 por este trabajo una vez realizado.
            </p>
          </div>

          <p style="color:#6b7280;font-size:12px;text-align:center;margin-top:20px;">
            ${new Date().toLocaleString('es-AR')}
          </p>
        </div>
      `,
    };

    console.log('[enviar-reserva] Enviando email a:', notificationEmail);
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const resBody = await res.text();
    if (!res.ok) {
      console.error('[enviar-reserva] Error Resend', res.status, ':', resBody);
      return errorResponse('Error al enviar email', 500, resBody);
    }

    console.log('[enviar-reserva] Email enviado OK:', resBody);
    return okResponse({ sent: true });

  } catch (err) {
    console.error('[enviar-reserva] Excepción:', err);
    return errorResponse('Error interno', 500, String(err));
  }
});
