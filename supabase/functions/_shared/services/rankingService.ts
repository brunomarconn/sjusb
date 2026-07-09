// ─────────────────────────────────────────────────────────────
// Lógica de negocio: recálculo batch de ranking (admin-prestador,
// acción recalcular_ranking) — belt-and-suspenders junto a los
// triggers de Postgres, para backfill o corrección manual.
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function recalcularTodos(db: SupabaseClient) {
  const { data: prestadores, error } = await db.from('prestadores').select('id');
  if (error) throw error;

  let actualizados = 0;
  for (const p of prestadores ?? []) {
    const { error: rpcError } = await db.rpc('fn_recalcular_ranking_prestador', { p_prestador_id: p.id });
    if (!rpcError) actualizados++;
    else console.error('[rankingService] Error recalculando', p.id, rpcError);
  }
  return { actualizados, total: prestadores?.length ?? 0 };
}
