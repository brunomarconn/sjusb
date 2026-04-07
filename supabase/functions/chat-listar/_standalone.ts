// ─── VERSIÓN STANDALONE (para pegar en el Dashboard de Supabase) ───
// Función: chat-listar
// Nombre a usar: chat-listar

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
    const url        = new URL(req.url);
    const supabase   = getAdmin();
    const esAdmin    = isAdmin(req);
    const clienteDni = req.headers.get('x-cliente-dni');
    const prestadorId = req.headers.get('x-prestador-id');

    if (!esAdmin && !clienteDni && !prestadorId) return err('Se requiere autenticación', 401);

    let query = supabase
      .from('conversaciones')
      .select(`id, orden_id, cliente_dni, prestador_id, ultimo_mensaje_at, ultimo_mensaje_contenido, ultimo_mensaje_sender, no_leidos_cliente, no_leidos_prestador, created_at, ordenes(id,titulo,estado), prestadores(id,nombre,apellido)`)
      .order('ultimo_mensaje_at', { ascending: false, nullsFirst: false });

    if (esAdmin) {
      const d = url.searchParams.get('cliente_dni');
      const p = url.searchParams.get('prestador_id');
      if (d) query = query.eq('cliente_dni', d);
      if (p) query = query.eq('prestador_id', p);
    } else if (clienteDni) {
      query = query.eq('cliente_dni', clienteDni);
    } else if (prestadorId) {
      query = query.eq('prestador_id', prestadorId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const conversaciones = (data ?? []).map((conv: Record<string, unknown>) => {
      const orden     = conv.ordenes as Record<string, unknown> | null;
      const prestador = conv.prestadores as Record<string, unknown> | null;
      let no_leidos = 0;
      if (esAdmin)          no_leidos = (conv.no_leidos_cliente as number) + (conv.no_leidos_prestador as number);
      else if (clienteDni)  no_leidos = conv.no_leidos_cliente as number;
      else if (prestadorId) no_leidos = conv.no_leidos_prestador as number;
      return {
        id: conv.id, orden_id: conv.orden_id, cliente_dni: conv.cliente_dni, prestador_id: conv.prestador_id,
        ultimo_mensaje_at: conv.ultimo_mensaje_at, ultimo_mensaje_contenido: conv.ultimo_mensaje_contenido,
        ultimo_mensaje_sender: conv.ultimo_mensaje_sender, no_leidos, created_at: conv.created_at,
        orden_titulo: orden?.titulo ?? '', orden_estado: orden?.estado ?? '',
        prestador_nombre: prestador?.nombre ?? '', prestador_apellido: prestador?.apellido ?? '',
      };
    });

    return ok({ conversaciones });
  } catch (e) {
    console.error('[chat-listar]', e);
    return err('Error interno', 500, String(e));
  }
});
