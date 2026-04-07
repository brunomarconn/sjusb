// ─────────────────────────────────────────────────────────────
// Servicio de Chat — capa de acceso al backend
// Todas las llamadas van a las Supabase Edge Functions.
// ─────────────────────────────────────────────────────────────
import type {
  ConversacionResumen,
  ConversacionConMensajes,
  Mensaje,
} from '../types/chat';

export type Auth = { clienteDni?: string; prestadorId?: string; esAdmin?: boolean };

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET as string | undefined;

function fnUrl(name: string): string {
  return `${SUPABASE_URL}/functions/v1/${name}`;
}

function baseHeaders(extra?: Record<string, string>): HeadersInit {
  return {
    apikey: ANON_KEY,
    ...extra,
  };
}

function adminHeaders(): HeadersInit {
  if (!ADMIN_SECRET) throw new Error('VITE_ADMIN_SECRET no configurada');
  return baseHeaders({ 'x-admin-secret': ADMIN_SECRET });
}

function authHeaders(auth: Auth): HeadersInit {
  if (auth.esAdmin) return adminHeaders();
  if (auth.clienteDni) return baseHeaders({ 'x-cliente-dni': auth.clienteDni });
  if (auth.prestadorId) return baseHeaders({ 'x-prestador-id': auth.prestadorId });
  throw new Error('Se requiere autenticación');
}

async function apiFetch<T>(url: string, options: RequestInit): Promise<T> {
  const resp = await fetch(url, options);
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.error ?? `Error ${resp.status}`);
  return data as T;
}

// ── API pública ────────────────────────────────────────────

export const chatService = {

  /**
   * Lista conversaciones del usuario con snapshot y no_leidos.
   */
  async listarConversaciones(
    auth: Auth,
    filtros?: { cliente_dni?: string; prestador_id?: string }
  ): Promise<{ conversaciones: ConversacionResumen[] }> {
    const headers = authHeaders(auth);
    const params = new URLSearchParams();
    if (auth.esAdmin && filtros?.cliente_dni) params.set('cliente_dni', filtros.cliente_dni);
    if (auth.esAdmin && filtros?.prestador_id) params.set('prestador_id', filtros.prestador_id);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiFetch<{ conversaciones: ConversacionResumen[] }>(
      `${fnUrl('chat-listar')}${qs}`,
      { method: 'GET', headers }
    );
  },

  /**
   * Obtiene (o crea) la conversación de una orden + sus mensajes.
   * También marca como leídos los mensajes del usuario solicitante.
   */
  async obtenerConversacion(
    ordenId: string,
    auth: Auth
  ): Promise<ConversacionConMensajes> {
    return apiFetch<ConversacionConMensajes>(
      `${fnUrl('chat-obtener')}?orden_id=${encodeURIComponent(ordenId)}`,
      { method: 'GET', headers: authHeaders(auth) }
    );
  },

  /**
   * Envía un mensaje y actualiza el snapshot de la conversación.
   */
  async enviarMensaje(
    conversacionId: string,
    contenido: string,
    auth: Auth
  ): Promise<{ mensaje: Mensaje }> {
    return apiFetch<{ mensaje: Mensaje }>(
      fnUrl('chat-enviar'),
      {
        method: 'POST',
        headers: {
          ...authHeaders(auth),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversacion_id: conversacionId, contenido }),
      }
    );
  },

  /**
   * Abre (o crea) una conversación directa entre cliente y prestador,
   * sin necesidad de que exista una orden. Usado desde la lista de prestadores.
   */
  async abrirConversacionDirecta(
    prestadorId: string,
    auth: Auth
  ): Promise<ConversacionConMensajes> {
    return apiFetch<ConversacionConMensajes>(
      `${fnUrl('chat-obtener')}?prestador_id=${encodeURIComponent(prestadorId)}`,
      { method: 'GET', headers: authHeaders(auth) }
    );
  },

  /**
   * Abre una conversación existente por su ID (para conversaciones directas desde la lista).
   */
  async abrirConversacionPorId(
    conversacionId: string,
    auth: Auth
  ): Promise<ConversacionConMensajes> {
    return apiFetch<ConversacionConMensajes>(
      `${fnUrl('chat-obtener')}?conversacion_id=${encodeURIComponent(conversacionId)}`,
      { method: 'GET', headers: authHeaders(auth) }
    );
  },

  /**
   * Resetea el contador de no leídos del usuario solicitante.
   */
  async marcarLeido(conversacionId: string, auth: Auth): Promise<void> {
    await apiFetch<{ ok: boolean }>(
      fnUrl('chat-marcar-leido'),
      {
        method: 'POST',
        headers: {
          ...authHeaders(auth),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversacion_id: conversacionId }),
      }
    );
  },
};
