// ─────────────────────────────────────────────────────────────
// Tipo canónico de Prestador (modelo de leads/membresía)
// Reemplaza el tipo obsoleto de src/lib/supabase.ts y las
// redeclaraciones ad hoc que existían por página.
// ─────────────────────────────────────────────────────────────
import type { Valoracion } from './resena';

export type VisibilityStatus = 'visible' | 'hidden' | 'suspended';
export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';
export type PlanPhase = 'free_seed' | 'membership' | 'mixed' | 'premium';
export type MembershipStatus = 'not_required' | 'trial' | 'active' | 'past_due' | 'cancelled';

export interface Prestador {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  email?: string | null;
  telefono?: string | null;
  categoria: string;
  zona?: string | null;
  foto_url: string;
  galeria_urls?: string[] | null;
  descripcion: string;
  enabled: boolean;
  trabajos_completados?: number;
  created_at: string;

  // Modelo de leads/membresía
  visibility_status: VisibilityStatus;
  verification_status: VerificationStatus;
  plan_phase: PlanPhase;
  membership_status: MembershipStatus;
  monthly_price?: number | null;
  discount_rate: number;
  is_featured: boolean;
  is_top: boolean;
  ranking_score: number;
  last_lead_at?: string | null;
  total_leads: number;
  total_contacted: number;
  total_budgets_sent: number;
  total_confirmed: number;
  total_completed: number;
  total_no_show_or_no_progress: number;
  average_rating: number;
  review_count: number;
  admin_notes?: string | null;
  provider_token: string;
  reactivation_fee_required: boolean;

  valoraciones?: Valoracion[];
}

export const VISIBILITY_LABELS: Record<VisibilityStatus, string> = {
  visible: 'Visible',
  hidden: 'Oculto',
  suspended: 'Suspendido',
};

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  none: 'Sin verificar',
  pending: 'Verificación pendiente',
  verified: 'Verificado',
  rejected: 'Rechazado',
};

export const PLAN_PHASE_LABELS: Record<PlanPhase, string> = {
  free_seed: 'Gratis (siembra)',
  membership: 'Membresía',
  mixed: 'Mixto',
  premium: 'Premium',
};

export const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, string> = {
  not_required: 'No requiere',
  trial: 'Prueba',
  active: 'Activa',
  past_due: 'Vencida',
  cancelled: 'Cancelada',
};

/** true si el prestador ya superó el umbral de leads para pasar a membresía. */
export function superoUmbralMembresia(prestador: Prestador, umbral: number): boolean {
  return prestador.plan_phase === 'free_seed' && prestador.total_leads >= umbral;
}
