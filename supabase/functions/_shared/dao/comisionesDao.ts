// ─────────────────────────────────────────────────────────────
// Acceso a datos: tabla comisiones
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function crear(db: SupabaseClient, data: {
  reserva_id: string;
  prestador_id: string;
  monto: number;
  estado: string;
}) {
  const { data: comision, error } = await db.from('comisiones').insert(data).select().single();
  if (error) throw error;
  return comision;
}

export async function actualizarLinkPago(db: SupabaseClient, id: string, data: {
  estado: string;
  mp_preference_id: string;
  mp_init_point: string;
  link_generado_at: string;
}) {
  return db.from('comisiones').update(data).eq('id', id);
}

export async function marcarEmailEnviado(db: SupabaseClient, id: string) {
  return db.from('comisiones').update({ email_enviado: true }).eq('id', id);
}

export async function obtenerPorId(db: SupabaseClient, id: string) {
  const { data } = await db.from('comisiones').select('*').eq('id', id).single();
  return data;
}

export async function marcarPagada(db: SupabaseClient, id: string, pagoId: string, pagoEstado: string) {
  const { error } = await db
    .from('comisiones')
    .update({
      estado: 'comision_pagada',
      mp_payment_id: pagoId,
      mp_payment_estado: pagoEstado,
      pagado_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}
