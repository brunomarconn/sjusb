// ─────────────────────────────────────────────────────────────
// Edge Function: auth-registro
// POST /functions/v1/auth-registro
// Registro de cliente. Público (sin auth previa).
// Body: { nombre, apellido, dni, telefono }
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsPreflightResponse } from '../_shared/middlewares/cors.ts';
import { okResponse, errorResponse } from '../_shared/utils/responses.ts';
import { registrarCliente, ValidacionError, ConflictoError } from '../_shared/services/authService.ts';
import type { RegistroClienteInput } from '../_shared/dto/auth.dto.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  try {
    const body = (await req.json()) as RegistroClienteInput;
    const db = getSupabaseAdmin();
    const resultado = await registrarCliente(db, body);
    return okResponse(resultado, 201);
  } catch (err) {
    if (err instanceof ValidacionError) return errorResponse(err.message, 400);
    if (err instanceof ConflictoError) return errorResponse(err.message, 409);
    console.error('[auth-registro]', err);
    return errorResponse('Error al crear la cuenta', 500, String(err));
  }
});
