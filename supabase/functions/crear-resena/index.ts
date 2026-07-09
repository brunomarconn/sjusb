// ─────────────────────────────────────────────────────────────
// Edge Function: crear-resena
// POST /functions/v1/crear-resena
// Multiplexada:
//   { action: 'obtener', review_token }               → contexto para /resena/:token
//   { action: 'crear', review_token, rating, comment } → reseña post-trabajo
//   { action: 'crear_manual', prestador_id, nombre_cliente, rating, comment } → "valorar" sin token puntual
// Público, protegido por posesión del review_token (largo, no adivinable).
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsPreflightResponse } from '../_shared/middlewares/cors.ts';
import { okResponse, errorResponse } from '../_shared/utils/responses.ts';
import {
  obtenerContexto,
  crearResena,
  crearResenaManual,
  TrabajoNoEncontradoError,
  ResenaYaEnviadaError,
  ValidacionError,
} from '../_shared/services/resenaService.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  try {
    const body = await req.json();
    const db = getSupabaseAdmin();

    if (body.action === 'obtener') {
      if (!body.review_token) return errorResponse('Falta review_token', 400);
      const contexto = await obtenerContexto(db, body.review_token);
      return okResponse(contexto);
    }

    if (body.action === 'crear_manual') {
      const resultado = await crearResenaManual(db, {
        prestador_id: body.prestador_id,
        nombre_cliente: body.nombre_cliente,
        cliente_email: body.cliente_email,
        rating: body.rating,
        comment: body.comment,
      });
      return okResponse(resultado, 201);
    }

    if (body.action === 'crear') {
      if (!body.review_token) return errorResponse('Falta review_token', 400);
      const resultado = await crearResena(db, {
        review_token: body.review_token,
        rating: body.rating,
        comment: body.comment,
      });
      return okResponse(resultado, 201);
    }

    return errorResponse('Acción no reconocida', 400);
  } catch (err) {
    if (err instanceof TrabajoNoEncontradoError) return errorResponse(err.message, 404);
    if (err instanceof ResenaYaEnviadaError) return errorResponse(err.message, 409);
    if (err instanceof ValidacionError) return errorResponse(err.message, 400);
    console.error('[crear-resena]', err);
    return errorResponse('Error interno', 500, String(err));
  }
});
