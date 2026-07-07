// ─────────────────────────────────────────────────────────────
// Acceso a datos: tabla conversaciones
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type ConversacionRow = {
  id: string;
  orden_id: string | null;
  cliente_dni: string;
  prestador_id: string;
  no_leidos_cliente: number;
  no_leidos_prestador: number;
  [key: string]: unknown;
};

export async function obtenerPorId(db: SupabaseClient, id: string) {
  const { data, error } = await db.from('conversaciones').select('*').eq('id', id).single();
  return { data: data as ConversacionRow | null, error };
}

/** Proyección liviana usada por chat-enviar / chat-marcar-leido para validar pertenencia */
export async function obtenerResumenPorId(db: SupabaseClient, id: string) {
  const { data, error } = await db
    .from('conversaciones')
    .select('id, cliente_dni, prestador_id, no_leidos_cliente, no_leidos_prestador')
    .eq('id', id)
    .single();
  return { data: data as ConversacionRow | null, error };
}

export async function obtenerPorOrdenId(db: SupabaseClient, ordenId: string) {
  const { data, error } = await db
    .from('conversaciones')
    .select('*')
    .eq('orden_id', ordenId)
    .maybeSingle();
  if (error) throw error;
  return data as ConversacionRow | null;
}

export async function obtenerDirecta(db: SupabaseClient, clienteDni: string, prestadorId: string) {
  const { data, error } = await db
    .from('conversaciones')
    .select('*')
    .eq('cliente_dni', clienteDni)
    .eq('prestador_id', prestadorId)
    .is('orden_id', null)
    .maybeSingle();
  if (error) throw error;
  return data as ConversacionRow | null;
}

export async function crear(db: SupabaseClient, data: {
  orden_id: string | null;
  cliente_dni: string;
  prestador_id: string;
}) {
  const { data: nueva, error } = await db.from('conversaciones').insert(data).select('*').single();
  if (error) throw error;
  return nueva as ConversacionRow;
}

export async function listarPorFiltro(db: SupabaseClient, filtro: {
  clienteDni?: string | null;
  prestadorId?: string | null;
}) {
  let query = db
    .from('conversaciones')
    .select(`
      id,
      orden_id,
      cliente_dni,
      prestador_id,
      ultimo_mensaje_at,
      ultimo_mensaje_contenido,
      ultimo_mensaje_sender,
      no_leidos_cliente,
      no_leidos_prestador,
      created_at,
      ordenes ( id, titulo, estado ),
      prestadores ( id, nombre, apellido, categoria )
    `)
    .order('ultimo_mensaje_at', { ascending: false, nullsFirst: false });

  if (filtro.clienteDni) query = query.eq('cliente_dni', filtro.clienteDni);
  if (filtro.prestadorId) query = query.eq('prestador_id', filtro.prestadorId);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function actualizarSnapshot(db: SupabaseClient, id: string, updates: Record<string, unknown>) {
  return db.from('conversaciones').update(updates).eq('id', id);
}

export async function marcarLeidoCliente(db: SupabaseClient, id: string) {
  return db.from('conversaciones').update({ no_leidos_cliente: 0 }).eq('id', id);
}

export async function marcarLeidoPrestador(db: SupabaseClient, id: string) {
  return db.from('conversaciones').update({ no_leidos_prestador: 0 }).eq('id', id);
}

export async function marcarAmbosLeidos(db: SupabaseClient, id: string) {
  return db.from('conversaciones').update({ no_leidos_cliente: 0, no_leidos_prestador: 0 }).eq('id', id);
}

export async function eliminarPorPrestador(db: SupabaseClient, prestadorId: string) {
  return db.from('conversaciones').delete().eq('prestador_id', prestadorId);
}
