// ─────────────────────────────────────────────────────────────
// Cliente de Resend (envío de emails transaccionales)
// Requiere env RESEND_API_KEY. Si falta, enviarEmail() devuelve
// { skipped: true } en lugar de lanzar, igual que el comportamiento
// original de enviar-reserva.
// ─────────────────────────────────────────────────────────────

export interface EnviarEmailInput {
  to: string;
  subject: string;
  html: string;
}

export type EnviarEmailResultado =
  | { enviado: true }
  | { enviado: false; skipped: true }
  | { enviado: false; skipped: false; error: string };

export async function enviarEmail(input: EnviarEmailInput): Promise<EnviarEmailResultado> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    console.warn('[resendClient] Falta RESEND_API_KEY, no se envía email');
    return { enviado: false, skipped: true };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'MrServicios <onboarding@resend.dev>',
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
  });

  const resBody = await res.text();
  if (!res.ok) {
    console.error('[resendClient] Error Resend', res.status, ':', resBody);
    return { enviado: false, skipped: false, error: resBody };
  }

  return { enviado: true };
}
