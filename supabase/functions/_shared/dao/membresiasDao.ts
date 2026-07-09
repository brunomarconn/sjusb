// ─────────────────────────────────────────────────────────────
// Acceso a datos: tabla membresias
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface CrearMembresiaInput {
  prestador_id: string;
  plan_name: string;
  amount: number;
  discount_applied?: number;
  period_start: string;
  period_end: string;
  payment_link?: string | null;
}

export async function crear(db: SupabaseClient, input: CrearMembresiaInput) {
  const { data, error } = await db
    .from('membresias')
    .insert([{
      prestador_id: input.prestador_id,
      plan_name: input.plan_name,
      amount: input.amount,
      discount_applied: input.discount_applied ?? 0,
      period_start: input.period_start,
      period_end: input.period_end,
      payment_link: input.payment_link ?? null,
    }])
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function listarTodas(db: SupabaseClient) {
  const { data, error } = await db
    .from('membresias')
    .select('*, prestadores(id, nombre, apellido, categoria)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listarPorPrestador(db: SupabaseClient, prestadorId: string) {
  const { data, error } = await db
    .from('membresias')
    .select('*')
    .eq('prestador_id', prestadorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function marcarPagada(db: SupabaseClient, id: string) {
  const { error } = await db
    .from('membresias')
    .update({ estado: 'paid', paid_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function actualizarEstado(db: SupabaseClient, id: string, estado: string) {
  const { error } = await db.from('membresias').update({ estado }).eq('id', id);
  if (error) throw error;
}
