// ─────────────────────────────────────────────────────────────
// Acceso a datos: tabla orden_eventos (auditoría)
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { isMissingTableError } from '../utils/errors.ts';

/**
 * Registra un evento en la tabla orden_eventos.
 * Nunca lanza error — si falla, lo loguea silenciosamente para no
 * interrumpir el flujo principal.
 */
export async function registrar(
  db: SupabaseClient,
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
    await db.from('orden_eventos').insert({
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

export async function eliminarPorOrdenIds(db: SupabaseClient, ordenIds: string[]) {
  if (ordenIds.length === 0) return;
  const { error } = await db.from('orden_eventos').delete().in('orden_id', ordenIds);
  if (error && !isMissingTableError(error)) throw error;
}
