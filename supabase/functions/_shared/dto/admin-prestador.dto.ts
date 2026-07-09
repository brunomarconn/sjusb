// ─────────────────────────────────────────────────────────────
// DTOs de entrada para admin-prestador (una acción por payload)
// ─────────────────────────────────────────────────────────────

export interface CrearPrestadorInput {
  payload: Record<string, unknown>;
}

export interface ActualizarPrestadorInput {
  id: string;
  payload: Record<string, unknown>;
}

export interface CambiarEstadoInput {
  id: string;
  enabled: boolean;
}

export interface AgregarValoracionInput {
  prestador_id: string;
  nombre_cliente?: string;
  puntuacion?: number;
  comentario?: string;
}

export interface CambiarVisibilidadInput {
  id: string;
  visibility_status: 'visible' | 'hidden' | 'suspended';
}

export interface CambiarVerificacionInput {
  id: string;
  verification_status: 'none' | 'pending' | 'verified' | 'rejected';
}

export interface CambiarPlanInput {
  id: string;
  plan_phase?: 'free_seed' | 'membership' | 'mixed' | 'premium';
  membership_status?: 'not_required' | 'trial' | 'active' | 'past_due' | 'cancelled';
  monthly_price?: number;
  discount_rate?: number;
}

export interface MarcarDestacadoInput {
  id: string;
  is_featured?: boolean;
  is_top?: boolean;
}

export interface ModerarValoracionInput {
  id: string;
  is_visible?: boolean;
  admin_approved?: boolean;
}
