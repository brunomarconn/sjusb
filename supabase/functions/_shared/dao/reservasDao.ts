// ─────────────────────────────────────────────────────────────
// Acceso a datos: tabla reservas
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function obtenerConPrestador(db: SupabaseClient, id: string) {
  const { data, error } = await db
    .from('reservas')
    .select('*, prestadores(id, nombre, apellido, categoria, telefono)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function marcarTrabajoConcretado(db: SupabaseClient, id: string) {
  const { error } = await db
    .from('reservas')
    .update({ estado: 'trabajo_concretado', trabajo_concretado_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function eliminarPorPrestador(db: SupabaseClient, prestadorId: string) {
  return db.from('reservas').delete().eq('prestador_id', prestadorId);
}
