// ─────────────────────────────────────────────────────────────
// API admin de membresías/pagos
// ─────────────────────────────────────────────────────────────
import type { Membresia } from '../types/membresia';

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const ANON_KEY     = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET as string | undefined;

function adminHeaders(): HeadersInit {
  if (!ADMIN_SECRET) throw new Error('VITE_ADMIN_SECRET no configurada');
  return {
    apikey: ANON_KEY,
    authorization: `Bearer ${ANON_KEY}`,
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

export const membresiasApi = {
  async listar(): Promise<Membresia[]> {
    const { membresias } = await callEdgeFn<{ membresias: Membresia[] }>('admin-membresias', { action: 'listar' });
    return membresias;
  },

  async crear(input: {
    prestador_id: string;
    plan_name: string;
    amount: number;
    discount_applied?: number;
    period_start: string;
    period_end: string;
    payment_link?: string;
  }): Promise<Membresia> {
    const { membresia } = await callEdgeFn<{ membresia: Membresia }>('admin-membresias', { action: 'crear', ...input });
    return membresia;
  },

  async marcarPagada(id: string, prestadorId: string): Promise<void> {
    await callEdgeFn('admin-membresias', { action: 'marcar_pagada', id, prestador_id: prestadorId });
  },

  async marcarVencida(id: string, prestadorId: string): Promise<void> {
    await callEdgeFn('admin-membresias', { action: 'marcar_vencida', id, prestador_id: prestadorId });
  },

  async condonar(id: string, prestadorId: string): Promise<void> {
    await callEdgeFn('admin-membresias', { action: 'condonar', id, prestador_id: prestadorId });
  },
};
