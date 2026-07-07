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
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsPreflightResponse } from '../_shared/middlewares/cors.ts';
import { resolverIdentidadJwt, sinAutenticar } from '../_shared/middlewares/auth.ts';
import { okResponse, errorResponse } from '../_shared/utils/responses.ts';
import { listarConversaciones } from '../_shared/services/chatService.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  try {
    const url = new URL(req.url);
    const identidad = await resolverIdentidadJwt(req);
    if (sinAutenticar(identidad)) return errorResponse('Se requiere autenticación', 401);

    const db = getSupabaseAdmin();
    const conversaciones = await listarConversaciones(db, identidad, {
      cliente_dni: url.searchParams.get('cliente_dni'),
      prestador_id: url.searchParams.get('prestador_id'),
    });

    return okResponse({ conversaciones });
  } catch (err) {
    console.error('[chat-listar]', err);
    return errorResponse('Error interno', 500, String(err));
  }
});
