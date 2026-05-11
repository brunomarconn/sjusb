// ─────────────────────────────────────────────────────────────
// Tipos del sistema de reservas y comisiones
// ─────────────────────────────────────────────────────────────

export type ReservaEstado =
  | 'reserva_activa'
  | 'cancelada_por_usuario'
  | 'cancelacion_solicitada_por_prestador'
  | 'cancelacion_confirmada_por_usuario'
  | 'cancelacion_rechazada_por_usuario'
  | 'trabajo_concretado'
  | 'incidente';

export type ComisionEstado =
  | 'comision_pendiente'
  | 'link_pago_generado'
  | 'comision_pagada'
  | 'comision_vencida'
  | 'incidente';

export interface Reserva {
  id: string;
  prestador_id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  dia: string; // YYYY-MM-DD
  turno: 'mañana' | 'tarde';
  estado: ReservaEstado;
  zona?: string | null;
  descripcion_trabajo?: string | null;
  motivo_cancelacion?: string | null;
  cancelacion_solicitada_at?: string | null;
  trabajo_concretado_at?: string | null;
  created_at: string;
  prestadores?: {
    id: string;
    nombre: string;
    apellido: string;
    categoria: string;
    telefono?: string;
  };
}

export interface Comision {
  id: string;
  reserva_id: string;
  prestador_id: string;
  monto: number;
  estado: ComisionEstado;
  mp_preference_id?: string | null;
  mp_init_point?: string | null;
  mp_payment_id?: string | null;
  mp_payment_estado?: string | null;
  email_enviado: boolean;
  link_generado_at?: string | null;
  pagado_at?: string | null;
  created_at: string;
  reservas?: Reserva;
  prestadores?: {
    id: string;
    nombre: string;
    apellido: string;
    telefono?: string;
    categoria: string;
  };
}

// ── Labels y colores ──────────────────────────────────────────

export const RESERVA_ESTADO_LABELS: Record<ReservaEstado, string> = {
  reserva_activa:                       'Activa',
  cancelada_por_usuario:                'Cancelada por usuario',
  cancelacion_solicitada_por_prestador: 'Cancelación solicitada',
  cancelacion_confirmada_por_usuario:   'Cancelación confirmada',
  cancelacion_rechazada_por_usuario:    'Cancelación rechazada',
  trabajo_concretado:                   'Trabajo concretado',
  incidente:                            'Incidente',
};

export const RESERVA_ESTADO_COLORS: Record<ReservaEstado, string> = {
  reserva_activa:                       'bg-blue-500/20 text-blue-300',
  cancelada_por_usuario:                'bg-gray-500/20 text-gray-400',
  cancelacion_solicitada_por_prestador: 'bg-orange-500/20 text-orange-300',
  cancelacion_confirmada_por_usuario:   'bg-gray-500/20 text-gray-400',
  cancelacion_rechazada_por_usuario:    'bg-red-500/20 text-red-300',
  trabajo_concretado:                   'bg-green-500/20 text-green-300',
  incidente:                            'bg-red-600/20 text-red-400',
};

export const COMISION_ESTADO_LABELS: Record<ComisionEstado, string> = {
  comision_pendiente:  'Pendiente',
  link_pago_generado:  'Link generado',
  comision_pagada:     'Pagada',
  comision_vencida:    'Vencida',
  incidente:           'Incidente',
};

export const COMISION_ESTADO_COLORS: Record<ComisionEstado, string> = {
  comision_pendiente: 'bg-yellow-500/20 text-yellow-300',
  link_pago_generado: 'bg-blue-500/20 text-blue-300',
  comision_pagada:    'bg-green-500/20 text-green-300',
  comision_vencida:   'bg-red-500/20 text-red-300',
  incidente:          'bg-red-600/20 text-red-400',
};

// ── Helpers ───────────────────────────────────────────────────

const MESES = [
  'ene','feb','mar','abr','may','jun',
  'jul','ago','sep','oct','nov','dic',
];

export function formatFechaReserva(dia: string): string {
  const [y, m, d] = dia.split('-').map(Number);
  return `${d} ${MESES[m - 1]} ${y}`;
}

export function estaVencida(reserva: Reserva): boolean {
  const hoy = new Date().toISOString().slice(0, 10);
  return reserva.dia < hoy;
}
