// ─────────────────────────────────────────────────────────────
// Tipos de configuración del barrio (tabla configuracion_barrio)
// ─────────────────────────────────────────────────────────────

export type OfficialStatus = 'independent' | 'recommended' | 'official';
export type BusinessPhase = 'phase_0_seed' | 'phase_1_membership' | 'phase_2_mixed';

export interface RankingWeights {
  verified: number;
  featured: number;
  rating_ge_4_5: number;
  reviews_gt_5: number;
  regular_updates: number;
  active_membership: number;
  recent_warning: number;
  suspended: number;
  membership_overdue: number;
  stale_jobs: number;
}

export interface ConfigBarrio {
  id: 1;
  neighborhood_name: string;
  city: string;
  official_status: OfficialStatus;
  current_business_phase: BusinessPhase;
  free_lead_threshold: number;
  default_monthly_price: number;
  featured_price?: number | null;
  reactivation_fee?: number | null;
  whatsapp_business_number?: string | null;
  enable_close_code: boolean;
  enable_membership_payments: boolean;
  enable_featured_providers: boolean;
  enable_public_reviews: boolean;
  ranking_weights: RankingWeights;
  updated_at: string;
}

/** Subconjunto no sensible expuesto vía la vista pública v_config_publica. */
export interface ConfigPublica {
  neighborhood_name: string;
  city: string;
  official_status: OfficialStatus;
  enable_featured_providers: boolean;
  enable_public_reviews: boolean;
}

export const OFFICIAL_STATUS_LABELS: Record<OfficialStatus, string> = {
  independent: 'Independiente',
  recommended: 'Recomendada por el barrio',
  official: 'Canal oficial',
};

export const BUSINESS_PHASE_LABELS: Record<BusinessPhase, string> = {
  phase_0_seed: 'Fase 0 — Gratis (siembra)',
  phase_1_membership: 'Fase 1 — Membresía',
  phase_2_mixed: 'Fase 2 — Mixto',
};
