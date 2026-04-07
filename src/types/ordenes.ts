// ─────────────────────────────────────────────────────────────
// Tipos TypeScript del sistema de órdenes / pagos
// ─────────────────────────────────────────────────────────────

export type OrdenEstado =
  | 'draft'
  | 'payment_pending'
  | 'paid_pending_service'
  | 'service_completed'
  | 'released'
  | 'cancelled'
  | 'refunded';

// ── Orden principal ────────────────────────────────────────

export interface Orden {
  id: string;
  estado: OrdenEstado;

  // Partes
  cliente_dni: string;
  cliente_email: string | null;
  prestador_id: string;

  // Servicio
  titulo: string;
  descripcion: string | null;

  // Montos
  monto_bruto: number;
  monto_prestador: number;
  monto_comision: number;
  porcentaje_comision: number;

  // Pago
  pago_proveedor: 'mercadopago' | 'mock';
  pago_link: string | null;
  pago_preferencia_id: string | null;
  pago_referencia_externa: string | null;
  pago_metadata: Record<string, unknown> | null;

  // Timestamps de estado
  paid_at: string | null;
  servicio_completado_at: string | null;
  liberado_at: string | null;
  creado_at: string;
  actualizado_at: string;

  // Join opcional (cuando se hace select con prestadores)
  prestadores?: {
    id: string;
    nombre: string;
    apellido: string;
    categoria: string;
    telefono?: string;
  };
}

// ── Evento de auditoría ────────────────────────────────────

export interface OrdenEvento {
  id: string;
  orden_id: string;
  tipo: string;
  estado_anterior: OrdenEstado | null;
  estado_nuevo: OrdenEstado | null;
  datos: Record<string, unknown> | null;
  creado_por: string | null;
  creado_at: string;
}

// ── Liquidación ────────────────────────────────────────────

export interface Liquidacion {
  id: string;
  orden_id: string;
  prestador_id: string;
  monto_bruto: number;
  monto_prestador: number;
  monto_comision: number;
  porcentaje_comision: number;
  metodo_transferencia: string | null;
  referencia_transferencia: string | null;
  nota: string | null;
  liberado_at: string;
  creado_at: string;
}

// ── Inputs para llamadas a la API ──────────────────────────

export interface CrearOrdenInput {
  cliente_dni: string;
  cliente_email?: string;
  prestador_id: string;
  titulo: string;
  descripcion?: string;
  monto_bruto: number;
  porcentaje_comision?: number;
}

export interface LiberarFondosInput {
  orden_id: string;
  metodo_transferencia?: string;
  referencia_transferencia?: string;
  nota?: string;
}

export interface CompletarServicioInput {
  orden_id: string;
  nota?: string;
}

// ── Respuestas de la API ───────────────────────────────────

export interface OrdenConDetalle {
  orden: Orden;
  eventos: OrdenEvento[];
  liquidacion: Liquidacion | null;
}

export interface ListaOrdenes {
  ordenes: Orden[];
  total: number;
  page: number;
  limit: number;
  totalPaginas: number;
}

// ── Helpers de UI ──────────────────────────────────────────

export const ESTADO_LABELS: Record<OrdenEstado, string> = {
  draft:                'Borrador',
  payment_pending:      'Esperando pago',
  paid_pending_service: 'Pagado – pendiente servicio',
  service_completed:    'Servicio realizado',
  released:             'Fondos liberados',
  cancelled:            'Cancelada',
  refunded:             'Reembolsada',
};

export const ESTADO_COLORS: Record<OrdenEstado, string> = {
  draft:                'bg-gray-500/20 text-gray-300',
  payment_pending:      'bg-yellow-500/20 text-yellow-300',
  paid_pending_service: 'bg-blue-500/20 text-blue-300',
  service_completed:    'bg-purple-500/20 text-purple-300',
  released:             'bg-green-500/20 text-green-300',
  cancelled:            'bg-red-500/20 text-red-300',
  refunded:             'bg-orange-500/20 text-orange-300',
};

export const ESTADOS_FINALES: OrdenEstado[] = ['released', 'cancelled', 'refunded'];

export function esEstadoFinal(estado: OrdenEstado): boolean {
  return ESTADOS_FINALES.includes(estado);
}

export function formatMonto(monto: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(monto);
}
