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
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsPreflightResponse } from '../_shared/middlewares/cors.ts';
import { resolverIdentidadJwt, sinAutenticar } from '../_shared/middlewares/auth.ts';
import { okResponse, errorResponse } from '../_shared/utils/responses.ts';
import { enviarMensaje, ValidacionError, NoEncontradoError, AccesoDenegadoError } from '../_shared/services/chatService.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  try {
    const identidad = await resolverIdentidadJwt(req);
    if (sinAutenticar(identidad)) return errorResponse('Se requiere autenticación', 401);

    const db = getSupabaseAdmin();
    const body = await req.json().catch(() => ({}));
    const { conversacion_id, contenido } = body as { conversacion_id?: string; contenido?: string };

    const mensaje = await enviarMensaje(db, identidad, {
      conversacion_id: conversacion_id ?? '',
      contenido: contenido ?? '',
    });

    return okResponse({ mensaje }, 201);
  } catch (err) {
    if (err instanceof ValidacionError) return errorResponse(err.message, 400);
    if (err instanceof NoEncontradoError) return errorResponse(err.message, 404);
    if (err instanceof AccesoDenegadoError) return errorResponse(err.message, 403);
    console.error('[chat-enviar]', err);
    return errorResponse('Error interno', 500, String(err));
  }
});
