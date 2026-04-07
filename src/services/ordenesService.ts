// ─────────────────────────────────────────────────────────────
// Servicio de Órdenes — capa de acceso al backend
// Todas las llamadas van a las Supabase Edge Functions.
// ─────────────────────────────────────────────────────────────
import type {
  Orden,
  OrdenConDetalle,
  ListaOrdenes,
  CrearOrdenInput,
  CompletarServicioInput,
  LiberarFondosInput,
} from '../types/ordenes';

// ── Configuración base ─────────────────────────────────────

const SUPABASE_URL   = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const ANON_KEY       = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;
const ADMIN_SECRET   = import.meta.env.VITE_ADMIN_SECRET as string | undefined;

function fnUrl(name: string): string {
  return `${SUPABASE_URL}/functions/v1/${name}`;
}

function baseHeaders(extra?: Record<string, string>): HeadersInit {
  return {
    'apikey': ANON_KEY,
    ...extra,
  };
}

function adminHeaders(): HeadersInit {
  if (!ADMIN_SECRET) throw new Error('VITE_ADMIN_SECRET no configurada');
  return baseHeaders({ 'x-admin-secret': ADMIN_SECRET });
}

function clienteHeaders(dni: string): HeadersInit {
  return baseHeaders({ 'x-cliente-dni': dni });
}

function prestadorHeaders(prestadorId: string): HeadersInit {
  return baseHeaders({ 'x-prestador-id': prestadorId });
}

// ── Helper de fetch ────────────────────────────────────────

async function apiFetch<T>(
  url: string,
  options: RequestInit
): Promise<T> {
  const resp = await fetch(url, options);
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data?.error ?? `Error ${resp.status}`);
  }
  return data as T;
}

// ── API pública ────────────────────────────────────────────

export const ordenesService = {

  /**
   * Obtiene una orden con eventos y liquidación.
   * Requiere: clienteDni | prestadorId | adminSecret en contexto.
   */
  async obtenerOrden(
    ordenId: string,
    auth: { clienteDni?: string; prestadorId?: string; esAdmin?: boolean }
  ): Promise<OrdenConDetalle> {
    const headers = auth.esAdmin
      ? adminHeaders()
      : auth.clienteDni
        ? clienteHeaders(auth.clienteDni)
        : prestadorHeaders(auth.prestadorId!);

    return apiFetch<OrdenConDetalle>(
      `${fnUrl('obtener-orden')}?id=${encodeURIComponent(ordenId)}`,
      { method: 'GET', headers }
    );
  },

  /**
   * Lista órdenes con filtros opcionales.
   */
  async listarOrdenes(
    auth: { clienteDni?: string; prestadorId?: string; esAdmin?: boolean },
    filtros?: {
      estado?: string;
      prestador_id?: string;
      cliente_dni?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<ListaOrdenes> {
    const headers = auth.esAdmin
      ? adminHeaders()
      : auth.clienteDni
        ? clienteHeaders(auth.clienteDni)
        : prestadorHeaders(auth.prestadorId!);

    const params = new URLSearchParams();
    if (filtros?.estado)       params.set('estado', filtros.estado);
    if (filtros?.prestador_id) params.set('prestador_id', filtros.prestador_id);
    if (filtros?.cliente_dni)  params.set('cliente_dni', filtros.cliente_dni);
    if (filtros?.page)         params.set('page', String(filtros.page));
    if (filtros?.limit)        params.set('limit', String(filtros.limit));

    const qs = params.toString() ? `?${params.toString()}` : '';

    return apiFetch<ListaOrdenes>(
      `${fnUrl('listar-ordenes')}${qs}`,
      { method: 'GET', headers }
    );
  },

  /**
   * Crea una nueva orden en estado draft. Solo admin.
   */
  async crearOrden(input: CrearOrdenInput): Promise<{ orden: Orden }> {
    return apiFetch<{ orden: Orden }>(
      fnUrl('crear-orden'),
      {
        method: 'POST',
        headers: { ...adminHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }
    );
  },

  /**
   * Genera el link de pago para una orden en estado draft.
   * Retorna idempotentemente si ya estaba en payment_pending.
   */
  async generarPago(
    ordenId: string
  ): Promise<{ pago_link: string; preferencia_id: string; orden: Orden; ya_generado?: boolean }> {
    return apiFetch(
      fnUrl('generar-pago'),
      {
        method: 'POST',
        headers: { ...baseHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ orden_id: ordenId }),
      }
    );
  },

  /**
   * Marca el servicio como completado. Solo admin.
   */
  async completarServicio(input: CompletarServicioInput): Promise<{ orden: Orden; mensaje: string }> {
    return apiFetch(
      fnUrl('completar-servicio'),
      {
        method: 'POST',
        headers: { ...adminHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }
    );
  },

  /**
   * Libera los fondos al prestador. Solo admin.
   */
  async liberarFondos(input: LiberarFondosInput): Promise<{ orden: Orden; liquidacion: unknown; mensaje: string }> {
    return apiFetch(
      fnUrl('liberar-fondos'),
      {
        method: 'POST',
        headers: { ...adminHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }
    );
  },

  /**
   * Simula un pago (solo PAYMENT_MODE=mock).
   */
  async simularPago(
    ordenId: string,
    estado: 'approved' | 'rejected' | 'cancelled' = 'approved'
  ): Promise<{ mensaje: string; pago_id: string; estado: string }> {
    return apiFetch(
      fnUrl('simular-pago'),
      {
        method: 'POST',
        headers: { ...baseHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ orden_id: ordenId, estado }),
      }
    );
  },
};
