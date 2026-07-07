// ─────────────────────────────────────────────────────────────
// Reglas de negocio sobre el estado de una Reserva
// ─────────────────────────────────────────────────────────────

export type ReservaEstado =
  | 'reserva_activa'
  | 'trabajo_concretado'
  | 'cancelacion_solicitada_por_prestador'
  | 'cancelada';

/** "Hoy" en horario de Argentina (UTC-3), formato YYYY-MM-DD */
export function hoyAR(): string {
  const ahoraAR = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return ahoraAR.toISOString().slice(0, 10);
}

/**
 * Una reserva puede procesarse (generar comisión) solo si sigue activa
 * y su fecha ya pasó. Lanza un error descriptivo si no corresponde,
 * preservando los mismos mensajes/códigos que tenía procesar-comision.
 */
export function validarPuedeProcesarVencida(reserva: { estado: string; dia: string }): void {
  if (reserva.estado !== 'reserva_activa') {
    throw { status: 409, message: `La reserva ya está en estado "${reserva.estado}"` };
  }
  if (reserva.dia >= hoyAR()) {
    throw { status: 422, message: 'La reserva aún no venció (fecha futura o de hoy)' };
  }
}
