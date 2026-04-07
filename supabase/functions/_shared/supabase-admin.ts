// ─────────────────────────────────────────────────────────────
// Cliente Supabase con service_role (bypass RLS)
// Usar SOLO en Edge Functions — nunca exponer al frontend
// ─────────────────────────────────────────────────────────────
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function getSupabaseAdmin() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !key) {
    throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

/**
 * Registra un evento en la tabla orden_eventos.
 * Nunca lanza error — si falla, lo loguea silenciosamente para no
 * interrumpir el flujo principal.
 */
export async function registrarEvento(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  params: {
    ordenId: string;
    tipo: string;
    estadoAnterior?: string | null;
    estadoNuevo?: string | null;
    datos?: Record<string, unknown>;
    creadoPor?: string;
  }
): Promise<void> {
  try {
    await supabase.from('orden_eventos').insert({
      orden_id: params.ordenId,
      tipo: params.tipo,
      estado_anterior: params.estadoAnterior ?? null,
      estado_nuevo: params.estadoNuevo ?? null,
      datos: params.datos ?? {},
      creado_por: params.creadoPor ?? 'sistema',
    });
  } catch (err) {
    console.error(`[registrarEvento] Error al registrar evento ${params.tipo}:`, err);
  }
}
