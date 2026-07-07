// ─────────────────────────────────────────────────────────────
// DTOs de entrada para admin-prestador (una acción por payload)
// ─────────────────────────────────────────────────────────────

export interface CrearPrestadorInput {
  payload: Record<string, unknown>;
}

export interface ActualizarPrestadorInput {
  id: string;
  payload: Record<string, unknown>;
}

export interface CambiarEstadoInput {
  id: string;
  enabled: boolean;
}

export interface AgregarValoracionInput {
  prestador_id: string;
  nombre_cliente?: string;
  puntuacion?: number;
  comentario?: string;
}

export interface DisponibilidadEntrada {
  prestador_id: string;
  dia_semana: number;
  turno: 'mañana' | 'tarde';
}

export interface GestionarDisponibilidadInput {
  prestador_id: string;
  entradas: DisponibilidadEntrada[];
}
