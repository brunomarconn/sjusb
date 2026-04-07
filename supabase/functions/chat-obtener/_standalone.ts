// ─── VERSIÓN STANDALONE (para pegar en el Dashboard de Supabase) ───
// Función: chat-obtener
// Nombre a usar: chat-obtener

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
    const url         = new URL(req.url);
    const supabase    = getAdmin();
    const esAdmin     = isAdmin(req);
    const clienteDni  = req.headers.get('x-cliente-dni');
    const prestadorId = req.headers.get('x-prestador-id');

    if (!esAdmin && !clienteDni && !prestadorId) return err('Se requiere autenticación', 401);

    const ordenId = url.searchParams.get('orden_id');
    if (!ordenId) return err('Parámetro orden_id requerido', 400);

    const { data: orden, error: ordenError } = await supabase
      .from('ordenes').select('id,titulo,cliente_dni,prestador_id,estado').eq('id', ordenId).single();
    if (ordenError || !orden) return err('Orden no encontrada', 404);

    if (!esAdmin) {
      if (clienteDni  && orden.cliente_dni  !== clienteDni)  return err('Acceso denegado', 403);
      if (prestadorId && orden.prestador_id !== prestadorId) return err('Acceso denegado', 403);
    }

    let { data: conv, error: convError } = await supabase
      .from('conversaciones').select('*').eq('orden_id', ordenId).maybeSingle();
    if (convError) throw convError;

    if (!conv) {
      const { data: nueva, error: createError } = await supabase
        .from('conversaciones')
        .insert({ orden_id: ordenId, cliente_dni: orden.cliente_dni, prestador_id: orden.prestador_id })
        .select('*').single();
      if (createError) throw createError;
      conv = nueva;
    }

    const { data: mensajes, error: msgError } = await supabase
      .from('mensajes').select('id,conversacion_id,sender_tipo,sender_id,contenido,tipo,created_at')
      .eq('conversacion_id', conv.id).order('created_at', { ascending: true });
    if (msgError) throw msgError;

    if (!esAdmin) {
      if (clienteDni && conv.no_leidos_cliente > 0) {
        await supabase.from('conversaciones').update({ no_leidos_cliente: 0 }).eq('id', conv.id);
        conv.no_leidos_cliente = 0;
      } else if (prestadorId && conv.no_leidos_prestador > 0) {
        await supabase.from('conversaciones').update({ no_leidos_prestador: 0 }).eq('id', conv.id);
        conv.no_leidos_prestador = 0;
      }
    }

    return ok({ conversacion: { ...conv, orden_titulo: orden.titulo, orden_estado: orden.estado }, mensajes: mensajes ?? [] });
  } catch (e) {
    console.error('[chat-obtener]', e);
    return err('Error interno', 500, String(e));
  }
});
