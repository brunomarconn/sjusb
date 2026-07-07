// ─────────────────────────────────────────────────────────────
// Acceso a datos: tabla clientes
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface ClienteRow {
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  password: string;
  puntos: number;
  tiene_promocion: boolean;
}

export async function obtenerPorDni(db: SupabaseClient, dni: string) {
  const { data, error } = await db.from('clientes').select('*').eq('dni', dni).maybeSingle();
  if (error) throw error;
  return data as ClienteRow | null;
}

export async function insertar(db: SupabaseClient, payload: Record<string, unknown>) {
  const { error } = await db.from('clientes').insert([payload]);
  if (error) throw error;
}

export async function actualizarPassword(db: SupabaseClient, dni: string, hash: string) {
  const { error } = await db.from('clientes').update({ password: hash }).eq('dni', dni);
  if (error) throw error;
}

/** Proyección usada por auth-login y obtener-perfil-cliente */
export async function obtenerPerfil(db: SupabaseClient, dni: string) {
  const { data, error } = await db
    .from('clientes')
    .select('dni, puntos, tiene_promocion')
    .eq('dni', dni)
    .maybeSingle();
  if (error) throw error;
  return data as { dni: string; puntos: number; tiene_promocion: boolean } | null;
}
