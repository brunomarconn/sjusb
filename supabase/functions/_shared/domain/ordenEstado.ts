// ─────────────────────────────────────────────────────────────
// Máquina de estados de una Orden
// ÚNICA fuente de verdad para transiciones válidas
// ─────────────────────────────────────────────────────────────

export type OrdenEstado =
  | 'draft'
  | 'payment_pending'
  | 'paid_pending_service'
  | 'service_completed'
  | 'released'
  | 'cancelled'
  | 'refunded';

/**
 * Transiciones permitidas por estado.
 * Cualquier otra transición está prohibida.
 *
 * draft               → payment_pending, cancelled
 * payment_pending     → paid_pending_service, cancelled
 * paid_pending_service→ service_completed, refunded
 * service_completed   → released, refunded
 * released            → (estado final — sin salida)
 * cancelled           → (estado final — sin salida)
 * refunded            → (estado final — sin salida)
 */
const TRANSICIONES: Record<OrdenEstado, OrdenEstado[]> = {
  draft:                ['payment_pending', 'cancelled'],
  payment_pending:      ['paid_pending_service', 'cancelled'],
  paid_pending_service: ['service_completed', 'refunded'],
  service_completed:    ['released', 'refunded'],
  released:             [],
  cancelled:            [],
  refunded:             [],
};

/** Devuelve true si la transición es válida */
export function puedeTransicionar(
  actual: OrdenEstado,
  siguiente: OrdenEstado
): boolean {
  return TRANSICIONES[actual]?.includes(siguiente) ?? false;
}

/**
 * Lanza un error descriptivo si la transición no está permitida.
 * Usar antes de cualquier UPDATE de estado.
 */
export function validarTransicion(
  actual: OrdenEstado,
  siguiente: OrdenEstado
): void {
  if (!puedeTransicionar(actual, siguiente)) {
    const permitidas = TRANSICIONES[actual];
    const msg = permitidas.length > 0
      ? `Permitidas desde '${actual}': ${permitidas.join(', ')}`
      : `'${actual}' es un estado final, no permite más cambios`;
    throw new Error(
      `Transición inválida: '${actual}' → '${siguiente}'. ${msg}`
    );
  }
}

export const ESTADOS_FINALES: OrdenEstado[] = ['released', 'cancelled', 'refunded'];
export const ESTADOS_ACTIVOS: OrdenEstado[] = [
  'draft',
  'payment_pending',
  'paid_pending_service',
  'service_completed',
];

export function esEstadoFinal(estado: OrdenEstado): boolean {
  return ESTADOS_FINALES.includes(estado);
}
