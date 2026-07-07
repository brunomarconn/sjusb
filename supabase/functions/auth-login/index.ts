// ─────────────────────────────────────────────────────────────
// Edge Function: auth-login
// POST /functions/v1/auth-login
// Login de cliente o prestador. Público (sin auth previa).
// Body: { rol: 'cliente'|'prestador', dni, password }
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsPreflightResponse } from '../_shared/middlewares/cors.ts';
import { okResponse, errorResponse } from '../_shared/utils/responses.ts';
import { login, ValidacionError, CredencialesInvalidasError } from '../_shared/services/authService.ts';
import type { LoginInput } from '../_shared/dto/auth.dto.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  try {
    const body = (await req.json()) as LoginInput;
    const db = getSupabaseAdmin();
    const resultado = await login(db, body);
    return okResponse(resultado);
  } catch (err) {
    if (err instanceof ValidacionError) return errorResponse(err.message, 400);
    if (err instanceof CredencialesInvalidasError) return errorResponse(err.message, 401);
    console.error('[auth-login]', err);
    return errorResponse('Error al iniciar sesión', 500, String(err));
  }
});
