// ─────────────────────────────────────────────────────────────
// API admin de dashboard/reportes
// ─────────────────────────────────────────────────────────────

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
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/admin-dashboard`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.error ?? `Error ${resp.status}`);
  return data as T;
}

export interface KpisDashboard {
  leads_totales: number;
  leads_mes: number;
  leads_hoy: number;
  trabajos_terminados: number;
  trabajos_no_avanzo: number;
  tasa_contacto: number;
  tasa_presupuesto: number;
  tasa_confirmacion: number;
  tasa_finalizacion: number;
  tasa_no_avanzo: number;
  prestadores_activos: number;
  prestadores_verificados: number;
  prestadores_destacados: number;
  prestadores_suspendidos: number;
  membresias_activas: number;
  membresias_vencidas: number;
  rating_promedio_barrio: number;
  top_categorias: { categoria: string; cantidad: number }[];
  top_prestadores: { id: string; nombre: string; apellido: string; total_leads: number; average_rating: number; review_count: number }[];
}

export interface ReporteBarrio extends KpisDashboard {
  quejas_recientes: { id: string; tipo: string; reason: string | null; created_at: string; prestadores: { nombre: string; apellido: string } | null }[];
  prestadores_mejor_valorados: { id: string; nombre: string; apellido: string; categoria: string; average_rating: number; review_count: number }[];
}

export const dashboardAdminApi = {
  async obtenerKpis(): Promise<KpisDashboard> {
    const { kpis } = await callEdgeFn<{ kpis: KpisDashboard }>({ action: 'obtener_kpis' });
    return kpis;
  },

  async obtenerReporteBarrio(): Promise<ReporteBarrio> {
    const { reporte } = await callEdgeFn<{ reporte: ReporteBarrio }>({ action: 'obtener_reporte_barrio' });
    return reporte;
  },
};
