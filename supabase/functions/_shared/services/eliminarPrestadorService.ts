// ─────────────────────────────────────────────────────────────
// Lógica de negocio: baja en cascada de un prestador (eliminar-prestador)
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as prestadoresDao from '../dao/prestadoresDao.ts';
import * as valoracionesDao from '../dao/valoracionesDao.ts';
import * as reservasDao from '../dao/reservasDao.ts';
import * as disponibilidadDao from '../dao/disponibilidadDao.ts';
import * as conversacionesDao from '../dao/conversacionesDao.ts';
import * as ordenesDao from '../dao/ordenesDao.ts';
import * as ordenEventosDao from '../dao/ordenEventosDao.ts';
import { isMissingTableError } from '../utils/errors.ts';

export class PrestadorNoEncontradoError extends Error {}
export class EliminacionFallidaError extends Error {}

export async function eliminarPrestador(db: SupabaseClient, prestadorId: string) {
  const prestador = await prestadoresDao.obtenerPorId(db, prestadorId);
  if (!prestador) throw new PrestadorNoEncontradoError('Prestador no encontrado');

  const ordenIds = await ordenesDao.listarIdsPorPrestador(db, prestadorId);

  const relatedDeletes = [
    valoracionesDao.eliminarPorPrestador(db, prestadorId),
    reservasDao.eliminarPorPrestador(db, prestadorId),
    disponibilidadDao.eliminarPorPrestador(db, prestadorId),
    conversacionesDao.eliminarPorPrestador(db, prestadorId),
  ];

  for (const operation of relatedDeletes) {
    const { error } = await operation;
    if (error && !isMissingTableError(error)) throw error;
  }

  if (ordenIds.length > 0) {
    await ordenEventosDao.eliminarPorOrdenIds(db, ordenIds);
    const { error: ordenesError } = await ordenesDao.eliminarPorPrestador(db, prestadorId);
    if (ordenesError && !isMissingTableError(ordenesError)) throw ordenesError;
  }

  const eliminado = await prestadoresDao.eliminar(db, prestadorId);
  if (!eliminado) throw new EliminacionFallidaError('No se pudo eliminar el prestador');

  return { prestador_id: prestadorId };
}
