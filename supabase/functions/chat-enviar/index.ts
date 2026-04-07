// ─────────────────────────────────────────────────────────────
// Edge Function: chat-enviar
// POST /functions/v1/chat-enviar
//
// Envía un mensaje dentro de una conversación.
// Actualiza el snapshot y los contadores de no leídos en conversaciones.
//
// Body: { conversacion_id: string, contenido: string }
//
// Acceso:
//   - Cliente: solo en conversaciones donde él participa
//   - Prestador: solo en conversaciones donde él participa
//   - Admin: en cualquier conversación
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

    // ── Leer body ──────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const { conversacion_id, contenido } = body as {
      conversacion_id?: string;
      contenido?: string;
    };

    if (!conversacion_id) return errorResponse('conversacion_id requerido', 400);
    if (!contenido || contenido.trim().length === 0) return errorResponse('contenido requerido', 400);
    if (contenido.trim().length > 2000) return errorResponse('Mensaje demasiado largo (máx. 2000 caracteres)', 400);

    // ── Verificar que la conversación existe y el usuario participa ──
    const { data: conv, error: convError } = await supabase
      .from('conversaciones')
      .select('id, cliente_dni, prestador_id, no_leidos_cliente, no_leidos_prestador')
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

    // ── Determinar sender ──────────────────────────────────
    const sender_tipo = esAdmin ? 'admin' : clienteDni ? 'cliente' : 'prestador';
    const sender_id   = esAdmin ? 'admin' : (clienteDni ?? prestadorId ?? 'unknown');

    // ── Insertar mensaje ───────────────────────────────────
    const { data: mensaje, error: msgError } = await supabase
      .from('mensajes')
      .insert({
        conversacion_id,
        sender_tipo,
        sender_id,
        contenido: contenido.trim(),
        tipo:      'text',
      })
      .select('id, conversacion_id, sender_tipo, sender_id, contenido, tipo, created_at')
      .single();

    if (msgError) throw msgError;

    // ── Actualizar snapshot y contadores de no leídos ──────
    // Quien NO es el remitente recibe el incremento
    const ahora     = new Date().toISOString();
    const preview   = contenido.trim().slice(0, 120);

    const incrementoCliente   = (sender_tipo !== 'cliente') ? 1 : 0;
    const incrementoPrestador = (sender_tipo !== 'prestador') ? 1 : 0;

    await supabase
      .from('conversaciones')
      .update({
        ultimo_mensaje_at:        ahora,
        ultimo_mensaje_contenido: preview,
        ultimo_mensaje_sender:    sender_tipo,
        no_leidos_cliente:        conv.no_leidos_cliente   + incrementoCliente,
        no_leidos_prestador:      conv.no_leidos_prestador + incrementoPrestador,
      })
      .eq('id', conversacion_id);

    return okResponse({ mensaje }, 201);
  } catch (err) {
    console.error('[chat-enviar]', err);
    return errorResponse('Error interno', 500, String(err));
  }
});
