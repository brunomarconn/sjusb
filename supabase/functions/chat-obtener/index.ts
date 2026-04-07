// ============================================================
// Edge Function: chat-obtener
// GET /functions/v1/chat-obtener
//
// Soporta:
//   - ?orden_id=...         -> abre/crea el chat de una orden
//   - ?conversacion_id=...  -> abre una conversacion existente
//   - ?prestador_id=...     -> abre/crea conversacion directa cliente<->prestador
// ============================================================
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin } from '../_shared/supabase-admin.ts';
import {
  corsPreflightResponse,
  okResponse,
  errorResponse,
  validarAdminSecret,
} from '../_shared/cors.ts';

type ConversacionRow = {
  id: string;
  orden_id: string | null;
  cliente_dni: string;
  prestador_id: string;
  no_leidos_cliente: number;
  no_leidos_prestador: number;
  [key: string]: unknown;
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  try {
    const url = new URL(req.url);
    const supabase = getSupabaseAdmin();

    const esAdmin = validarAdminSecret(req);
    const clienteDni = req.headers.get('x-cliente-dni');
    const prestadorId = req.headers.get('x-prestador-id');

    if (!esAdmin && !clienteDni && !prestadorId) {
      return errorResponse('Se requiere autenticación', 401);
    }

    const ordenId = url.searchParams.get('orden_id');
    const conversacionId = url.searchParams.get('conversacion_id');
    const prestadorDestinoId = url.searchParams.get('prestador_id');

    if (!ordenId && !conversacionId && !prestadorDestinoId) {
      return errorResponse('Se requiere orden_id, conversacion_id o prestador_id', 400);
    }

    async function validarAccesoConversacion(conv: ConversacionRow) {
      if (esAdmin) return null;
      if (clienteDni && conv.cliente_dni !== clienteDni) {
        return errorResponse('Acceso denegado', 403);
      }
      if (prestadorId && conv.prestador_id !== prestadorId) {
        return errorResponse('Acceso denegado', 403);
      }
      return null;
    }

    async function cargarMensajes(convId: string) {
      const { data, error } = await supabase
        .from('mensajes')
        .select('id, conversacion_id, sender_tipo, sender_id, contenido, tipo, created_at')
        .eq('conversacion_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data ?? [];
    }

    async function marcarLeido(conv: ConversacionRow) {
      if (esAdmin) return conv;

      if (clienteDni && conv.no_leidos_cliente > 0) {
        await supabase.from('conversaciones').update({ no_leidos_cliente: 0 }).eq('id', conv.id);
        conv.no_leidos_cliente = 0;
      } else if (prestadorId && conv.no_leidos_prestador > 0) {
        await supabase.from('conversaciones').update({ no_leidos_prestador: 0 }).eq('id', conv.id);
        conv.no_leidos_prestador = 0;
      }

      return conv;
    }

    async function responderConversacion(conv: ConversacionRow) {
      await marcarLeido(conv);
      const mensajes = await cargarMensajes(conv.id);

      if (conv.orden_id) {
        const { data: orden } = await supabase
          .from('ordenes')
          .select('titulo, estado')
          .eq('id', conv.orden_id)
          .maybeSingle();

        return okResponse({
          conversacion: {
            ...conv,
            orden_titulo: orden?.titulo ?? '',
            orden_estado: orden?.estado ?? '',
          },
          mensajes,
        });
      }

      const { data: prestador } = await supabase
        .from('prestadores')
        .select('nombre, apellido')
        .eq('id', conv.prestador_id)
        .maybeSingle();

      const nombrePrestador = prestador
        ? `${prestador.nombre} ${prestador.apellido}`.trim()
        : 'Prestador';

      return okResponse({
        conversacion: {
          ...conv,
          orden_titulo: `Consulta a ${nombrePrestador}`,
          orden_estado: '',
        },
        mensajes,
      });
    }

    if (conversacionId) {
      const { data: conv, error } = await supabase
        .from('conversaciones')
        .select('*')
        .eq('id', conversacionId)
        .single();

      if (error || !conv) return errorResponse('Conversación no encontrada', 404);

      const acceso = await validarAccesoConversacion(conv as ConversacionRow);
      if (acceso) return acceso;

      return responderConversacion(conv as ConversacionRow);
    }

    if (prestadorDestinoId) {
      if (!clienteDni) {
        return errorResponse('Solo clientes pueden iniciar una conversación directa', 403);
      }

      const { data: prestador, error: prestadorError } = await supabase
        .from('prestadores')
        .select('id, nombre, apellido')
        .eq('id', prestadorDestinoId)
        .single();

      if (prestadorError || !prestador) {
        return errorResponse('Prestador no encontrado', 404);
      }

      let { data: conv, error: convError } = await supabase
        .from('conversaciones')
        .select('*')
        .eq('cliente_dni', clienteDni)
        .eq('prestador_id', prestadorDestinoId)
        .is('orden_id', null)
        .maybeSingle();

      if (convError) throw convError;

      if (!conv) {
        const { data: nueva, error: createError } = await supabase
          .from('conversaciones')
          .insert({
            orden_id: null,
            cliente_dni: clienteDni,
            prestador_id: prestadorDestinoId,
          })
          .select('*')
          .single();

        if (createError) throw createError;
        conv = nueva;
      }

      return okResponse({
        conversacion: {
          ...(await marcarLeido(conv as ConversacionRow)),
          orden_titulo: `Consulta a ${`${prestador.nombre} ${prestador.apellido}`.trim()}`,
          orden_estado: '',
        },
        mensajes: await cargarMensajes(conv.id),
      });
    }

    const { data: orden, error: ordenError } = await supabase
      .from('ordenes')
      .select('id, titulo, cliente_dni, prestador_id, estado')
      .eq('id', ordenId)
      .single();

    if (ordenError || !orden) {
      return errorResponse('Orden no encontrada', 404);
    }

    if (!esAdmin) {
      if (clienteDni && orden.cliente_dni !== clienteDni) {
        return errorResponse('Acceso denegado', 403);
      }
      if (prestadorId && orden.prestador_id !== prestadorId) {
        return errorResponse('Acceso denegado', 403);
      }
    }

    let { data: conv, error: convError } = await supabase
      .from('conversaciones')
      .select('*')
      .eq('orden_id', ordenId)
      .maybeSingle();

    if (convError) throw convError;

    if (!conv) {
      const { data: nueva, error: createError } = await supabase
        .from('conversaciones')
        .insert({
          orden_id: ordenId,
          cliente_dni: orden.cliente_dni,
          prestador_id: orden.prestador_id,
        })
        .select('*')
        .single();

      if (createError) throw createError;
      conv = nueva;
    }

    await marcarLeido(conv as ConversacionRow);
    const mensajes = await cargarMensajes(conv.id);

    return okResponse({
      conversacion: {
        ...conv,
        orden_titulo: orden.titulo,
        orden_estado: orden.estado,
      },
      mensajes,
    });
  } catch (err) {
    console.error('[chat-obtener]', err);
    return errorResponse('Error interno', 500, String(err));
  }
});
