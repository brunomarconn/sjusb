// ─────────────────────────────────────────────────────────────
// Tipos del sistema de trabajos (leads), ver modeloActualizado.md
// ─────────────────────────────────────────────────────────────

export type TrabajoEstado =
  | 'nuevo_contacto'
  | 'contactado'
  | 'presupuesto_enviado'
  | 'confirmado'
  | 'terminado'
  | 'no_avanzo';

export type TrabajoSource = 'public_site' | 'admin_manual' | 'whatsapp' | 'other';

export type AdminValidationStatus =
  | 'not_checked'
  | 'confirmed_by_review'
  | 'manually_confirmed'
  | 'disputed'
  | 'false_report';

export interface Trabajo {
  id: string;
  prestador_id: string;
  vecino_nombre: string;
  vecino_telefono: string;
  vecino_direccion?: string | null;
  categoria?: string | null;
  servicio_descripcion?: string | null;
  source: TrabajoSource;
  estado: TrabajoEstado;
  estado_actualizado_at: string;
  created_at: string;
  completado_at?: string | null;
  job_token?: string;
  review_token?: string;
  admin_validation_status: AdminValidationStatus;
  review_requested_at?: string | null;
  review_received_at?: string | null;
  notes?: string | null;
  close_code?: string | null;
  prestadores?: {
    id: string;
    nombre: string;
    apellido: string;
    categoria: string;
    telefono?: string;
    foto_url?: string;
  };
}

export const TRABAJO_ESTADO_LABELS: Record<TrabajoEstado, string> = {
  nuevo_contacto: 'Nuevo contacto',
  contactado: 'Contactado',
  presupuesto_enviado: 'Presupuesto enviado',
  confirmado: 'Confirmado',
  terminado: 'Terminado',
  no_avanzo: 'No avanzó',
};

export const TRABAJO_ESTADO_COLORS: Record<TrabajoEstado, string> = {
  nuevo_contacto: 'bg-blue-500/20 text-blue-300',
  contactado: 'bg-cyan-500/20 text-cyan-300',
  presupuesto_enviado: 'bg-yellow-500/20 text-yellow-300',
  confirmado: 'bg-purple-500/20 text-purple-300',
  terminado: 'bg-green-500/20 text-green-300',
  no_avanzo: 'bg-gray-500/20 text-gray-400',
};

/** Botones visibles para el prestador (el estado automático "nuevo_contacto" no es un botón). */
export const ESTADOS_BOTONES: { estado: TrabajoEstado; icono: string }[] = [
  { estado: 'contactado', icono: 'ri-phone-line' },
  { estado: 'presupuesto_enviado', icono: 'ri-file-list-3-line' },
  { estado: 'confirmado', icono: 'ri-checkbox-circle-line' },
  { estado: 'terminado', icono: 'ri-flag-2-line' },
  { estado: 'no_avanzo', icono: 'ri-close-circle-line' },
];

const ORDEN_PROGRESO: TrabajoEstado[] = ['nuevo_contacto', 'contactado', 'presupuesto_enviado', 'confirmado', 'terminado'];
const ESTADOS_TERMINALES: TrabajoEstado[] = ['terminado', 'no_avanzo'];

/** Espejo de la validación del backend, solo para habilitar/deshabilitar botones en la UI. */
export function esTransicionValida(actual: TrabajoEstado, siguiente: TrabajoEstado): boolean {
  if (ESTADOS_TERMINALES.includes(actual)) return false;
  if (siguiente === 'no_avanzo') return true;
  const idxActual = ORDEN_PROGRESO.indexOf(actual);
  const idxSiguiente = ORDEN_PROGRESO.indexOf(siguiente);
  if (idxActual === -1 || idxSiguiente === -1) return false;
  return idxSiguiente > idxActual;
}

export function formatFechaTrabajo(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}
