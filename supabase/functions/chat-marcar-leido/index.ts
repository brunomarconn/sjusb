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
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsPreflightResponse } from '../_shared/middlewares/cors.ts';
import { resolverIdentidad, sinAutenticar } from '../_shared/middlewares/auth.ts';
import { okResponse, errorResponse } from '../_shared/utils/responses.ts';
import { marcarLeido, ValidacionError, NoEncontradoError, AccesoDenegadoError } from '../_shared/services/chatService.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  try {
    const identidad = resolverIdentidad(req);
    if (sinAutenticar(identidad)) return errorResponse('Se requiere autenticación', 401);

    const db = getSupabaseAdmin();
    const body = await req.json().catch(() => ({}));
    const { conversacion_id } = body as { conversacion_id?: string };

    await marcarLeido(db, identidad, conversacion_id ?? '');
    return okResponse({ ok: true });
  } catch (err) {
    if (err instanceof ValidacionError) return errorResponse(err.message, 400);
    if (err instanceof NoEncontradoError) return errorResponse(err.message, 404);
    if (err instanceof AccesoDenegadoError) return errorResponse(err.message, 403);
    console.error('[chat-marcar-leido]', err);
    return errorResponse('Error interno', 500, String(err));
  }
});
