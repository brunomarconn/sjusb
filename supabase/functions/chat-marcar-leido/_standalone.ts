// ─── VERSIÓN STANDALONE (para pegar en el Dashboard de Supabase) ───
// Función: chat-marcar-leido
// Nombre a usar: chat-marcar-leido

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret, x-cliente-dni, x-prestador-id',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
};

function ok(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function err(message: string, status = 400, details?: unknown) {
  const body: Record<string, unknown> = { error: message };
  if (details !== undefined) body.details = details;
  return new Response(JSON.string ify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function getAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );
}

function isAdmin(req: Request) {
  const secret = req.headers.get('x-admin-secret');
  const expected = Deno.env.get('ADMIN_SECRET') || '';
  return Boolean(secret && expected && secret === expected);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase    = getAdmin();
    const esAdmin     = isAdmin(req);
    const clienteDni  = req.headers.get('x-cliente-dni');
    const prestadorId = req.headers.get('x-prestador-id');

    if (!esAdmin && !clienteDni && !prestadorId) return err('Se requiere autenticación', 401);

    const body = await req.json().catch(() => ({}));
    const { conversacion_id } = body as { conversacion_id?: string };
    if (!conversacion_id) return err('conversacion_id requerido', 400);

    const { data: conv, error: convError } = await supabase
      .from('conversaciones').select('id,cliente_dni,prestador_id').eq('id', conversacion_id).single();
    if (convError || !conv) return err('Conversación no encontrada', 404);

    if (!esAdmin) {
      if (clienteDni  && conv.cliente_dni  !== clienteDni)  return err('Acceso denegado', 403);
      if (prestadorId && conv.prestador_id !== prestadorId) return err('Acceso denegado', 403);
    }

    const updates: Record<string, number> = {};
    if (esAdmin)          { updates.no_leidos_cliente = 0; updates.no_leidos_prestador = 0; }
    else if (clienteDni)  { updates.no_leidos_cliente = 0; }
    else if (prestadorId) { updates.no_leidos_prestador = 0; }

    const { error: updateError } = await supabase.from('conversaciones').update(updates).eq('id', conversacion_id);
    if (updateError) throw updateError;

    return ok({ ok: true });
  } catch (e) {
    console.error('[chat-marcar-leido]', e);
    return err('Error interno', 500, String(e));
  }
});
