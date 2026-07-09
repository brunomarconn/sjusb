// ─────────────────────────────────────────────────────────────
// Edge Function: admin-trabajos
// POST /functions/v1/admin-trabajos
// Operaciones sobre trabajos/leads. Solo admin (x-admin-secret).
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsPreflightResponse } from '../_shared/middlewares/cors.ts';
import { validarAdminSecret } from '../_shared/middlewares/auth.ts';
import { okResponse, errorResponse } from '../_shared/utils/responses.ts';
import { getErrorMessage } from '../_shared/utils/errors.ts';
import * as adminTrabajosService from '../_shared/services/adminTrabajosService.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();
  if (!validarAdminSecret(req)) return errorResponse('No autorizado', 401);

  const db = getSupabaseAdmin();

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'listar') {
      const trabajos = await adminTrabajosService.listar(db, body.filtros ?? {});
      return okResponse({ trabajos });
    }

    if (action === 'obtener') {
      if (!body.id) return errorResponse('id es requerido');
      const trabajo = await adminTrabajosService.obtener(db, body.id);
      return okResponse({ trabajo });
    }

    if (action === 'actualizar') {
      if (!body.id) return errorResponse('id es requerido');
      await adminTrabajosService.actualizar(db, {
        id: body.id,
        estado: body.estado,
        admin_validation_status: body.admin_validation_status,
        notes: body.notes,
      });
      return okResponse({ ok: true });
    }

    if (action === 'crear_manual') {
      if (!body.prestador_id) return errorResponse('prestador_id es requerido');
      const resultado = await adminTrabajosService.crearManual(db, {
        prestador_id: body.prestador_id,
        vecino_nombre: body.vecino_nombre,
        vecino_telefono: body.vecino_telefono,
        vecino_direccion: body.vecino_direccion,
        categoria: body.categoria,
        servicio_descripcion: body.servicio_descripcion,
      });
      return okResponse(resultado);
    }

    return errorResponse('Acción no reconocida');
  } catch (err) {
    console.error('[admin-trabajos]', err);
    return errorResponse('Error en la operación', 500, getErrorMessage(err));
  }
});
