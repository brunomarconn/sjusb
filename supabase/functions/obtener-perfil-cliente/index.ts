// ─────────────────────────────────────────────────────────────
// Edge Function: obtener-perfil-cliente
// GET /functions/v1/obtener-perfil-cliente
// Requiere Authorization: Bearer <token> de un cliente.
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsPreflightResponse } from '../_shared/middlewares/cors.ts';
import { resolverIdentidadJwt } from '../_shared/middlewares/auth.ts';
import { okResponse, errorResponse } from '../_shared/utils/responses.ts';
import * as clientesDao from '../_shared/dao/clientesDao.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  try {
    const identidad = await resolverIdentidadJwt(req);
    if (!identidad.clienteDni) return errorResponse('Se requiere autenticación de cliente', 401);

    const db = getSupabaseAdmin();
    const perfil = await clientesDao.obtenerPerfil(db, identidad.clienteDni);
    if (!perfil) return errorResponse('Cliente no encontrado', 404);

    return okResponse(perfil);
  } catch (err) {
    console.error('[obtener-perfil-cliente]', err);
    return errorResponse('Error interno', 500, String(err));
  }
});
