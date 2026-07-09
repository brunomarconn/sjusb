// ─────────────────────────────────────────────────────────────
// Lógica de negocio: reseñas (crear-resena)
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as trabajosDao from '../dao/trabajosDao.ts';
import * as valoracionesDao from '../dao/valoracionesDao.ts';

export class TrabajoNoEncontradoError extends Error {}
export class ResenaYaEnviadaError extends Error {}
export class ValidacionError extends Error {}

export async function obtenerContexto(db: SupabaseClient, reviewToken: string) {
  const trabajo = await trabajosDao.obtenerPorReviewToken(db, reviewToken);
  if (!trabajo) throw new TrabajoNoEncontradoError('No encontramos ese trabajo');

  return {
    prestador_nombre: trabajo.prestadores?.nombre,
    prestador_apellido: trabajo.prestadores?.apellido,
    prestador_categoria: trabajo.prestadores?.categoria,
    vecino_nombre: trabajo.vecino_nombre,
    ya_enviada: Boolean(trabajo.review_received_at),
  };
}

export interface CrearResenaInput {
  review_token: string;
  rating: number;
  comment?: string;
}

function validarRating(rating: number) {
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new ValidacionError('La puntuación debe ser entre 1 y 5');
  }
}

/** Reseña post-trabajo, disparada por el link de reviewToken al marcar "terminado". */
export async function crearResena(db: SupabaseClient, input: CrearResenaInput) {
  const trabajo = await trabajosDao.obtenerPorReviewToken(db, input.review_token);
  if (!trabajo) throw new TrabajoNoEncontradoError('No encontramos ese trabajo');
  if (trabajo.review_received_at) throw new ResenaYaEnviadaError('Ya se envió una reseña para este trabajo');

  const rating = Number(input.rating);
  validarRating(rating);

  await valoracionesDao.insertarDesdeTrabajo(db, {
    prestador_id: trabajo.prestador_id,
    trabajo_id: trabajo.id,
    nombre_cliente: trabajo.vecino_nombre,
    puntuacion: rating,
    comentario: String(input.comment || '').trim(),
  });

  await trabajosDao.marcarReviewRecibida(db, trabajo.id);

  return { ok: true };
}

export interface CrearResenaManualInput {
  prestador_id: string;
  nombre_cliente: string;
  cliente_email?: string;
  rating: number;
  comment?: string;
}

/**
 * Reseña dejada por un vecino que ya contactó a un prestador (flujo "valorar"
 * de src/pages/usuarios/page.tsx), sin un trabajo/token puntual en mano.
 */
export async function crearResenaManual(db: SupabaseClient, input: CrearResenaManualInput) {
  if (!input.prestador_id || !String(input.nombre_cliente || '').trim()) {
    throw new ValidacionError('Faltan campos requeridos');
  }
  const rating = Number(input.rating);
  validarRating(rating);

  await valoracionesDao.insertarManual(db, {
    prestador_id: input.prestador_id,
    nombre_cliente: String(input.nombre_cliente).trim(),
    cliente_email: input.cliente_email || 'anonimo',
    puntuacion: rating,
    comentario: String(input.comment || '').trim(),
  });

  return { ok: true };
}
