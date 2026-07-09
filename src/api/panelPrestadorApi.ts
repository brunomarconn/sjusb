// ─────────────────────────────────────────────────────────────
// API del panel del prestador: acepta providerToken (link sin login)
// o un JWT de sesión (login por DNI existente).
// ─────────────────────────────────────────────────────────────
import type { Prestador } from '../types/prestador';
import type { Trabajo } from '../types/trabajo';
import type { Membresia } from '../types/membresia';

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;

export interface PanelPrestadorData {
  prestador: Prestador;
  trabajos: Trabajo[];
  membresias: Membresia[];
}

export const panelPrestadorApi = {
  async obtenerPanel(opts: { providerToken?: string; token?: string }): Promise<PanelPrestadorData> {
    const headers: Record<string, string> = { apikey: ANON_KEY, 'Content-Type': 'application/json' };
    if (opts.token) headers['authorization'] = `Bearer ${opts.token}`;

    const resp = await fetch(`${SUPABASE_URL}/functions/v1/panel-prestador`, {
      method: 'POST',
      headers,
      body: JSON.stringify(opts.providerToken ? { provider_token: opts.providerToken } : {}),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data?.error ?? `Error ${resp.status}`);
    return data as PanelPrestadorData;
  },
};
