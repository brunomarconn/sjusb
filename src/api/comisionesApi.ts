// ─────────────────────────────────────────────────────────────
// API de Comisiones
// ─────────────────────────────────────────────────────────────
import { supabase } from '../lib/supabase';
import type { Comision, ComisionEstado } from '../types/reservas';

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

export const comisionesApi = {

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
