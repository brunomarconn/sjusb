// ─────────────────────────────────────────────────────────────
// Lógica de negocio: sanciones a prestadores (parte de admin-prestador)
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as sancionesDao from '../dao/sancionesDao.ts';
import * as prestadoresDao from '../dao/prestadoresDao.ts';

export interface CrearSancionInput {
  prestador_id: string;
  tipo: string;
  reason?: string;
  related_trabajo_id?: string;
}

const TIPOS_QUE_SUSPENDEN = ['temporary_suspension', 'permanent_ban'];

export async function crear(db: SupabaseClient, input: CrearSancionInput) {
  const sancion = await sancionesDao.crear(db, input);
  if (TIPOS_QUE_SUSPENDEN.includes(input.tipo)) {
    await prestadoresDao.actualizar(db, input.prestador_id, { visibility_status: 'suspended' });
  }
  return sancion;
}

export async function resolver(db: SupabaseClient, id: string, prestadorId: string, adminNotes?: string) {
  await sancionesDao.resolver(db, id, adminNotes);
  await prestadoresDao.actualizar(db, prestadorId, { visibility_status: 'visible' });
}

export async function listarPorPrestador(db: SupabaseClient, prestadorId: string) {
  return sancionesDao.listarPorPrestador(db, prestadorId);
}
