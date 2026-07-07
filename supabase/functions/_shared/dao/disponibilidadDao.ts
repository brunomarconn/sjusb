// ─────────────────────────────────────────────────────────────
// Acceso a datos: tabla disponibilidad_prestadores
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { DisponibilidadEntrada } from '../dto/admin-prestador.dto.ts';

/** Disponibilidad por defecto para un prestador nuevo: lunes a viernes, mañana y tarde */
export async function insertarDefault(db: SupabaseClient, prestadorId: string) {
  const entradas: DisponibilidadEntrada[] = [];
  for (const dia of [1, 2, 3, 4, 5]) {
    entradas.push({ prestador_id: prestadorId, dia_semana: dia, turno: 'mañana' });
    entradas.push({ prestador_id: prestadorId, dia_semana: dia, turno: 'tarde' });
  }
  const { error } = await db.from('disponibilidad_prestadores').insert(entradas);
  if (error) throw error;
}

/** Reemplaza toda la disponibilidad de un prestador (delete-then-insert) */
export async function reemplazarEntradas(
  db: SupabaseClient,
  prestadorId: string,
  entradas: DisponibilidadEntrada[]
) {
  const { error: deleteError } = await db
    .from('disponibilidad_prestadores')
    .delete()
    .eq('prestador_id', prestadorId);
  if (deleteError) throw deleteError;

  if (Array.isArray(entradas) && entradas.length > 0) {
    const { error: insertError } = await db.from('disponibilidad_prestadores').insert(entradas);
    if (insertError) throw insertError;
  }
}

export async function eliminarPorPrestador(db: SupabaseClient, prestadorId: string) {
  return db.from('disponibilidad_prestadores').delete().eq('prestador_id', prestadorId);
}
