// ─────────────────────────────────────────────────────────────
// DTOs para procesar-comision / mp-webhook-comision
// ─────────────────────────────────────────────────────────────

export interface ProcesarComisionInput {
  reserva_id: string;
}

export interface ProcesarComisionResult {
  comision: Record<string, unknown>;
  mensaje_wa: string;
}
