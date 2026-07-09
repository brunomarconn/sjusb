// ─────────────────────────────────────────────────────────────
// Acceso a datos: tabla sanciones_prestadores
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface CrearSancionInput {
  prestador_id: string;
  tipo: string;
  reason?: string | null;
  related_trabajo_id?: string | null;
}

export async function crear(db: SupabaseClient, input: CrearSancionInput) {
  const { data, error } = await db
    .from('sanciones_prestadores')
    .insert([{
      prestador_id: input.prestador_id,
      tipo: input.tipo,
      reason: input.reason ?? null,
      related_trabajo_id: input.related_trabajo_id ?? null,
    }])
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function listarPorPrestador(db: SupabaseClient, prestadorId: string) {
  const { data, error } = await db
    .from('sanciones_prestadores')
    .select('*')
    .eq('prestador_id', prestadorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function resolver(db: SupabaseClient, id: string, adminNotes?: string) {
  const { error } = await db
    .from('sanciones_prestadores')
    .update({ resolved_at: new Date().toISOString(), admin_notes: adminNotes ?? null })
    .eq('id', id);
  if (error) throw error;
}
