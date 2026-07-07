// ─────────────────────────────────────────────────────────────
// Acceso a datos: tabla ordenes
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function insertar(db: SupabaseClient, data: Record<string, unknown>) {
  const { data: orden, error } = await db.from('ordenes').insert(data).select().single();
  if (error) throw error;
  return orden;
}

/** Proyección usada por completar-servicio */
export async function obtenerParaCompletar(db: SupabaseClient, id: string) {
  const { data, error } = await db
    .from('ordenes')
    .select('id, estado, cliente_dni, prestador_id, monto_bruto')
    .eq('id', id)
    .single();
  if (error) return { data: null, error };
  return { data, error: null };
}

/** Proyección usada por chat-obtener para validar acceso y armar la respuesta */
export async function obtenerParaChat(db: SupabaseClient, id: string) {
  const { data, error } = await db
    .from('ordenes')
    .select('id, titulo, cliente_dni, prestador_id, estado')
    .eq('id', id)
    .single();
  if (error) return { data: null, error };
  return { data, error: null };
}

/** Proyección liviana (título + estado) usada al enriquecer una conversación */
export async function obtenerResumen(db: SupabaseClient, id: string) {
  const { data } = await db
    .from('ordenes')
    .select('titulo, estado')
    .eq('id', id)
    .maybeSingle();
  return data as { titulo: string; estado: string } | null;
}

export async function actualizarEstado(
  db: SupabaseClient,
  id: string,
  updates: Record<string, unknown>
) {
  const { data, error } = await db.from('ordenes').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function listarIdsPorPrestador(db: SupabaseClient, prestadorId: string) {
  const { data } = await db.from('ordenes').select('id').eq('prestador_id', prestadorId);
  return (data ?? []).map((o: { id: string }) => o.id).filter(Boolean);
}

export async function eliminarPorPrestador(db: SupabaseClient, prestadorId: string) {
  return db.from('ordenes').delete().eq('prestador_id', prestadorId);
}
