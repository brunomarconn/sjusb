// ─────────────────────────────────────────────────────────────
// Servicio de Reservas y Comisiones
// ─────────────────────────────────────────────────────────────
import { supabase } from '../lib/supabase';
import type { Reserva, Comision, ReservaEstado, ComisionEstado } from '../types/reservas';

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const ANON_KEY     = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET as string | undefined;

function adminHeaders(): HeadersInit {
  if (!ADMIN_SECRET) throw new Error('VITE_ADMIN_SECRET no configurada');
  return {
    'apikey': ANON_KEY,
    'authorization': `Bearer ${ANON_KEY}`,
    'x-admin-secret': ADMIN_SECRET,
    'Content-Type': 'application/json',
  };
}

async function callEdgeFn<T>(name: string, body: unknown): Promise<T> {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.error ?? `Error ${resp.status}`);
  return data as T;
}

function isOptionalComisionesError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('message' in error)) return false;
  const message = String(error.message).toLowerCase();
  const code = 'code' in error ? String(error.code).toLowerCase() : '';
  return code === '42p01'
    || code === 'pgrst205'
    || message.includes('comisiones')
    || message.includes('could not find the table')
    || message.includes('schema cache');
}

// ── Reservas ──────────────────────────────────────────────────

export const reservasService = {

  async listarTodas(filtros?: { estado?: ReservaEstado; prestador_id?: string }): Promise<Reserva[]> {
    let q = supabase
      .from('reservas')
      .select('*, prestadores(id, nombre, apellido, categoria, telefono)')
      .order('dia', { ascending: false })
      .order('created_at', { ascending: false });

    if (filtros?.estado)       q = q.eq('estado', filtros.estado);
    if (filtros?.prestador_id) q = q.eq('prestador_id', filtros.prestador_id);

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Reserva[];
  },

  async listarVencidas(): Promise<Reserva[]> {
    const hoy = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('reservas')
      .select('*, prestadores(id, nombre, apellido, categoria, telefono)')
      .eq('estado', 'reserva_activa')
      .lt('dia', hoy)
      .order('dia', { ascending: true });

    if (error) throw error;
    return (data ?? []) as Reserva[];
  },

  async actualizarEstado(
    reservaId: string,
    estado: ReservaEstado,
    extra?: { motivo_cancelacion?: string }
  ): Promise<void> {
    const payload: Record<string, unknown> = { estado };
    if (extra?.motivo_cancelacion) payload.motivo_cancelacion = extra.motivo_cancelacion;
    if (estado === 'trabajo_concretado') payload.trabajo_concretado_at = new Date().toISOString();
    if (estado === 'cancelacion_solicitada_por_prestador') payload.cancelacion_solicitada_at = new Date().toISOString();

    const { error } = await supabase.from('reservas').update(payload).eq('id', reservaId);
    if (error) throw error;
  },

  // Llamada a la edge function que procesa una reserva vencida:
  // actualiza estado → crea comisión → genera link MP → envía email admin
  async procesarVencida(reservaId: string): Promise<{ comision: Comision }> {
    return callEdgeFn<{ comision: Comision }>('procesar-comision', { reserva_id: reservaId });
  },
};

// ── Comisiones ────────────────────────────────────────────────

export const comisionesService = {

  async listarTodas(): Promise<Comision[]> {
    const { data, error } = await supabase
      .from('comisiones')
      .select('*, reservas(*, prestadores(id, nombre, apellido, categoria, telefono)), prestadores(id, nombre, apellido, categoria, telefono)')
      .order('created_at', { ascending: false });

    if (error && isOptionalComisionesError(error)) return [];
    if (error) throw error;
    return (data ?? []) as Comision[];
  },

  async listarPorPrestador(prestadorId: string): Promise<Comision[]> {
    const { data, error } = await supabase
      .from('comisiones')
      .select('*, reservas(id, nombre, apellido, dia, turno, zona, descripcion_trabajo)')
      .eq('prestador_id', prestadorId)
      .order('created_at', { ascending: false });

    if (error && isOptionalComisionesError(error)) return [];
    if (error) throw error;
    return (data ?? []) as Comision[];
  },

  async marcarPagadaManual(comisionId: string): Promise<void> {
    const { error } = await supabase
      .from('comisiones')
      .update({ estado: 'comision_pagada', pagado_at: new Date().toISOString(), mp_payment_estado: 'manual' })
      .eq('id', comisionId);
    if (error) throw error;
  },

  async actualizarEstado(comisionId: string, estado: ComisionEstado): Promise<void> {
    const payload: Record<string, unknown> = { estado };
    if (estado === 'comision_pagada') {
      payload.pagado_at = new Date().toISOString();
      payload.mp_payment_estado = 'manual';
    }
    const { error } = await supabase
      .from('comisiones')
      .update(payload)
      .eq('id', comisionId);
    if (error) throw error;
  },

  async marcarPendienteSiLinkGenerado(comisionId: string): Promise<void> {
    const { error } = await supabase
      .from('comisiones')
      .update({ estado: 'comision_pendiente' })
      .eq('id', comisionId)
      .eq('estado', 'link_pago_generado');
    if (error) throw error;
  },

  async marcarIncidente(comisionId: string): Promise<void> {
    const { error } = await supabase
      .from('comisiones')
      .update({ estado: 'incidente' })
      .eq('id', comisionId);
    if (error) throw error;
  },
};
