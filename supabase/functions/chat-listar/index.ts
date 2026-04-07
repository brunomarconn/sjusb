// ─────────────────────────────────────────────────────────────
// Edge Function: chat-listar
// GET /functions/v1/chat-listar
//
// Lista las conversaciones del usuario con:
//   - datos de la orden y prestador
//   - snapshot del último mensaje
//   - contador de no leídos para el usuario solicitante
//
// Query params (solo admin):
//   cliente_dni   → filtrar por cliente
//   prestador_id  → filtrar por prestador
//
// Acceso:
//   - Admin (x-admin-secret): todas las conversaciones
//   - Cliente (x-cliente-dni): solo sus conversaciones
//   - Prestador (x-prestador-id): solo sus conversaciones
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin } from '../_shared/supabase-admin.ts';
import {
  corsPreflightResponse,
  okResponse,
  errorResponse,
  validarAdminSecret,
} from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  try {
    const url      = new URL(req.url);
    const supabase = getSupabaseAdmin();

    // ── Control de acceso ──────────────────────────────────
    const esAdmin    = validarAdminSecret(req);
    const clienteDni = req.headers.get('x-cliente-dni');
    const prestadorId = req.headers.get('x-prestador-id');

    if (!esAdmin && !clienteDni && !prestadorId) {
      return errorResponse('Se requiere autenticación', 401);
    }

    // ── Construir query base ───────────────────────────────
    let query = supabase
      .from('conversaciones')
      .select(`
        id,
        orden_id,
        cliente_dni,
        prestador_id,
        ultimo_mensaje_at,
        ultimo_mensaje_contenido,
        ultimo_mensaje_sender,
        no_leidos_cliente,
        no_leidos_prestador,
        created_at,
        ordenes (
          id,
          titulo,
          estado
        ),
        prestadores (
          id,
          nombre,
          apellido
        )
      `)
      .order('ultimo_mensaje_at', { ascending: false, nullsFirst: false });

    // ── Filtros por rol ────────────────────────────────────
    if (esAdmin) {
      const filtroDni       = url.searchParams.get('cliente_dni');
      const filtroPrestador = url.searchParams.get('prestador_id');
      if (filtroDni)       query = query.eq('cliente_dni', filtroDni);
      if (filtroPrestador) query = query.eq('prestador_id', filtroPrestador);
    } else if (clienteDni) {
      query = query.eq('cliente_dni', clienteDni);
    } else if (prestadorId) {
      query = query.eq('prestador_id', prestadorId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // ── Mapear respuesta: aplanar joins y calcular no_leidos ──
    const conversaciones = (data ?? []).map((conv: Record<string, unknown>) => {
      const orden     = conv.ordenes as Record<string, unknown> | null;
      const prestador = conv.prestadores as Record<string, unknown> | null;

      // No leídos relevantes para el usuario que consulta
      let no_leidos = 0;
      if (esAdmin) {
        no_leidos = (conv.no_leidos_cliente as number) + (conv.no_leidos_prestador as number);
      } else if (clienteDni) {
        no_leidos = conv.no_leidos_cliente as number;
      } else if (prestadorId) {
        no_leidos = conv.no_leidos_prestador as number;
      }

      return {
        id:                      conv.id,
        orden_id:                conv.orden_id,
        cliente_dni:             conv.cliente_dni,
        prestador_id:            conv.prestador_id,
        ultimo_mensaje_at:       conv.ultimo_mensaje_at,
        ultimo_mensaje_contenido: conv.ultimo_mensaje_contenido,
        ultimo_mensaje_sender:   conv.ultimo_mensaje_sender,
        no_leidos,
        created_at:              conv.created_at,
        orden_titulo:            orden?.titulo ?? '',
        orden_estado:            orden?.estado ?? '',
        prestador_nombre:        prestador?.nombre ?? '',
        prestador_apellido:      prestador?.apellido ?? '',
      };
    });

    return okResponse({ conversaciones });
  } catch (err) {
    console.error('[chat-listar]', err);
    return errorResponse('Error interno', 500, String(err));
  }
});
