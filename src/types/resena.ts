// ─────────────────────────────────────────────────────────────
// Tipos del sistema de reseñas (tabla valoraciones)
// ─────────────────────────────────────────────────────────────

export type ResenaSource = 'post_job_review' | 'manual' | 'imported';

export interface Valoracion {
  id: string;
  prestador_id: string;
  trabajo_id?: string | null;
  cliente_email: string;
  nombre_cliente: string;
  puntuacion: number;
  comentario: string;
  is_visible: boolean;
  source: ResenaSource;
  admin_approved: boolean;
  created_at: string;
  prestadores?: {
    id: string;
    nombre: string;
    apellido: string;
    categoria: string;
  };
}

export const RESENA_SOURCE_LABELS: Record<ResenaSource, string> = {
  post_job_review: 'Post-trabajo',
  manual: 'Manual',
  imported: 'Importada',
};
