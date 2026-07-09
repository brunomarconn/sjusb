// ─────────────────────────────────────────────────────────────
// Lógica de negocio: máquina de estados de un trabajo
// (obtener-trabajo, actualizar-estado-trabajo)
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as trabajosDao from '../dao/trabajosDao.ts';
import { esTransicionValida, ESTADOS_VISIBLES, type TrabajoEstado } from '../domain/trabajoEstado.ts';

export class TrabajoNoEncontradoError extends Error {}
export class TransicionInvalidaError extends Error {
  status: number;
  constructor(message: string) {
    super(message);
    this.status = 409;
  }
}
export class ValidacionError extends Error {}

export async function obtenerPorToken(db: SupabaseClient, jobToken: string) {
  const trabajo = await trabajosDao.obtenerPorJobToken(db, jobToken);
  if (!trabajo) throw new TrabajoNoEncontradoError('Trabajo no encontrado');
  return trabajo;
}

export async function actualizarEstado(db: SupabaseClient, jobToken: string, nuevoEstado: string) {
  if (!ESTADOS_VISIBLES.includes(nuevoEstado as TrabajoEstado)) {
    throw new ValidacionError('Estado no reconocido');
  }

  const trabajo = await trabajosDao.obtenerPorJobToken(db, jobToken);
  if (!trabajo) throw new TrabajoNoEncontradoError('Trabajo no encontrado');

  if (!esTransicionValida(trabajo.estado, nuevoEstado as TrabajoEstado)) {
    throw new TransicionInvalidaError(`No se puede pasar de "${trabajo.estado}" a "${nuevoEstado}"`);
  }

  const extra: Record<string, unknown> = {};
  if (nuevoEstado === 'terminado') {
    extra.completado_at = new Date().toISOString();
    extra.review_requested_at = new Date().toISOString();
  }

  return trabajosDao.actualizarEstado(db, trabajo.id, nuevoEstado, extra);
}
