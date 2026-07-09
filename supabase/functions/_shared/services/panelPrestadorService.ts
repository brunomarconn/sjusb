// ─────────────────────────────────────────────────────────────
// Lógica de negocio: panel del prestador (panel-prestador)
// Resuelve por providerToken (sin login) o por JWT (login DNI existente).
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as trabajosDao from '../dao/trabajosDao.ts';
import * as membresiasDao from '../dao/membresiasDao.ts';

export class PrestadorNoEncontradoError extends Error {}
export class NoAutorizadoError extends Error {}

export interface ObtenerPanelInput {
  providerToken?: string | null;
  prestadorId?: string | null;
}

export async function obtenerPanel(db: SupabaseClient, input: ObtenerPanelInput) {
  let prestadorId = input.prestadorId ?? null;

  if (!prestadorId && input.providerToken) {
    const { data, error } = await db
      .from('prestadores')
      .select('id')
      .eq('provider_token', input.providerToken)
      .maybeSingle();
    if (error) throw error;
    prestadorId = data?.id ?? null;
  }

  if (!prestadorId) throw new NoAutorizadoError('No se pudo identificar al prestador');

  const { data: prestador, error: prestadorError } = await db
    .from('prestadores')
    .select('*')
    .eq('id', prestadorId)
    .maybeSingle();
  if (prestadorError) throw prestadorError;
  if (!prestador) throw new PrestadorNoEncontradoError('Prestador no encontrado');

  const [trabajos, membresias] = await Promise.all([
    trabajosDao.listarPorPrestador(db, prestadorId),
    membresiasDao.listarPorPrestador(db, prestadorId),
  ]);

  return { prestador, trabajos, membresias };
}
