// ─────────────────────────────────────────────────────────────
// Edge Function: chat-marcar-leido
// POST /functions/v1/chat-marcar-leido
//
// Pone en cero el contador de no leídos del usuario solicitante
// para una conversación determinada.
//
// Body: { conversacion_id: string }
//
// Acceso:
//   - Cliente: solo su contador (no_leidos_cliente = 0)
//   - Prestador: solo su contador (no_leidos_prestador = 0)
//   - Admin: ambos contadores
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
    const supabase = getSupabaseAdmin();

    // ── Control de acceso ──────────────────────────────────
    const esAdmin     = validarAdminSecret(req);
    const clienteDni  = req.headers.get('x-cliente-dni');
    const prestadorId = req.headers.get('x-prestador-id');

    if (!esAdmin && !clienteDni && !prestadorId) {
      return errorResponse('Se requiere autenticación', 401);
    }

    const body = await req.json().catch(() => ({}));
    const { conversacion_id } = body as { conversacion_id?: string };

    if (!conversacion_id) return errorResponse('conversacion_id requerido', 400);

    // ── Verificar pertenencia ──────────────────────────────
    const { data: conv, error: convError } = await supabase
      .from('conversaciones')
      .select('id, cliente_dni, prestador_id')
      .eq('id', conversacion_id)
      .single();

    if (convError || !conv) {
      return errorResponse('Conversación no encontrada', 404);
    }

    if (!esAdmin) {
      if (clienteDni && conv.cliente_dni !== clienteDni) {
        return errorResponse('Acceso denegado', 403);
      }
      if (prestadorId && conv.prestador_id !== prestadorId) {
        return errorResponse('Acceso denegado', 403);
      }
    }

    // ── Resetear contadores ────────────────────────────────
    const updates: Record<string, number> = {};
    if (esAdmin) {
      updates.no_leidos_cliente   = 0;
      updates.no_leidos_prestador = 0;
    } else if (clienteDni) {
      updates.no_leidos_cliente = 0;
    } else if (prestadorId) {
      updates.no_leidos_prestador = 0;
    }

    const { error: updateError } = await supabase
      .from('conversaciones')
      .update(updates)
      .eq('id', conversacion_id);

    if (updateError) throw updateError;

    return okResponse({ ok: true });
  } catch (err) {
    console.error('[chat-marcar-leido]', err);
    return errorResponse('Error interno', 500, String(err));
  }
});
