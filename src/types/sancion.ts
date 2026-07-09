// ─────────────────────────────────────────────────────────────
// Tipos del sistema de sanciones a prestadores
// ─────────────────────────────────────────────────────────────

export type SancionTipo = 'reminder' | 'warning' | 'ranking_drop' | 'temporary_suspension' | 'permanent_ban';

export interface Sancion {
  id: string;
  prestador_id: string;
  tipo: SancionTipo;
  reason?: string | null;
  related_trabajo_id?: string | null;
  created_at: string;
  resolved_at?: string | null;
  admin_notes?: string | null;
}

export const SANCION_TIPO_LABELS: Record<SancionTipo, string> = {
  reminder: 'Recordatorio',
  warning: 'Advertencia',
  ranking_drop: 'Baja de ranking',
  temporary_suspension: 'Suspensión temporal',
  permanent_ban: 'Baja definitiva',
};
