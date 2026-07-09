// ─────────────────────────────────────────────────────────────
// DTOs de entrada para admin-trabajos
// ─────────────────────────────────────────────────────────────

export interface ActualizarTrabajoInput {
  id: string;
  estado?: string;
  admin_validation_status?: string;
  notes?: string;
}

export interface CrearTrabajoManualInput {
  prestador_id: string;
  vecino_nombre: string;
  vecino_telefono: string;
  vecino_direccion?: string;
  categoria?: string;
  servicio_descripcion?: string;
}
