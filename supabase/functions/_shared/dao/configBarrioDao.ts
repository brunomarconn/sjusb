// ─────────────────────────────────────────────────────────────
// Acceso a datos: tabla configuracion_barrio (singleton, id=1)
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function obtener(db: SupabaseClient) {
  const { data, error } = await db
    .from('configuracion_barrio')
    .select('*')
    .eq('id', 1)
    .single();
  if (error) throw error;
  return data;
}

export async function actualizar(db: SupabaseClient, payload: Record<string, unknown>) {
  const { data, error } = await db
    .from('configuracion_barrio')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}
