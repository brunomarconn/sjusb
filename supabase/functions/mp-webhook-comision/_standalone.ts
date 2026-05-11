// ── Archivo único para deploy desde el dashboard de Supabase ──
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
};
const ok  = (d: unknown) => new Response(JSON.stringify(d), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const err = (m: string, s = 400) => new Response(JSON.stringify({ error: m }), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

function getDB() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
}

async function obtenerPagoMP(pagoId: string) {
  const token = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
  if (!token) throw new Error('Falta MERCADOPAGO_ACCESS_TOKEN');
  const resp = await fetch(`https://api.mercadopago.com/v1/payments/${pagoId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`MP error ${resp.status}`);
  return resp.json();
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    console.log('[mp-webhook-comision] Recibido:', JSON.stringify(body));

    if (body.type !== 'payment') return ok({ skipped: true, tipo: body.type });

    const pagoId = body?.data?.id;
    if (!pagoId) return ok({ skipped: true, razon: 'sin data.id' });

    const pago = await obtenerPagoMP(String(pagoId));
    console.log('[mp-webhook-comision] Estado pago:', pago.status, '| ref:', pago.external_reference);

    if (pago.status !== 'approved') return ok({ skipped: true, estado: pago.status });

    const extRef = pago.external_reference ?? '';
    if (!extRef.startsWith('comision_')) return ok({ skipped: true, ref: extRef });

    const comisionId = extRef.replace('comision_', '');
    const db = getDB();

    const { error } = await db.from('comisiones').update({
      estado: 'comision_pagada',
      mp_payment_id: String(pago.id),
      mp_payment_estado: pago.status,
      pagado_at: new Date().toISOString(),
    }).eq('id', comisionId);

    if (error) throw error;

    console.log('[mp-webhook-comision] Comisión pagada:', comisionId);
    return ok({ ok: true, comision_id: comisionId });

  } catch (e) {
    console.error('[mp-webhook-comision]', e);
    return err('Error interno', 500);
  }
});
