// ─────────────────────────────────────────────────────────────
// DTOs de entrada para admin-membresias
// ─────────────────────────────────────────────────────────────

export interface CrearMembresiaAdminInput {
  prestador_id: string;
  plan_name: string;
  amount: number;
  discount_applied?: number;
  period_start: string;
  period_end: string;
  payment_link?: string;
}
