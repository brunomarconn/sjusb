// ─────────────────────────────────────────────────────────────
// Edge Function: admin-dashboard
// POST /functions/v1/admin-dashboard
// KPIs y reporte para la administración del barrio. Solo admin.
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsPreflightResponse } from '../_shared/middlewares/cors.ts';
import { validarAdminSecret } from '../_shared/middlewares/auth.ts';
import { okResponse, errorResponse } from '../_shared/utils/responses.ts';
import { getErrorMessage } from '../_shared/utils/errors.ts';
import * as adminDashboardService from '../_shared/services/adminDashboardService.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();
  if (!validarAdminSecret(req)) return errorResponse('No autorizado', 401);

  const db = getSupabaseAdmin();

  try {
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (action === 'obtener_reporte_barrio') {
      const reporte = await adminDashboardService.obtenerReporteBarrio(db);
      return okResponse({ reporte });
    }

    // Por defecto (incluye action === 'obtener_kpis' o sin action)
    const kpis = await adminDashboardService.obtenerKpis(db);
    return okResponse({ kpis });
  } catch (err) {
    console.error('[admin-dashboard]', err);
    return errorResponse('Error en la operación', 500, getErrorMessage(err));
  }
});
