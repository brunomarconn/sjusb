// ─────────────────────────────────────────────────────────────
// Página: /chat
// Sistema de mensajería entre clientes y prestadores.
// Soporte de realtime vía Supabase Realtime.
// ─────────────────────────────────────────────────────────────
import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { chatService } from '../../services/chatService';
import type {
  ConversacionResumen,
  Conversacion,
  Mensaje,
} from '../../types/chat';
import { formatHoraChat, formatFechaCompleta } from '../../types/chat';

// ─────────────────────────────────────────────────────────────
// Helpers de identidad
// ─────────────────────────────────────────────────────────────

function useIdentidad() {
  const clienteDni  = localStorage.getItem('mservicios_cliente_dni')   ?? undefined;
  const prestadorId = localStorage.getItem('mservicios_prestador_id')  ?? undefined;
  const esAdmin     = sessionStorage.getItem('mservicios_admin_ok') === '1';
  const tieneCliente = Boolean(clienteDni);
  const tienePrestador = Boolean(prestadorId);

  // Si por una sesión anterior quedaron ambos valores guardados,
  // priorizamos la identidad de prestador para no ocultar su bandeja.
  const tipo: 'admin' | 'cliente' | 'prestador' | null =
    esAdmin ? 'admin' : tienePrestador ? 'prestador' : tieneCliente ? 'cliente' : null;

  return {
    clienteDni: tipo === 'cliente' ? clienteDni : undefined,
    prestadorId: tipo === 'prestador' ? prestadorId : undefined,
    esAdmin,
    tipo,
  };
}

function auth(identidad: ReturnType<typeof useIdentidad>) {
  return {
    clienteDni:  identidad.clienteDni,
    prestadorId: identidad.prestadorId,
    esAdmin:     identidad.esAdmin,
  };
}

// ─────────────────────────────────────────────────────────────
// Componente: ItemConversacion
// ─────────────────────────────────────────────────────────────

interface ItemConversacionProps {
  conv:      ConversacionResumen;
  activa:    boolean;
  onClick:   () => void;
  tipoUsuario: 'cliente' | 'prestador' | 'admin';
}

function ItemConversacion({ conv, activa, onClick, tipoUsuario }: ItemConversacionProps) {
  const nombre     = `${conv.prestador_nombre} ${conv.prestador_apellido}`.trim() || 'Sin nombre';
  const otroLabel  = tipoUsuario === 'cliente'
    ? nombre
    : tipoUsuario === 'prestador'
      ? `Cliente ${conv.cliente_dni}`
      : `${nombre} / ${conv.cliente_dni}`;

  const preview = conv.ultimo_mensaje_contenido
    ? (conv.ultimo_mensaje_contenido.length > 55
        ? conv.ultimo_mensaje_contenido.slice(0, 55) + '…'
        : conv.ultimo_mensaje_contenido)
    : 'Sin mensajes aún';

  const hora = conv.ultimo_mensaje_at ? formatHoraChat(conv.ultimo_mensaje_at) : '';

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left px-4 py-3 flex items-start gap-3 transition-colors
        border-b border-white/5 hover:bg-white/5
        ${activa ? 'bg-[#e2b040]/10 border-l-2 border-l-[#e2b040]' : 'border-l-2 border-l-transparent'}
      `}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#e2b040]/20 flex items-center justify-center text-[#e2b040] font-semibold text-sm">
        {nombre.charAt(0).toUpperCase()}
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm font-medium truncate ${activa ? 'text-[#e2b040]' : 'text-white'}`}>
            {otroLabel}
          </span>
          <span className="text-xs text-gray-500 flex-shrink-0">{hora}</span>
        </div>
        <div className="text-xs text-gray-400 truncate mt-0.5">{conv.orden_titulo}</div>
        <div className="flex items-center justify-between mt-0.5">
          <span className={`text-xs truncate ${conv.no_leidos > 0 ? 'text-gray-300' : 'text-gray-500'}`}>
            {preview}
          </span>
          {conv.no_leidos > 0 && (
            <span className="ml-2 flex-shrink-0 w-5 h-5 rounded-full bg-[#e2b040] text-[#1a1a2e] text-xs font-bold flex items-center justify-center">
              {conv.no_leidos > 9 ? '9+' : conv.no_leidos}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Componente: BurbujaMensaje
// ─────────────────────────────────────────────────────────────

interface BurbujaMensajeProps {
  mensaje:    Mensaje;
  esMio:      boolean;
  esAdmin:    boolean;
}

function BurbujaMensaje({ mensaje, esMio, esAdmin }: BurbujaMensajeProps) {
  if (mensaje.tipo === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-gray-500 bg-white/5 rounded-full px-3 py-1">
          {mensaje.contenido}
        </span>
      </div>
    );
  }

  const senderLabel =
    mensaje.sender_tipo === 'admin'
      ? 'Admin'
      : mensaje.sender_tipo === 'cliente'
        ? `Cliente`
        : `Prestador`;

  return (
    <div className={`flex ${esMio ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[75%] ${esMio ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Etiqueta del remitente (solo admin la ve siempre, otros la ven en mensajes ajenos) */}
        {(!esMio || esAdmin) && (
          <span className="text-xs text-gray-500 mb-1 px-1">{senderLabel}</span>
        )}
        <div
          className={`
            rounded-2xl px-4 py-2 text-sm leading-relaxed break-words
            ${esMio
              ? 'bg-[#e2b040] text-[#1a1a2e] rounded-br-md font-medium'
              : 'bg-[#16213e] text-gray-100 rounded-bl-md border border-white/10'
            }
          `}
        >
          {mensaje.contenido}
        </div>
        <span className="text-xs text-gray-600 mt-1 px-1">
          {formatFechaCompleta(mensaje.created_at)}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Componente: PanelVacio
// ─────────────────────────────────────────────────────────────

function PanelVacio() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-[#e2b040]/10 flex items-center justify-center mb-4">
        <i className="ri-chat-3-line text-3xl text-[#e2b040]/50" />
      </div>
      <h3 className="text-gray-400 font-medium mb-2">Seleccioná una conversación</h3>
      <p className="text-gray-600 text-sm max-w-xs">
        Elegí una conversación de la lista para ver los mensajes.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Componente: PanelConversacion
// ─────────────────────────────────────────────────────────────

interface PanelConversacionProps {
  conversacion: Conversacion;
  mensajes:     Mensaje[];
  identidad:    ReturnType<typeof useIdentidad>;
  onVolver:     () => void;
  onMensajeEnviado: (msg: Mensaje) => void;
}

function PanelConversacion({
  conversacion, mensajes, identidad, onVolver, onMensajeEnviado,
}: PanelConversacionProps) {
  const [texto, setTexto]     = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError]     = useState('');
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll al último mensaje cuando cambian los mensajes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes.length]);

  // Determinar si un mensaje es mío
  function esMio(msg: Mensaje): boolean {
    if (identidad.esAdmin)    return msg.sender_tipo === 'admin';
    if (identidad.clienteDni) return msg.sender_tipo === 'cliente';
    if (identidad.prestadorId) return msg.sender_tipo === 'prestador';
    return false;
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const contenido = texto.trim();
    if (!contenido || enviando) return;

    setEnviando(true);
    setError('');
    try {
      const { mensaje } = await chatService.enviarMensaje(
        conversacion.id,
        contenido,
        auth(identidad)
      );
      setTexto('');
      onMensajeEnviado(mensaje);
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el mensaje');
    } finally {
      setEnviando(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar(e as unknown as React.FormEvent);
    }
  }

  const titulo    = conversacion.orden_titulo ?? 'Conversación';
  const otroNombre = identidad.tipo === 'cliente' || identidad.esAdmin
    ? `Prestador`
    : `Cliente`;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#16213e]">
        {/* Botón volver (móvil) */}
        <button
          onClick={onVolver}
          className="md:hidden p-2 rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
        >
          <i className="ri-arrow-left-line text-lg" />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-[#e2b040]/20 flex items-center justify-center text-[#e2b040] font-semibold text-sm flex-shrink-0">
          <i className="ri-user-line text-base" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{otroNombre}</div>
          <div className="text-xs text-gray-500 truncate">{titulo}</div>
        </div>

        {/* Link a la orden (solo si tiene orden) */}
        {conversacion.orden_id && (
          <a
            href={`/orden/${conversacion.orden_id}`}
            className="flex-shrink-0 text-xs text-[#e2b040]/70 hover:text-[#e2b040] transition-colors flex items-center gap-1"
          >
            <i className="ri-external-link-line" />
            <span className="hidden sm:inline">Ver orden</span>
          </a>
        )}
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <i className="ri-chat-1-line text-3xl text-gray-600 mb-3" />
            <p className="text-gray-500 text-sm">
              Aún no hay mensajes. ¡Escribí el primero!
            </p>
          </div>
        ) : (
          mensajes.map((msg) => (
            <BurbujaMensaje
              key={msg.id}
              mensaje={msg}
              esMio={esMio(msg)}
              esAdmin={!!identidad.esAdmin}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/10 bg-[#16213e] px-4 py-3">
        {error && (
          <p className="text-red-400 text-xs mb-2">{error}</p>
        )}
        <form onSubmit={enviar} className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Escribí un mensaje… (Enter para enviar)"
            rows={1}
            className="
              flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
              text-sm text-white placeholder-gray-500 resize-none
              focus:outline-none focus:border-[#e2b040]/50 focus:ring-1 focus:ring-[#e2b040]/20
              transition-colors leading-relaxed
            "
            style={{ minHeight: '44px', maxHeight: '120px' }}
            disabled={enviando}
          />
          <button
            type="submit"
            disabled={!texto.trim() || enviando}
            className="
              flex-shrink-0 w-10 h-10 rounded-xl bg-[#e2b040] text-[#1a1a2e]
              flex items-center justify-center font-bold
              disabled:opacity-40 disabled:cursor-not-allowed
              hover:bg-[#f0d080] active:scale-95
              transition-all
            "
          >
            {enviando
              ? <i className="ri-loader-4-line animate-spin text-lg" />
              : <i className="ri-send-plane-fill text-lg" />
            }
          </button>
        </form>
        <p className="text-xs text-gray-600 mt-1.5">Shift+Enter para nueva línea</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Página principal: ChatPage
// ─────────────────────────────────────────────────────────────

export default function ChatPage() {
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();
  const identidad       = useIdentidad();

  // ── Estado ─────────────────────────────────────────────
  const [conversaciones, setConversaciones]         = useState<ConversacionResumen[]>([]);
  const [convActiva, setConvActiva]                 = useState<Conversacion | null>(null);
  const [mensajes, setMensajes]                     = useState<Mensaje[]>([]);
  const [cargandoLista, setCargandoLista]           = useState(true);
  const [cargandoConv, setCargandoConv]             = useState(false);
  const [errorLista, setErrorLista]                 = useState('');
  const [mostrandoLista, setMostrandoLista]         = useState(true); // para móvil

  // Admin filters
  const [filtroDni, setFiltroDni]           = useState('');
  const [filtroPrestador, setFiltroPrestador] = useState('');
  const [filtroBuscado, setFiltroBuscado]   = useState<{ cliente_dni?: string; prestador_id?: string }>({});

  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Guard: usuario no identificado ─────────────────────
  if (!identidad.tipo) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#e2b040]/10 flex items-center justify-center mx-auto mb-4">
            <i className="ri-lock-line text-3xl text-[#e2b040]/50" />
          </div>
          <h2 className="text-white font-semibold text-lg mb-2">Acceso restringido</h2>
          <p className="text-gray-400 text-sm mb-6">
            Necesitás estar logueado para acceder a los mensajes.
          </p>
          <button
            onClick={() => navigate('/mi-cuenta')}
            className="bg-[#e2b040] text-[#1a1a2e] px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#f0d080] transition-colors"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  // ── Si viene con ?prestador=<id>, abrir conversación directa ──
  useEffect(() => {
    const prestadorParam = searchParams.get('prestador');
    if (!prestadorParam || identidad.tipo !== 'cliente') return;

    (async () => {
      setCargandoConv(true);
      setMostrandoLista(false);
      try {
        const res = await chatService.abrirConversacionDirecta(
          prestadorParam,
          auth(identidad)
        );
        setConvActiva(res.conversacion);
        setMensajes(res.mensajes);
        suscribirRealtime(res.conversacion.id);
        cargarLista();
      } catch (e) {
        console.error('Error al abrir conversación directa:', e);
      } finally {
        setCargandoConv(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cargar lista de conversaciones ─────────────────────
  const cargarLista = useCallback(async (filtros?: { cliente_dni?: string; prestador_id?: string }) => {
    setCargandoLista(true);
    setErrorLista('');
    try {
      const res = await chatService.listarConversaciones(auth(identidad), filtros);
      setConversaciones(res.conversaciones);
    } catch (err: unknown) {
      setErrorLista(err instanceof Error ? err.message : 'Error al cargar conversaciones');
    } finally {
      setCargandoLista(false);
    }
  }, [identidad.tipo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    cargarLista(filtroBuscado);
  }, [filtroBuscado]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Abrir conversación por orden_id desde query param ──
  useEffect(() => {
    const ordenId = searchParams.get('orden');
    if (!ordenId) return;

    (async () => {
      setCargandoConv(true);
      try {
        const res = await chatService.obtenerConversacion(ordenId, auth(identidad));
        setConvActiva(res.conversacion);
        setMensajes(res.mensajes);
        setMostrandoLista(false);
        // Refrescar lista para actualizar no_leidos
        cargarLista(filtroBuscado);
      } catch {
        // Ignorar si no tiene acceso
      } finally {
        setCargandoConv(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Abrir conversación desde la lista ─────────────────
  async function abrirConversacion(conv: ConversacionResumen) {
    setCargandoConv(true);
    setMostrandoLista(false);
    try {
      const res = conv.orden_id
        ? await chatService.obtenerConversacion(conv.orden_id, auth(identidad))
        : await chatService.abrirConversacionPorId(conv.id, auth(identidad));
      setConvActiva(res.conversacion);
      setMensajes(res.mensajes);

      // Actualizar no_leidos en la lista local
      setConversaciones(prev =>
        prev.map(c => c.id === conv.id ? { ...c, no_leidos: 0 } : c)
      );

      // Suscribir a mensajes en tiempo real
      suscribirRealtime(res.conversacion.id);
    } catch (err: unknown) {
      console.error('Error al abrir conversación:', err);
    } finally {
      setCargandoConv(false);
    }
  }

  // ── Realtime: suscripción a nuevos mensajes ─────────────
  function suscribirRealtime(conversacionId: string) {
    // Limpiar suscripción anterior
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    const channel = supabase
      .channel(`mensajes-${conversacionId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'mensajes',
          filter: `conversacion_id=eq.${conversacionId}`,
        },
        (payload) => {
          const nuevoMensaje = payload.new as Mensaje;

          setMensajes(prev => {
            // Evitar duplicados (puede ocurrir si el mensaje lo envió este cliente)
            if (prev.some(m => m.id === nuevoMensaje.id)) return prev;
            return [...prev, nuevoMensaje];
          });

          // Actualizar snapshot en la lista
          setConversaciones(prev =>
            prev.map(c =>
              c.id === conversacionId
                ? {
                    ...c,
                    ultimo_mensaje_at:        nuevoMensaje.created_at,
                    ultimo_mensaje_contenido: nuevoMensaje.contenido,
                    ultimo_mensaje_sender:    nuevoMensaje.sender_tipo,
                  }
                : c
            ).sort((a, b) => {
              const ta = a.ultimo_mensaje_at ? new Date(a.ultimo_mensaje_at).getTime() : 0;
              const tb = b.ultimo_mensaje_at ? new Date(b.ultimo_mensaje_at).getTime() : 0;
              return tb - ta;
            })
          );

          // Marcar como leído si la conversación está activa y el mensaje es ajeno
          if (
            nuevoMensaje.sender_tipo !== (identidad.esAdmin ? 'admin' : identidad.clienteDni ? 'cliente' : 'prestador')
          ) {
            chatService.marcarLeido(conversacionId, auth(identidad)).catch(() => {});
          }
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;
  }

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, []);

  // ── Handler: mensaje enviado exitosamente ──────────────
  function onMensajeEnviado(msg: Mensaje) {
    setMensajes(prev => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
    setConversaciones(prev =>
      prev.map(c =>
        c.id === msg.conversacion_id
          ? {
              ...c,
              ultimo_mensaje_at:        msg.created_at,
              ultimo_mensaje_contenido: msg.contenido,
              ultimo_mensaje_sender:    msg.sender_tipo,
              no_leidos:                0,
            }
          : c
      ).sort((a, b) => {
        const ta = a.ultimo_mensaje_at ? new Date(a.ultimo_mensaje_at).getTime() : 0;
        const tb = b.ultimo_mensaje_at ? new Date(b.ultimo_mensaje_at).getTime() : 0;
        return tb - ta;
      })
    );
  }

  // ── Volver a la lista (móvil) ─────────────────────────
  function volverALista() {
    setMostrandoLista(true);
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
  }

  // ── Aplicar filtros admin ──────────────────────────────
  function aplicarFiltros(e: React.FormEvent) {
    e.preventDefault();
    setFiltroBuscado({
      cliente_dni: filtroDni.trim() || undefined,
      prestador_id: filtroPrestador.trim() || undefined,
    });
    setConvActiva(null);
  }

  function limpiarFiltros() {
    setFiltroDni('');
    setFiltroPrestador('');
    setFiltroBuscado({});
  }

  const hayFiltros = filtroBuscado.cliente_dni || filtroBuscado.prestador_id;

  // ─────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col">

      {/* ── Header de página ──────────────────────────────── */}
      <div className="bg-[#16213e] border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
        >
          <i className="ri-arrow-left-line text-lg" />
        </button>
        <div>
          <h1 className="text-white font-semibold text-base leading-tight">Mensajes</h1>
          <p className="text-gray-500 text-xs">
            {identidad.tipo === 'admin' ? 'Todas las conversaciones' :
             identidad.tipo === 'cliente' ? 'Tus conversaciones' :
             'Conversaciones con clientes'}
          </p>
        </div>
      </div>

      {/* ── Filtros admin ──────────────────────────────────── */}
      {identidad.esAdmin && (
        <div className="bg-[#16213e]/60 border-b border-white/5 px-4 py-2">
          <form onSubmit={aplicarFiltros} className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">DNI cliente</label>
              <input
                type="text"
                value={filtroDni}
                onChange={e => setFiltroDni(e.target.value)}
                placeholder="Ej: 12345678"
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#e2b040]/50 w-36"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">ID prestador</label>
              <input
                type="text"
                value={filtroPrestador}
                onChange={e => setFiltroPrestador(e.target.value)}
                placeholder="UUID"
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#e2b040]/50 w-48"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#e2b040] text-[#1a1a2e] text-sm font-semibold rounded-lg hover:bg-[#f0d080] transition-colors"
            >
              Filtrar
            </button>
            {hayFiltros && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="px-3 py-1.5 bg-white/10 text-gray-300 text-sm rounded-lg hover:bg-white/20 transition-colors"
              >
                Limpiar
              </button>
            )}
          </form>
        </div>
      )}

      {/* ── Layout principal ───────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>

        {/* ── Panel izquierdo: lista ─────────────────────── */}
        <div
          className={`
            w-full md:w-80 lg:w-96 flex-shrink-0
            border-r border-white/10 flex flex-col
            ${mostrandoLista ? 'flex' : 'hidden md:flex'}
          `}
        >
          {/* Contador */}
          <div className="px-4 py-2 border-b border-white/5">
            <span className="text-xs text-gray-500">
              {cargandoLista
                ? 'Cargando…'
                : `${conversaciones.length} conversación${conversaciones.length !== 1 ? 'es' : ''}`
              }
              {hayFiltros && <span className="ml-1 text-[#e2b040]">(filtradas)</span>}
            </span>
          </div>

          {/* Error */}
          {errorLista && (
            <div className="mx-3 my-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {errorLista}
            </div>
          )}

          {/* Lista de conversaciones */}
          <div className="flex-1 overflow-y-auto">
            {cargandoLista ? (
              <div className="flex items-center justify-center py-16">
                <i className="ri-loader-4-line animate-spin text-2xl text-[#e2b040]/50" />
              </div>
            ) : conversaciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <i className="ri-chat-3-line text-3xl text-gray-600 mb-3" />
                <p className="text-gray-500 text-sm">
                  {hayFiltros
                    ? 'No hay conversaciones con esos filtros.'
                    : 'No tenés conversaciones todavía.'}
                </p>
                {!hayFiltros && !identidad.esAdmin && (
                  <p className="text-gray-600 text-xs mt-2">
                    Las conversaciones se crean desde el detalle de una orden.
                  </p>
                )}
              </div>
            ) : (
              conversaciones.map(conv => (
                <ItemConversacion
                  key={conv.id}
                  conv={conv}
                  activa={convActiva?.id === conv.id}
                  onClick={() => abrirConversacion(conv)}
                  tipoUsuario={identidad.tipo!}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Panel derecho: conversación activa ────────── */}
        <div
          className={`
            flex-1 flex flex-col
            ${!mostrandoLista ? 'flex' : 'hidden md:flex'}
          `}
        >
          {cargandoConv ? (
            <div className="flex-1 flex items-center justify-center">
              <i className="ri-loader-4-line animate-spin text-3xl text-[#e2b040]/50" />
            </div>
          ) : convActiva ? (
            <PanelConversacion
              conversacion={convActiva}
              mensajes={mensajes}
              identidad={identidad}
              onVolver={volverALista}
              onMensajeEnviado={onMensajeEnviado}
            />
          ) : (
            <PanelVacio />
          )}
        </div>
      </div>
    </div>
  );
}
