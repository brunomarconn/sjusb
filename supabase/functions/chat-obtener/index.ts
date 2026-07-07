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
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsPreflightResponse } from '../_shared/middlewares/cors.ts';
import { resolverIdentidadJwt, sinAutenticar } from '../_shared/middlewares/auth.ts';
import { okResponse, errorResponse } from '../_shared/utils/responses.ts';
import {
  obtenerPorConversacionId,
  obtenerOCrearDirecta,
  obtenerOCrearPorOrden,
  NoEncontradoError,
  AccesoDenegadoError,
} from '../_shared/services/chatService.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  try {
    const url = new URL(req.url);
    const identidad = await resolverIdentidadJwt(req);
    if (sinAutenticar(identidad)) return errorResponse('Se requiere autenticación', 401);

    const ordenId = url.searchParams.get('orden_id');
    const conversacionId = url.searchParams.get('conversacion_id');
    const prestadorDestinoId = url.searchParams.get('prestador_id');

    if (!ordenId && !conversacionId && !prestadorDestinoId) {
      return errorResponse('Se requiere orden_id, conversacion_id o prestador_id', 400);
    }

    const db = getSupabaseAdmin();

    if (conversacionId) {
      return okResponse(await obtenerPorConversacionId(db, identidad, conversacionId));
    }

    if (prestadorDestinoId) {
      return okResponse(await obtenerOCrearDirecta(db, identidad, prestadorDestinoId));
    }

    return okResponse(await obtenerOCrearPorOrden(db, identidad, ordenId as string));
  } catch (err) {
    if (err instanceof NoEncontradoError) return errorResponse(err.message, 404);
    if (err instanceof AccesoDenegadoError) return errorResponse(err.message, 403);
    console.error('[chat-obtener]', err);
    return errorResponse('Error interno', 500, String(err));
  }
});
