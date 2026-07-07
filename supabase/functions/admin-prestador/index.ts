// ─────────────────────────────────────────────────────────────
// Edge Function: admin-prestador
// POST /functions/v1/admin-prestador
// Operaciones CRUD sobre prestadores. Solo admin (x-admin-secret).
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsPreflightResponse } from '../_shared/middlewares/cors.ts';
import { validarAdminSecret } from '../_shared/middlewares/auth.ts';
import { okResponse, errorResponse } from '../_shared/utils/responses.ts';
import { getErrorMessage } from '../_shared/utils/errors.ts';
import * as prestadorAdminService from '../_shared/services/prestadorAdminService.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();
  if (!validarAdminSecret(req)) return errorResponse('No autorizado', 401);

  const db = getSupabaseAdmin();

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'crear') {
      const resultado = await prestadorAdminService.crearPrestador(db, { payload: body.payload });
      return okResponse({ ok: true, id: resultado.id });
    }

    if (action === 'actualizar') {
      if (!body.id) return errorResponse('id es requerido');
      await prestadorAdminService.actualizarPrestador(db, { id: body.id, payload: body.payload });
      return okResponse({ ok: true });
    }

    if (action === 'cambiar_estado') {
      if (!body.id) return errorResponse('id es requerido');
      await prestadorAdminService.cambiarEstado(db, { id: body.id, enabled: body.enabled });
      return okResponse({ ok: true });
    }

    if (action === 'agregar_valoracion') {
      if (!body.prestador_id) return errorResponse('prestador_id es requerido');
      await prestadorAdminService.agregarValoracion(db, {
        prestador_id: body.prestador_id,
        nombre_cliente: body.nombre_cliente,
        puntuacion: body.puntuacion,
        comentario: body.comentario,
      });
      return okResponse({ ok: true });
    }

    if (action === 'gestionar_disponibilidad') {
      if (!body.prestador_id) return errorResponse('prestador_id es requerido');
      await prestadorAdminService.gestionarDisponibilidad(db, {
        prestador_id: body.prestador_id,
        entradas: body.entradas,
      });
      return okResponse({ ok: true });
    }

    return errorResponse('Acción no reconocida');
  } catch (err) {
    console.error('[admin-prestador]', err);
    return errorResponse('Error en la operación', 500, getErrorMessage(err));
  }
});
