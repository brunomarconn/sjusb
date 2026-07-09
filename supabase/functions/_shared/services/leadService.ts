// ─────────────────────────────────────────────────────────────
// Lógica de negocio: creación de leads (crear-lead)
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as trabajosDao from '../dao/trabajosDao.ts';
import * as prestadoresDao from '../dao/prestadoresDao.ts';
import { notificarNuevoLead } from './leadNotificacionService.ts';

export class ValidacionError extends Error {}
export class PrestadorNoEncontradoError extends Error {}

export interface CrearLeadInput {
  prestador_id: string;
  vecino_nombre: string;
  vecino_telefono: string;
  vecino_direccion?: string;
  categoria?: string;
  servicio_descripcion?: string;
  source?: string;
}

/**
 * Crea un lead/trabajo. Nunca devuelve job_token/review_token al que llama:
 * esos solo deben salir por vías autenticadas (admin, panel del prestador),
 * no a la respuesta del navegador del vecino que originó el contacto.
 */
export async function crearLead(db: SupabaseClient, input: CrearLeadInput) {
  const vecinoNombre = String(input.vecino_nombre || '').trim();
  const vecinoTelefono = String(input.vecino_telefono || '').replace(/\D/g, '');

  if (!input.prestador_id || !vecinoNombre || !vecinoTelefono) {
    throw new ValidacionError('Faltan campos requeridos (prestador_id, vecino_nombre, vecino_telefono)');
  }

  const prestador = await prestadoresDao.obtenerResumen(db, input.prestador_id);
  if (!prestador) throw new PrestadorNoEncontradoError('Prestador no encontrado');

  const existente = await trabajosDao.buscarActivoReciente(db, input.prestador_id, vecinoTelefono);
  if (existente) {
    return { trabajo_id: existente.id, duplicado: true };
  }

  const trabajo = await trabajosDao.crear(db, {
    prestador_id: input.prestador_id,
    vecino_nombre: vecinoNombre,
    vecino_telefono: vecinoTelefono,
    vecino_direccion: input.vecino_direccion?.trim() || null,
    categoria: input.categoria?.trim() || prestador.categoria,
    servicio_descripcion: input.servicio_descripcion?.trim() || null,
    source: input.source || 'public_site',
  });

  notificarNuevoLead({
    prestador_nombre: prestador.nombre,
    prestador_apellido: prestador.apellido,
    prestador_categoria: prestador.categoria,
    vecino_nombre: vecinoNombre,
    vecino_telefono: vecinoTelefono,
    servicio_descripcion: input.servicio_descripcion,
  }).catch((err) => console.warn('[leadService] Error notificando lead:', err));

  return { trabajo_id: trabajo.id, duplicado: false };
}
