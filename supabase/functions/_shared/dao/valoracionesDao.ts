// ─────────────────────────────────────────────────────────────
// Acceso a datos: tabla valoraciones
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function insertar(db: SupabaseClient, input: {
  prestador_id: string;
  nombre_cliente: string;
  puntuacion: number;
  comentario: string;
}) {
  const { error } = await db.from('valoraciones').insert([{
    prestador_id: input.prestador_id,
    cliente_email: 'admin@mrsservicios.com',
    nombre_cliente: input.nombre_cliente,
    puntuacion: input.puntuacion,
    comentario: input.comentario,
    source: 'manual',
  }]);
  if (error) throw error;
}

/** Reseña disparada por el link de reviewToken tras marcar un trabajo "terminado". */
export async function insertarDesdeTrabajo(db: SupabaseClient, input: {
  prestador_id: string;
  trabajo_id: string;
  nombre_cliente: string;
  puntuacion: number;
  comentario: string;
}) {
  const { error } = await db.from('valoraciones').insert([{
    prestador_id: input.prestador_id,
    trabajo_id: input.trabajo_id,
    cliente_email: 'vecino@resena.mrservicios',
    nombre_cliente: input.nombre_cliente,
    puntuacion: input.puntuacion,
    comentario: input.comentario,
    source: 'post_job_review',
  }]);
  if (error) throw error;
}

/** Reseña dejada por un vecino que ya contactó al prestador (sin trabajo/token puntual). */
export async function insertarManual(db: SupabaseClient, input: {
  prestador_id: string;
  nombre_cliente: string;
  cliente_email?: string;
  puntuacion: number;
  comentario: string;
}) {
  const { error } = await db.from('valoraciones').insert([{
    prestador_id: input.prestador_id,
    cliente_email: input.cliente_email || 'anonimo',
    nombre_cliente: input.nombre_cliente,
    puntuacion: input.puntuacion,
    comentario: input.comentario,
    source: 'manual',
  }]);
  if (error) throw error;
}

export async function listarPorPrestador(db: SupabaseClient, prestadorId: string) {
  const { data, error } = await db
    .from('valoraciones')
    .select('*')
    .eq('prestador_id', prestadorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface FiltrosValoraciones {
  prestador_id?: string;
  is_visible?: boolean;
}

export async function listarTodas(db: SupabaseClient, filtros: FiltrosValoraciones = {}) {
  let query = db
    .from('valoraciones')
    .select('*, prestadores(id, nombre, apellido, categoria)')
    .order('created_at', { ascending: false });
  if (filtros.prestador_id) query = query.eq('prestador_id', filtros.prestador_id);
  if (filtros.is_visible !== undefined) query = query.eq('is_visible', filtros.is_visible);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function moderar(db: SupabaseClient, id: string, payload: { is_visible?: boolean; admin_approved?: boolean }) {
  const { error } = await db.from('valoraciones').update(payload).eq('id', id);
  if (error) throw error;
}

export async function eliminarPorPrestador(db: SupabaseClient, prestadorId: string) {
  return db.from('valoraciones').delete().eq('prestador_id', prestadorId);
}
