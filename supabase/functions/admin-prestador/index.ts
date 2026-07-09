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

    if (action === 'cambiar_visibilidad') {
      if (!body.id || !body.visibility_status) return errorResponse('id y visibility_status son requeridos');
      await prestadorAdminService.cambiarVisibilidad(db, {
        id: body.id,
        visibility_status: body.visibility_status,
      });
      return okResponse({ ok: true });
    }

    if (action === 'cambiar_verificacion') {
      if (!body.id || !body.verification_status) return errorResponse('id y verification_status son requeridos');
      await prestadorAdminService.cambiarVerificacion(db, {
        id: body.id,
        verification_status: body.verification_status,
      });
      return okResponse({ ok: true });
    }

    if (action === 'cambiar_plan') {
      if (!body.id) return errorResponse('id es requerido');
      await prestadorAdminService.cambiarPlan(db, {
        id: body.id,
        plan_phase: body.plan_phase,
        membership_status: body.membership_status,
        monthly_price: body.monthly_price,
        discount_rate: body.discount_rate,
      });
      return okResponse({ ok: true });
    }

    if (action === 'marcar_destacado') {
      if (!body.id) return errorResponse('id es requerido');
      await prestadorAdminService.marcarDestacado(db, {
        id: body.id,
        is_featured: body.is_featured,
        is_top: body.is_top,
      });
      return okResponse({ ok: true });
    }

    if (action === 'listar_valoraciones') {
      const valoraciones = await prestadorAdminService.listarValoraciones(db, {
        prestador_id: body.prestador_id,
        is_visible: body.is_visible,
      });
      return okResponse({ valoraciones });
    }

    if (action === 'moderar_valoracion') {
      if (!body.id) return errorResponse('id es requerido');
      await prestadorAdminService.moderarValoracion(db, {
        id: body.id,
        is_visible: body.is_visible,
        admin_approved: body.admin_approved,
      });
      return okResponse({ ok: true });
    }

    if (action === 'crear_sancion') {
      if (!body.prestador_id || !body.tipo) return errorResponse('prestador_id y tipo son requeridos');
      const sancion = await prestadorAdminService.crearSancion(db, {
        prestador_id: body.prestador_id,
        tipo: body.tipo,
        reason: body.reason,
        related_trabajo_id: body.related_trabajo_id,
      });
      return okResponse({ sancion });
    }

    if (action === 'listar_sanciones') {
      if (!body.prestador_id) return errorResponse('prestador_id es requerido');
      const sanciones = await prestadorAdminService.listarSanciones(db, body.prestador_id);
      return okResponse({ sanciones });
    }

    if (action === 'resolver_sancion') {
      if (!body.id || !body.prestador_id) return errorResponse('id y prestador_id son requeridos');
      await prestadorAdminService.resolverSancion(db, body.id, body.prestador_id, body.admin_notes);
      return okResponse({ ok: true });
    }

    if (action === 'recalcular_ranking') {
      const resultado = await prestadorAdminService.recalcularRanking(db);
      return okResponse(resultado);
    }

    return errorResponse('Acción no reconocida');
  } catch (err) {
    console.error('[admin-prestador]', err);
    return errorResponse('Error en la operación', 500, getErrorMessage(err));
  }
});
