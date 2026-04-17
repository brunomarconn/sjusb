// ─────────────────────────────────────────────────────────────
// Tipos TypeScript del sistema de chat
// ─────────────────────────────────────────────────────────────

export type SenderTipo = 'cliente' | 'prestador' | 'admin';
export type MensajeTipo = 'text' | 'system';

// ── Mensaje ────────────────────────────────────────────────

export interface Mensaje {
  id: string;
  conversacion_id: string;
  sender_tipo: SenderTipo;
  sender_id: string;
  contenido: string;
  tipo: MensajeTipo;
  created_at: string;
}

// ── Conversación con datos de joins ───────────────────────

export interface Conversacion {
  id: string;
  orden_id: string | null;
  cliente_dni: string;
  prestador_id: string;
  ultimo_mensaje_at: string | null;
  ultimo_mensaje_contenido: string | null;
  ultimo_mensaje_sender: SenderTipo | null;
  no_leidos_cliente: number;
  no_leidos_prestador: number;
  created_at: string;
  // Aplanados desde joins (presentes en chat-obtener)
  orden_titulo?: string;
  orden_estado?: string;
  prestador_nombre?: string;
  prestador_apellido?: string;
  prestador_categoria?: string;
}

// ── Resumen para la lista de conversaciones ───────────────

export interface ConversacionResumen {
  id: string;
  orden_id: string | null;
  cliente_dni: string;
  prestador_id: string;
  ultimo_mensaje_at: string | null;
  ultimo_mensaje_contenido: string | null;
  ultimo_mensaje_sender: SenderTipo | null;
  no_leidos: number;
  created_at: string;
  // Joins aplanados
  orden_titulo: string;
  orden_estado: string;
  prestador_nombre: string;
  prestador_apellido: string;
  prestador_categoria: string;
}

// ── Respuestas de la API ───────────────────────────────────

export interface ListaConversaciones {
  conversaciones: ConversacionResumen[];
}

export interface ConversacionConMensajes {
  conversacion: Conversacion;
  mensajes: Mensaje[];
}

// ── Helpers de UI ──────────────────────────────────────────

export function formatHoraChat(fechaIso: string): string {
  const fecha  = new Date(fechaIso);
  const ahora  = new Date();
  const hoy    = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const ayer   = new Date(hoy.getTime() - 86400000);
  const diaMsg = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());

  const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  if (diaMsg.getTime() === hoy.getTime()) return hora;
  if (diaMsg.getTime() === ayer.getTime()) return `Ayer ${hora}`;
  return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

export function formatFechaCompleta(fechaIso: string): string {
  return new Date(fechaIso).toLocaleString('es-AR', {
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}
