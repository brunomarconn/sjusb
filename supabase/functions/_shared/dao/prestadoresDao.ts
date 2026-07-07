// ─────────────────────────────────────────────────────────────
// Acceso a datos: tabla prestadores
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function insertar(db: SupabaseClient, payload: Record<string, unknown>) {
  const { data, error } = await db
    .from('prestadores')
    .insert([payload])
    .select('id')
    .single();
  if (error) throw error;
  return data as { id: string };
}

export async function actualizar(db: SupabaseClient, id: string, payload: Record<string, unknown>) {
  const { error } = await db.from('prestadores').update(payload).eq('id', id);
  if (error) throw error;
}

export async function cambiarEstado(db: SupabaseClient, id: string, enabled: boolean) {
  const { error } = await db.from('prestadores').update({ enabled }).eq('id', id);
  if (error) throw error;
}

export async function obtenerPorId(db: SupabaseClient, id: string) {
  const { data, error } = await db
    .from('prestadores')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as { id: string } | null;
}

/** Proyección usada por crear-orden y chat-obtener */
export async function obtenerResumen(db: SupabaseClient, id: string) {
  const { data, error } = await db
    .from('prestadores')
    .select('id, nombre, apellido, categoria')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as { id: string; nombre: string; apellido: string; categoria: string } | null;
}

/** Proyección con password, usada por auth-login */
export async function obtenerPorDniConPassword(db: SupabaseClient, dni: string) {
  const { data, error } = await db
    .from('prestadores')
    .select('id, dni, password')
    .eq('dni', dni)
    .maybeSingle();
  if (error) throw error;
  return data as { id: string; dni: string; password: string } | null;
}

export async function actualizarPassword(db: SupabaseClient, id: string, hash: string) {
  const { error } = await db.from('prestadores').update({ password: hash }).eq('id', id);
  if (error) throw error;
}

export async function eliminar(db: SupabaseClient, id: string) {
  const { data, error } = await db
    .from('prestadores')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return data as { id: string } | null;
}
