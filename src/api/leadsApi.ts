// ─────────────────────────────────────────────────────────────
// API pública de leads/trabajos: crear al contactar por WhatsApp,
// y gestionar el estado desde el link tokenizado del prestador.
// ─────────────────────────────────────────────────────────────
import type { Trabajo, TrabajoEstado } from '../types/trabajo';

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;

function fnUrl(name: string): string {
  return `${SUPABASE_URL}/functions/v1/${name}`;
}

async function apiFetch<T>(url: string, body: unknown): Promise<T> {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.error ?? `Error ${resp.status}`);
  return data as T;
}

export const leadsApi = {
  async crearLead(input: {
    prestador_id: string;
    vecino_nombre: string;
    vecino_telefono: string;
    vecino_direccion?: string;
    categoria?: string;
    servicio_descripcion?: string;
    source?: string;
  }): Promise<{ trabajo_id: string; duplicado: boolean }> {
    return apiFetch(fnUrl('crear-lead'), input);
  },

  async obtenerTrabajoPorToken(jobToken: string): Promise<Trabajo> {
    return apiFetch(fnUrl('obtener-trabajo'), { job_token: jobToken });
  },

  async actualizarEstadoTrabajo(jobToken: string, estado: TrabajoEstado): Promise<Trabajo> {
    return apiFetch(fnUrl('actualizar-estado-trabajo'), { job_token: jobToken, estado });
  },
};
