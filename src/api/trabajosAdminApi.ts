// ─────────────────────────────────────────────────────────────
// API admin de trabajos/leads
// ─────────────────────────────────────────────────────────────
import type { Trabajo, TrabajoEstado, AdminValidationStatus } from '../types/trabajo';

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

export const trabajosAdminApi = {
  async listar(filtros?: { estado?: TrabajoEstado; prestador_id?: string; admin_validation_status?: AdminValidationStatus }): Promise<Trabajo[]> {
    const { trabajos } = await callEdgeFn<{ trabajos: Trabajo[] }>('admin-trabajos', { action: 'listar', filtros });
    return trabajos;
  },

  async obtener(id: string): Promise<Trabajo> {
    const { trabajo } = await callEdgeFn<{ trabajo: Trabajo }>('admin-trabajos', { action: 'obtener', id });
    return trabajo;
  },

  async actualizar(id: string, cambios: { estado?: TrabajoEstado; admin_validation_status?: AdminValidationStatus; notes?: string }): Promise<void> {
    await callEdgeFn('admin-trabajos', { action: 'actualizar', id, ...cambios });
  },

  async crearManual(input: {
    prestador_id: string;
    vecino_nombre: string;
    vecino_telefono: string;
    vecino_direccion?: string;
    categoria?: string;
    servicio_descripcion?: string;
  }): Promise<{ id: string }> {
    return callEdgeFn('admin-trabajos', { action: 'crear_manual', ...input });
  },
};
