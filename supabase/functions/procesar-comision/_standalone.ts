// ── Archivo único para deploy desde el dashboard de Supabase ──
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── CORS ──────────────────────────────────────────────────────
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret, x-prestador-id',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
};
const ok  = (d: unknown) => new Response(JSON.stringify(d), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const err = (m: string, s = 400, d?: unknown) => new Response(JSON.stringify({ error: m, details: d }), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

// ── Supabase admin ────────────────────────────────────────────
function getDB() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
}

// ── MercadoPago ───────────────────────────────────────────────
async function crearPreferencia(comisionId: string, descripcion: string, appUrl: string): Promise<{ linkPago: string; preferenciaId: string } | null> {
  const token = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
  if (!token) return null;

  const body = {
    items: [{ id: `comision_${comisionId}`, title: 'Comisión por reserva concretada', description: descripcion, quantity: 1, unit_price: 3000, currency_id: 'ARS' }],
    back_urls: { success: `${appUrl}/prestadores?pago=ok`, failure: `${appUrl}/prestadores?pago=error`, pending: `${appUrl}/prestadores?pago=pendiente` },
    notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mp-webhook-comision`,
    external_reference: `comision_${comisionId}`,
    statement_descriptor: 'SERVICIOSYA',
    auto_return: 'approved',
  };

  const resp = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) throw new Error(`MP error ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  return { linkPago: data.init_point, preferenciaId: data.id };
}

// ── Handler principal ─────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Validar admin secret
  const secret = req.headers.get('x-admin-secret');
  if (!secret || secret !== Deno.env.get('ADMIN_SECRET')) return err('No autorizado', 401);

  try {
    const { reserva_id } = await req.json();
    if (!reserva_id) return err('Falta reserva_id', 400);

    const db = getDB();

    // 1. Obtener reserva + prestador
    const { data: reserva, error: rErr } = await db
      .from('reservas')
      .select('*, prestadores(id, nombre, apellido, categoria, telefono)')
      .eq('id', reserva_id)
      .maybeSingle();

    if (rErr) throw rErr;
    if (!reserva) return err('Reserva no encontrada', 404);
    if (reserva.estado !== 'reserva_activa') return err(`Ya está en estado "${reserva.estado}"`, 409);

    // 2. Verificar fecha vencida (UTC-3 Argentina)
    const hoyAR = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (reserva.dia >= hoyAR) return err('La reserva aún no venció', 422);

    // 3. Marcar trabajo_concretado
    await db.from('reservas').update({ estado: 'trabajo_concretado', trabajo_concretado_at: new Date().toISOString() }).eq('id', reserva_id);

    // 4. Crear comisión
    const { data: comision, error: cErr } = await db
      .from('comisiones')
      .insert({ reserva_id, prestador_id: reserva.prestador_id, monto: 3000, estado: 'comision_pendiente' })
      .select().single();
    if (cErr) throw cErr;

    // 5. Generar link MP
    const appUrl = Deno.env.get('APP_URL') || 'https://serviciosya.com';
    const descripcionMP = `${reserva.prestadores?.categoria ?? 'Servicio'} – ${reserva.dia} ${reserva.turno}`;
    let mpResult = null;
    try {
      mpResult = await crearPreferencia(comision.id, descripcionMP, appUrl);
      if (mpResult) {
        await db.from('comisiones').update({
          estado: 'link_pago_generado',
          mp_preference_id: mpResult.preferenciaId,
          mp_init_point: mpResult.linkPago,
          link_generado_at: new Date().toISOString(),
        }).eq('id', comision.id);
      }
    } catch (mpErr) {
      console.error('[procesar-comision] Error MP:', mpErr);
    }

    // 6. Email al admin
    const resendKey  = Deno.env.get('RESEND_API_KEY');
    const adminEmail = Deno.env.get('NOTIFICATION_EMAIL');
    const p = reserva.prestadores;
    const nombreP = `${p?.nombre ?? ''} ${p?.apellido ?? ''}`.trim();
    const diaFmt  = new Date(reserva.dia + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const turnoFmt = reserva.turno === 'mañana' ? 'Mañana' : 'Tarde';
    const link     = mpResult?.linkPago ?? '(configurar MercadoPago)';

    const mensajeWA = `Hola ${p?.nombre ?? ''}! Se concretó la reserva del trabajo programado para el ${diaFmt} (${turnoFmt}). Te dejamos el link para abonar la comisión correspondiente de $3.000:\n\n${link}\n\nMuchas gracias.`;

    if (resendKey && adminEmail) {
      try {
        const emailResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'ServiciosYa <onboarding@resend.dev>',
            to: [adminEmail],
            subject: `Cobro comisión — ${nombreP}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a1a2e;color:#fff;padding:32px;border-radius:12px;">
                <h1 style="color:#e2b040;margin:0 0 8px;">ServiciosYa</h1>
                <p style="color:#9ca3af;margin:0 0 24px;">Comisión generada automáticamente</p>
                <div style="background:#16213e;border:1px solid #e2b040;border-radius:8px;padding:20px;margin-bottom:16px;">
                  <h2 style="color:#e2b040;margin:0 0 12px;">Prestador</h2>
                  <p style="margin:4px 0;"><strong>Nombre:</strong> ${nombreP}</p>
                  <p style="margin:4px 0;"><strong>Teléfono:</strong> ${p?.telefono ?? '-'}</p>
                  <p style="margin:4px 0;"><strong>Servicio:</strong> ${p?.categoria ?? '-'}</p>
                </div>
                <div style="background:#16213e;border:1px solid #e2b040;border-radius:8px;padding:20px;margin-bottom:16px;">
                  <h2 style="color:#e2b040;margin:0 0 12px;">Reserva</h2>
                  <p style="margin:4px 0;"><strong>Cliente:</strong> ${reserva.nombre} ${reserva.apellido}</p>
                  <p style="margin:4px 0;"><strong>Tel. cliente:</strong> ${reserva.telefono}</p>
                  <p style="margin:4px 0;"><strong>Fecha:</strong> ${diaFmt}</p>
                  <p style="margin:4px 0;"><strong>Turno:</strong> ${turnoFmt}</p>
                  ${reserva.zona ? `<p style="margin:4px 0;"><strong>Zona:</strong> ${reserva.zona}</p>` : ''}
                  ${reserva.descripcion_trabajo ? `<p style="margin:4px 0;"><strong>Trabajo:</strong> ${reserva.descripcion_trabajo}</p>` : ''}
                </div>
                <div style="background:#16213e;border:1px solid #e2b040;border-radius:8px;padding:20px;margin-bottom:16px;">
                  <h2 style="color:#e2b040;margin:0 0 8px;">Comisión: $3.000</h2>
                  <a href="${link}" style="background:#e2b040;color:#1a1a2e;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">Cobrar ahora</a>
                </div>
                <div style="background:#0f2d0f;border:1px solid #4ade80;border-radius:8px;padding:20px;">
                  <h3 style="color:#4ade80;margin:0 0 8px;">Mensaje WhatsApp listo para copiar</h3>
                  <p style="color:#d1fae5;font-size:13px;line-height:1.6;white-space:pre-line;">${mensajeWA}</p>
                </div>
              </div>`,
          }),
        });
        if (emailResp.ok) await db.from('comisiones').update({ email_enviado: true }).eq('id', comision.id);
      } catch (e) { console.error('[email]', e); }
    }

    const { data: final } = await db.from('comisiones').select('*').eq('id', comision.id).single();
    return ok({ comision: final, mensaje_wa: mensajeWA });

  } catch (e) {
    console.error('[procesar-comision]', e);
    return err('Error interno', 500, String(e));
  }
});
