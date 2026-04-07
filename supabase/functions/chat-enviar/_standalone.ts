// ─── VERSIÓN STANDALONE (para pegar en el Dashboard de Supabase) ───
// Función: chat-enviar
// Nombre a usar: chat-enviar

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
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
    const { conversacion_id, contenido } = body as { conversacion_id?: string; contenido?: string };

    if (!conversacion_id)                  return err('conversacion_id requerido', 400);
    if (!contenido || !contenido.trim())   return err('contenido requerido', 400);
    if (contenido.trim().length > 2000)    return err('Mensaje demasiado largo (máx. 2000)', 400);

    const { data: conv, error: convError } = await supabase
      .from('conversaciones').select('id,cliente_dni,prestador_id,no_leidos_cliente,no_leidos_prestador')
      .eq('id', conversacion_id).single();
    if (convError || !conv) return err('Conversación no encontrada', 404);

    if (!esAdmin) {
      if (clienteDni  && conv.cliente_dni  !== clienteDni)  return err('Acceso denegado', 403);
      if (prestadorId && conv.prestador_id !== prestadorId) return err('Acceso denegado', 403);
    }

    const sender_tipo = esAdmin ? 'admin' : clienteDni ? 'cliente' : 'prestador';
    const sender_id   = esAdmin ? 'admin' : (clienteDni ?? prestadorId ?? 'unknown');

    const { data: mensaje, error: msgError } = await supabase
      .from('mensajes')
      .insert({ conversacion_id, sender_tipo, sender_id, contenido: contenido.trim(), tipo: 'text' })
      .select('id,conversacion_id,sender_tipo,sender_id,contenido,tipo,created_at').single();
    if (msgError) throw msgError;

    const incCliente   = sender_tipo !== 'cliente'   ? 1 : 0;
    const incPrestador = sender_tipo !== 'prestador' ? 1 : 0;

    await supabase.from('conversaciones').update({
      ultimo_mensaje_at:        new Date().toISOString(),
      ultimo_mensaje_contenido: contenido.trim().slice(0, 120),
      ultimo_mensaje_sender:    sender_tipo,
      no_leidos_cliente:        conv.no_leidos_cliente   + incCliente,
      no_leidos_prestador:      conv.no_leidos_prestador + incPrestador,
    }).eq('id', conversacion_id);

    return ok({ mensaje }, 201);
  } catch (e) {
    console.error('[chat-enviar]', e);
    return err('Error interno', 500, String(e));
  }
});
