// ─────────────────────────────────────────────────────────────
// Acceso a datos: tabla trabajos (leads)
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface CrearTrabajoInput {
  prestador_id: string;
  vecino_nombre: string;
  vecino_telefono: string;
  vecino_direccion?: string | null;
  categoria?: string | null;
  servicio_descripcion?: string | null;
  source?: string;
}

export async function crear(db: SupabaseClient, input: CrearTrabajoInput) {
  const { data, error } = await db
    .from('trabajos')
    .insert([{
      prestador_id: input.prestador_id,
      vecino_nombre: input.vecino_nombre,
      vecino_telefono: input.vecino_telefono,
      vecino_direccion: input.vecino_direccion ?? null,
      categoria: input.categoria ?? null,
      servicio_descripcion: input.servicio_descripcion ?? null,
      source: input.source ?? 'public_site',
    }])
    .select('id, job_token')
    .single();
  if (error) throw error;
  return data as { id: string; job_token: string };
}

/** Dedupe: evita crear un lead duplicado si el mismo vecino contactó al mismo prestador en las últimas 24hs. */
export async function buscarActivoReciente(db: SupabaseClient, prestadorId: string, vecinoTelefono: string) {
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await db
    .from('trabajos')
    .select('id')
    .eq('prestador_id', prestadorId)
    .eq('vecino_telefono', vecinoTelefono)
    .gte('created_at', desde)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as { id: string } | null;
}

export async function obtenerPorJobToken(db: SupabaseClient, jobToken: string) {
  const { data, error } = await db
    .from('trabajos')
    .select('*, prestadores(id, nombre, apellido, categoria, telefono, foto_url)')
    .eq('job_token', jobToken)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function obtenerPorReviewToken(db: SupabaseClient, reviewToken: string) {
  const { data, error } = await db
    .from('trabajos')
    .select('*, prestadores(id, nombre, apellido, categoria)')
    .eq('review_token', reviewToken)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function actualizarEstado(
  db: SupabaseClient,
  id: string,
  estado: string,
  extra: Record<string, unknown> = {}
) {
  const { data, error } = await db
    .from('trabajos')
    .update({ estado, estado_actualizado_at: new Date().toISOString(), ...extra })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function marcarReviewRecibida(db: SupabaseClient, id: string) {
  const { error } = await db
    .from('trabajos')
    .update({
      review_received_at: new Date().toISOString(),
      admin_validation_status: 'confirmed_by_review',
    })
    .eq('id', id);
  if (error) throw error;
}

export async function listarPorPrestador(db: SupabaseClient, prestadorId: string) {
  const { data, error } = await db
    .from('trabajos')
    .select('*')
    .eq('prestador_id', prestadorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface FiltrosTrabajos {
  estado?: string;
  prestador_id?: string;
  admin_validation_status?: string;
}

export async function listarTodos(db: SupabaseClient, filtros: FiltrosTrabajos = {}) {
  let query = db
    .from('trabajos')
    .select('*, prestadores(id, nombre, apellido, categoria, telefono)')
    .order('created_at', { ascending: false });
  if (filtros.estado) query = query.eq('estado', filtros.estado);
  if (filtros.prestador_id) query = query.eq('prestador_id', filtros.prestador_id);
  if (filtros.admin_validation_status) query = query.eq('admin_validation_status', filtros.admin_validation_status);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function obtenerPorId(db: SupabaseClient, id: string) {
  const { data, error } = await db
    .from('trabajos')
    .select('*, prestadores(id, nombre, apellido, categoria, telefono)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function actualizarAdmin(db: SupabaseClient, id: string, payload: Record<string, unknown>) {
  const { error } = await db.from('trabajos').update(payload).eq('id', id);
  if (error) throw error;
}
