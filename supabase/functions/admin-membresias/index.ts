// ─────────────────────────────────────────────────────────────
// Edge Function: admin-membresias
// POST /functions/v1/admin-membresias
// Operaciones sobre membresías. Solo admin (x-admin-secret).
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsPreflightResponse } from '../_shared/middlewares/cors.ts';
import { validarAdminSecret } from '../_shared/middlewares/auth.ts';
import { okResponse, errorResponse } from '../_shared/utils/responses.ts';
import { getErrorMessage } from '../_shared/utils/errors.ts';
import * as adminMembresiasService from '../_shared/services/adminMembresiasService.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();
  if (!validarAdminSecret(req)) return errorResponse('No autorizado', 401);

  const db = getSupabaseAdmin();

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'listar') {
      const membresias = await adminMembresiasService.listar(db);
      return okResponse({ membresias });
    }

    if (action === 'crear') {
      if (!body.prestador_id || !body.plan_name || !body.amount) {
        return errorResponse('prestador_id, plan_name y amount son requeridos');
      }
      const membresia = await adminMembresiasService.crear(db, {
        prestador_id: body.prestador_id,
        plan_name: body.plan_name,
        amount: body.amount,
        discount_applied: body.discount_applied,
        period_start: body.period_start,
        period_end: body.period_end,
        payment_link: body.payment_link,
      });
      return okResponse({ membresia });
    }

    if (action === 'marcar_pagada') {
      if (!body.id || !body.prestador_id) return errorResponse('id y prestador_id son requeridos');
      await adminMembresiasService.marcarPagada(db, body.id, body.prestador_id);
      return okResponse({ ok: true });
    }

    if (action === 'marcar_vencida') {
      if (!body.id || !body.prestador_id) return errorResponse('id y prestador_id son requeridos');
      await adminMembresiasService.marcarVencida(db, body.id, body.prestador_id);
      return okResponse({ ok: true });
    }

    if (action === 'condonar') {
      if (!body.id || !body.prestador_id) return errorResponse('id y prestador_id son requeridos');
      await adminMembresiasService.condonar(db, body.id, body.prestador_id);
      return okResponse({ ok: true });
    }

    return errorResponse('Acción no reconocida');
  } catch (err) {
    console.error('[admin-membresias]', err);
    return errorResponse('Error en la operación', 500, getErrorMessage(err));
  }
});
