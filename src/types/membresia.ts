// ─────────────────────────────────────────────────────────────
// Tipos del sistema de membresías
// ─────────────────────────────────────────────────────────────

export type MembresiaEstado = 'pending' | 'paid' | 'overdue' | 'waived';

export interface Membresia {
  id: string;
  prestador_id: string;
  plan_name: string;
  amount: number;
  discount_applied: number;
  period_start: string;
  period_end: string;
  estado: MembresiaEstado;
  payment_link?: string | null;
  paid_at?: string | null;
  created_at: string;
  prestadores?: {
    id: string;
    nombre: string;
    apellido: string;
    categoria: string;
  };
}

export const MEMBRESIA_ESTADO_LABELS: Record<MembresiaEstado, string> = {
  pending: 'Pendiente',
  paid: 'Pagada',
  overdue: 'Vencida',
  waived: 'Condonada',
};

export const MEMBRESIA_ESTADO_COLORS: Record<MembresiaEstado, string> = {
  pending: 'bg-yellow-500/20 text-yellow-300',
  paid: 'bg-green-500/20 text-green-300',
  overdue: 'bg-red-500/20 text-red-300',
  waived: 'bg-gray-500/20 text-gray-400',
};
