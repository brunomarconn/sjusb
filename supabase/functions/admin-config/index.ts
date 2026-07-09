// ─────────────────────────────────────────────────────────────
// Edge Function: admin-config
// POST /functions/v1/admin-config
// Configuración del barrio (singleton). Solo admin (x-admin-secret).
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsPreflightResponse } from '../_shared/middlewares/cors.ts';
import { validarAdminSecret } from '../_shared/middlewares/auth.ts';
import { okResponse, errorResponse } from '../_shared/utils/responses.ts';
import { getErrorMessage } from '../_shared/utils/errors.ts';
import * as adminConfigService from '../_shared/services/adminConfigService.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();
  if (!validarAdminSecret(req)) return errorResponse('No autorizado', 401);

  const db = getSupabaseAdmin();

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'obtener') {
      const config = await adminConfigService.obtener(db);
      return okResponse({ config });
    }

    if (action === 'actualizar') {
      const config = await adminConfigService.actualizar(db, body.payload ?? {});
      return okResponse({ config });
    }

    return errorResponse('Acción no reconocida');
  } catch (err) {
    console.error('[admin-config]', err);
    return errorResponse('Error en la operación', 500, getErrorMessage(err));
  }
});
