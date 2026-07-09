// ─────────────────────────────────────────────────────────────
// Lógica de negocio: configuración del barrio (admin-config)
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as configBarrioDao from '../dao/configBarrioDao.ts';

export async function obtener(db: SupabaseClient) {
  return configBarrioDao.obtener(db);
}

export async function actualizar(db: SupabaseClient, payload: Record<string, unknown>) {
  return configBarrioDao.actualizar(db, payload);
}
