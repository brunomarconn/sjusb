// ─────────────────────────────────────────────────────────────
// DTOs para chat-enviar / chat-listar / chat-marcar-leido / chat-obtener
// ─────────────────────────────────────────────────────────────
import type { Identidad } from '../middlewares/auth.ts';

export interface EnviarMensajeInput {
  conversacion_id: string;
  contenido: string;
}

export interface MarcarLeidoInput {
  conversacion_id: string;
}

export interface ListarConversacionesFiltros {
  cliente_dni?: string | null;
  prestador_id?: string | null;
}

export interface ObtenerChatQuery {
  ordenId: string | null;
  conversacionId: string | null;
  prestadorDestinoId: string | null;
}

export type { Identidad };
