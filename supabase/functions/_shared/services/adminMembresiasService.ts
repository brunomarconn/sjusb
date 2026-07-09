// ─────────────────────────────────────────────────────────────
// Lógica de negocio: administración de membresías (admin-membresias)
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as membresiasDao from '../dao/membresiasDao.ts';
import * as prestadoresDao from '../dao/prestadoresDao.ts';
import type { CrearMembresiaAdminInput } from '../dto/admin-membresias.dto.ts';

export async function listar(db: SupabaseClient) {
  return membresiasDao.listarTodas(db);
}

export async function crear(db: SupabaseClient, input: CrearMembresiaAdminInput) {
  const membresia = await membresiasDao.crear(db, input);
  await prestadoresDao.actualizar(db, input.prestador_id, { membership_status: 'trial' });
  return membresia;
}

export async function marcarPagada(db: SupabaseClient, id: string, prestadorId: string) {
  await membresiasDao.marcarPagada(db, id);
  await prestadoresDao.actualizar(db, prestadorId, { membership_status: 'active' });
}

export async function marcarVencida(db: SupabaseClient, id: string, prestadorId: string) {
  await membresiasDao.actualizarEstado(db, id, 'overdue');
  await prestadoresDao.actualizar(db, prestadorId, { membership_status: 'past_due' });
}

export async function condonar(db: SupabaseClient, id: string, prestadorId: string) {
  await membresiasDao.actualizarEstado(db, id, 'waived');
  await prestadoresDao.actualizar(db, prestadorId, { membership_status: 'active' });
}
