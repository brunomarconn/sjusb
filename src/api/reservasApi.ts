// ─────────────────────────────────────────────────────────────
// API de Reservas
// ─────────────────────────────────────────────────────────────
import { supabase } from '../lib/supabase';
import type { Reserva, ReservaEstado, Comision } from '../types/reservas';

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

export const reservasApi = {

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
