// ─────────────────────────────────────────────────────────────
// Lógica de negocio: administración de prestadores (admin-prestador)
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as prestadoresDao from '../dao/prestadoresDao.ts';
import * as valoracionesDao from '../dao/valoracionesDao.ts';
import * as sancionesService from './sancionesService.ts';
import * as rankingService from './rankingService.ts';
import { hashPassword } from '../security/passwordHasher.ts';
import type {
  ActualizarPrestadorInput,
  AgregarValoracionInput,
  CambiarEstadoInput,
  CrearPrestadorInput,
  CambiarVisibilidadInput,
  CambiarVerificacionInput,
  CambiarPlanInput,
  MarcarDestacadoInput,
  ModerarValoracionInput,
} from '../dto/admin-prestador.dto.ts';

async function conPasswordHasheada(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (typeof payload.password === 'string' && payload.password) {
    return { ...payload, password: await hashPassword(payload.password) };
  }
  return payload;
}

export async function crearPrestador(db: SupabaseClient, input: CrearPrestadorInput) {
  const payload = await conPasswordHasheada(input.payload);
  const { id } = await prestadoresDao.insertar(db, payload);
  return { id };
}

export async function actualizarPrestador(db: SupabaseClient, input: ActualizarPrestadorInput) {
  const payload = await conPasswordHasheada(input.payload);
  await prestadoresDao.actualizar(db, input.id, payload);
}

export async function cambiarEstado(db: SupabaseClient, input: CambiarEstadoInput) {
  await prestadoresDao.cambiarEstado(db, input.id, input.enabled);
}

export async function agregarValoracion(db: SupabaseClient, input: AgregarValoracionInput) {
  await valoracionesDao.insertar(db, {
    prestador_id: input.prestador_id,
    nombre_cliente: String(input.nombre_cliente || '').trim(),
    puntuacion: Number(input.puntuacion) || 5,
    comentario: String(input.comentario || '').trim(),
  });
}

export async function cambiarVisibilidad(db: SupabaseClient, input: CambiarVisibilidadInput) {
  await prestadoresDao.actualizar(db, input.id, { visibility_status: input.visibility_status });
}

export async function cambiarVerificacion(db: SupabaseClient, input: CambiarVerificacionInput) {
  await prestadoresDao.actualizar(db, input.id, { verification_status: input.verification_status });
}

export async function cambiarPlan(db: SupabaseClient, input: CambiarPlanInput) {
  const payload: Record<string, unknown> = {};
  if (input.plan_phase) payload.plan_phase = input.plan_phase;
  if (input.membership_status) payload.membership_status = input.membership_status;
  if (input.monthly_price !== undefined) payload.monthly_price = input.monthly_price;
  if (input.discount_rate !== undefined) payload.discount_rate = input.discount_rate;
  await prestadoresDao.actualizar(db, input.id, payload);
}

export async function marcarDestacado(db: SupabaseClient, input: MarcarDestacadoInput) {
  const payload: Record<string, unknown> = {};
  if (input.is_featured !== undefined) payload.is_featured = input.is_featured;
  if (input.is_top !== undefined) payload.is_top = input.is_top;
  await prestadoresDao.actualizar(db, input.id, payload);
}

export async function moderarValoracion(db: SupabaseClient, input: ModerarValoracionInput) {
  await valoracionesDao.moderar(db, input.id, {
    is_visible: input.is_visible,
    admin_approved: input.admin_approved,
  });
}

export async function listarValoraciones(db: SupabaseClient, filtros: valoracionesDao.FiltrosValoraciones) {
  return valoracionesDao.listarTodas(db, filtros);
}

export async function crearSancion(db: SupabaseClient, input: sancionesService.CrearSancionInput) {
  return sancionesService.crear(db, input);
}

export async function resolverSancion(db: SupabaseClient, id: string, prestadorId: string, adminNotes?: string) {
  await sancionesService.resolver(db, id, prestadorId, adminNotes);
}

export async function listarSanciones(db: SupabaseClient, prestadorId: string) {
  return sancionesService.listarPorPrestador(db, prestadorId);
}

export async function recalcularRanking(db: SupabaseClient) {
  return rankingService.recalcularTodos(db);
}
