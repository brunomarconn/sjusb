// ─────────────────────────────────────────────────────────────
// Edge Function: crear-lead
// POST /functions/v1/crear-lead
// Público. Se llama al hacer click en "Contactar por WhatsApp".
// Body: { prestador_id, vecino_nombre, vecino_telefono, vecino_direccion?,
//         categoria?, servicio_descripcion?, source? }
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsPreflightResponse } from '../_shared/middlewares/cors.ts';
import { okResponse, errorResponse } from '../_shared/utils/responses.ts';
import { crearLead, ValidacionError, PrestadorNoEncontradoError } from '../_shared/services/leadService.ts';
import type { CrearLeadInput } from '../_shared/services/leadService.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  try {
    const body = (await req.json()) as CrearLeadInput;
    const db = getSupabaseAdmin();
    const resultado = await crearLead(db, body);
    return okResponse(resultado, 201);
  } catch (err) {
    if (err instanceof ValidacionError) return errorResponse(err.message, 400);
    if (err instanceof PrestadorNoEncontradoError) return errorResponse(err.message, 404);
    console.error('[crear-lead]', err);
    return errorResponse('Error al crear el contacto', 500, String(err));
  }
});
