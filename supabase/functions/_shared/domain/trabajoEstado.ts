// ─────────────────────────────────────────────────────────────
// Reglas de negocio sobre el estado de un Trabajo (lead)
// 5 estados visibles + 1 automático, ver modeloActualizado.md
// ─────────────────────────────────────────────────────────────

export type TrabajoEstado =
  | 'nuevo_contacto'
  | 'contactado'
  | 'presupuesto_enviado'
  | 'confirmado'
  | 'terminado'
  | 'no_avanzo';

export const ESTADOS_VISIBLES: TrabajoEstado[] = [
  'contactado',
  'presupuesto_enviado',
  'confirmado',
  'terminado',
  'no_avanzo',
];

export const ESTADOS_TERMINALES: TrabajoEstado[] = ['terminado', 'no_avanzo'];

/** Orden de progreso normal; "no_avanzo" es una salida lateral, no forma parte del orden. */
const ORDEN_PROGRESO: TrabajoEstado[] = [
  'nuevo_contacto',
  'contactado',
  'presupuesto_enviado',
  'confirmado',
  'terminado',
];

/**
 * Un trabajo puede avanzar (incluso salteando pasos) pero no retroceder,
 * y "no_avanzo" es alcanzable desde cualquier estado no terminal.
 * Una vez en un estado terminal (terminado/no_avanzo), no se puede
 * cambiar más vía el link del prestador (el admin sí puede corregir a mano).
 */
export function esTransicionValida(actual: string, siguiente: TrabajoEstado): boolean {
  if (ESTADOS_TERMINALES.includes(actual as TrabajoEstado)) return false;
  if (siguiente === 'no_avanzo') return true;

  const idxActual = ORDEN_PROGRESO.indexOf(actual as TrabajoEstado);
  const idxSiguiente = ORDEN_PROGRESO.indexOf(siguiente);
  if (idxActual === -1 || idxSiguiente === -1) return false;
  return idxSiguiente > idxActual;
}
