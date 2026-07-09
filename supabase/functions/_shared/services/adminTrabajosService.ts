// ─────────────────────────────────────────────────────────────
// Lógica de negocio: administración de trabajos/leads (admin-trabajos)
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as trabajosDao from '../dao/trabajosDao.ts';
import type { ActualizarTrabajoInput, CrearTrabajoManualInput } from '../dto/admin-trabajos.dto.ts';

export async function listar(db: SupabaseClient, filtros: trabajosDao.FiltrosTrabajos) {
  return trabajosDao.listarTodos(db, filtros);
}

export async function obtener(db: SupabaseClient, id: string) {
  return trabajosDao.obtenerPorId(db, id);
}

export async function actualizar(db: SupabaseClient, input: ActualizarTrabajoInput) {
  const payload: Record<string, unknown> = {};
  if (input.estado) {
    payload.estado = input.estado;
    payload.estado_actualizado_at = new Date().toISOString();
  }
  if (input.admin_validation_status) payload.admin_validation_status = input.admin_validation_status;
  if (input.notes !== undefined) payload.notes = input.notes;
  await trabajosDao.actualizarAdmin(db, input.id, payload);
}

export async function crearManual(db: SupabaseClient, input: CrearTrabajoManualInput) {
  const trabajo = await trabajosDao.crear(db, { ...input, source: 'admin_manual' });
  return { id: trabajo.id };
}
