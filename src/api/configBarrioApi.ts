// ─────────────────────────────────────────────────────────────
// API admin de configuración del barrio
// ─────────────────────────────────────────────────────────────
import type { ConfigBarrio } from '../types/configBarrio';

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

async function callEdgeFn<T>(body: unknown): Promise<T> {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/admin-config`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.error ?? `Error ${resp.status}`);
  return data as T;
}

export const configBarrioApi = {
  async obtener(): Promise<ConfigBarrio> {
    const { config } = await callEdgeFn<{ config: ConfigBarrio }>({ action: 'obtener' });
    return config;
  },

  async actualizar(payload: Partial<ConfigBarrio>): Promise<ConfigBarrio> {
    const { config } = await callEdgeFn<{ config: ConfigBarrio }>({ action: 'actualizar', payload });
    return config;
  },
};
