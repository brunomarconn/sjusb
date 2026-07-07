// ─────────────────────────────────────────────────────────────
// DTOs para crear-orden / completar-servicio
// ─────────────────────────────────────────────────────────────

export interface CrearOrdenInput {
  cliente_dni: string;
  cliente_email?: string;
  prestador_id: string;
  titulo: string;
  descripcion?: string;
  monto_bruto: number | string;
  porcentaje_comision?: number;
}

export interface CompletarServicioInput {
  orden_id: string;
  nota?: string;
}
