import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrdenCard } from '../../components/ordenes/OrdenCard';
import { EstadoBadge } from '../../components/ordenes/EstadoBadge';
import { ModalCrearOrden } from '../../components/ordenes/ModalCrearOrden';
import { ordenesService } from '../../services/ordenesService';
import { chatService } from '../../services/chatService';
import type { Orden, OrdenEstado, ListaOrdenes } from '../../types/ordenes';
import type { Conversacion, ConversacionResumen, Mensaje } from '../../types/chat';
import { ESTADO_LABELS, formatMonto } from '../../types/ordenes';
import { formatFechaCompleta, formatHoraChat } from '../../types/chat';

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET as string | undefined;

const TODOS_LOS_ESTADOS: (OrdenEstado | '')[] = [
  '', 'draft', 'payment_pending', 'paid_pending_service',
  'service_completed', 'released', 'cancelled', 'refunded',
];

type AdminView = 'home' | 'ordenes' | 'mensajes';

function LoginScreen({
  passwordInput,
  errorAuth,
  onPasswordChange,
  onLogin,
  onBack,
}: {
  passwordInput: string;
  errorAuth: string;
  onPasswordChange: (value: string) => void;
  onLogin: (e: React.FormEvent) => void;
  onBack: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
      <div className="bg-[#16213e] border border-white/10 rounded-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#e2b040]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="ri-shield-keyhole-line text-3xl text-[#e2b040]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Panel Admin</h1>
          <p className="text-gray-400 text-sm mt-1">Órdenes y conversaciones</p>
        </div>
        <form onSubmit={onLogin} className="space-y-4">
          <input
            type="password"
            value={passwordInput}
            onChange={e => onPasswordChange(e.target.value)}
            placeholder="Contraseña de administrador"
            className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#e2b040]/50"
            autoFocus
          />
          {errorAuth && <p className="text-red-400 text-sm">{errorAuth}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-[#e2b040] text-[#1a1a2e] rounded-xl font-bold hover:bg-[#e2b040]/90 transition-colors"
          >
            Ingresar
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full py-2.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Volver al inicio
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminHome({
  onEntrarOrdenes,
  onEntrarMensajes,
}: {
  onEntrarOrdenes: () => void;
  onEntrarMensajes: () => void;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <button
        onClick={onEntrarOrdenes}
        className="text-left bg-[#16213e] border border-white/10 rounded-3xl p-7 hover:border-[#e2b040]/50 hover:bg-[#1b2748] transition-colors"
      >
        <div className="w-14 h-14 rounded-2xl bg-[#e2b040]/10 flex items-center justify-center mb-5">
          <i className="ri-file-list-3-line text-3xl text-[#e2b040]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Órdenes</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          Ver el tablero actual de órdenes, crear nuevas y ejecutar acciones administrativas.
        </p>
        <span className="inline-flex items-center gap-2 text-[#e2b040] font-semibold text-sm">
          Entrar a órdenes
          <i className="ri-arrow-right-line" />
        </span>
      </button>

      <button
        onClick={onEntrarMensajes}
        className="text-left bg-[#16213e] border border-white/10 rounded-3xl p-7 hover:border-[#e2b040]/50 hover:bg-[#1b2748] transition-colors"
      >
        <div className="w-14 h-14 rounded-2xl bg-[#e2b040]/10 flex items-center justify-center mb-5">
          <i className="ri-chat-3-line text-3xl text-[#e2b040]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Mensajes</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          Ver todas las conversaciones como visualizador total, con filtros por cliente y prestador.
        </p>
        <span className="inline-flex items-center gap-2 text-[#e2b040] font-semibold text-sm">
          Entrar a mensajes
          <i className="ri-arrow-right-line" />
        </span>
      </button>
    </div>
  );
}

function MensajeBurbuja({ mensaje }: { mensaje: Mensaje }) {
  const color =
    mensaje.sender_tipo === 'admin'
      ? 'bg-purple-500/15 border-purple-400/20 text-purple-100'
      : mensaje.sender_tipo === 'prestador'
        ? 'bg-[#16213e] border-[#4ade80]/20 text-white'
        : 'bg-[#1f2d52] border-[#e2b040]/20 text-white';

  const remitente =
    mensaje.sender_tipo === 'cliente' ? 'Cliente'
      : mensaje.sender_tipo === 'prestador' ? 'Prestador' : 'Admin';

  return (
    <div className={`rounded-2xl border px-4 py-3 ${color}`}>
      <div className="flex items-center justify-between gap-3 mb-1">
        <span className="text-xs uppercase tracking-wide text-gray-400">{remitente}</span>
        <span className="text-xs text-gray-500">{formatFechaCompleta(mensaje.created_at)}</span>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{mensaje.contenido}</p>
    </div>
  );
}

function MensajesAdminView({
  conversaciones,
  convActiva,
  mensajes,
  cargandoLista,
  cargandoConv,
  errorLista,
  filtroCliente,
  filtroPrestador,
  onFiltroClienteChange,
  onFiltroPrestadorChange,
  onAplicarFiltros,
  onLimpiarFiltros,
  onAbrirConversacion,
}: {
  conversaciones: ConversacionResumen[];
  convActiva: Conversacion | null;
  mensajes: Mensaje[];
  cargandoLista: boolean;
  cargandoConv: boolean;
  errorLista: string;
  filtroCliente: string;
  filtroPrestador: string;
  onFiltroClienteChange: (value: string) => void;
  onFiltroPrestadorChange: (value: string) => void;
  onAplicarFiltros: (e: React.FormEvent) => void;
  onLimpiarFiltros: () => void;
  onAbrirConversacion: (conv: ConversacionResumen) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="bg-[#16213e] border border-white/10 rounded-2xl p-4">
        <form onSubmit={onAplicarFiltros} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">DNI cliente</label>
            <input
              type="text"
              value={filtroCliente}
              onChange={e => onFiltroClienteChange(e.target.value)}
              placeholder="Ej: 12345678"
              className="bg-[#1a1a2e] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e2b040]/50 w-40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">ID prestador</label>
            <input
              type="text"
              value={filtroPrestador}
              onChange={e => onFiltroPrestadorChange(e.target.value)}
              placeholder="UUID del prestador"
              className="bg-[#1a1a2e] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e2b040]/50 w-64"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#e2b040] text-[#1a1a2e] rounded-xl font-semibold text-sm hover:bg-[#e2b040]/90 transition-colors"
          >
            Filtrar
          </button>
          <button
            type="button"
            onClick={onLimpiarFiltros}
            className="px-4 py-2.5 bg-white/5 text-gray-300 rounded-xl text-sm hover:bg-white/10 transition-colors"
          >
            Limpiar
          </button>
        </form>
      </div>

      <div className="grid lg:grid-cols-[360px,1fr] gap-5 min-h-[620px]">
        <div className="bg-[#16213e] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-semibold">Conversaciones</h3>
            <span className="text-xs text-gray-500">{conversaciones.length} total</span>
          </div>

          {errorLista && (
            <div className="m-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {errorLista}
            </div>
          )}

          <div className="max-h-[560px] overflow-y-auto">
            {cargandoLista ? (
              <div className="flex items-center justify-center py-16">
                <i className="ri-loader-4-line animate-spin text-2xl text-[#e2b040]" />
              </div>
            ) : conversaciones.length === 0 ? (
              <div className="py-16 px-6 text-center">
                <i className="ri-chat-off-line text-3xl text-gray-600 mb-3 block" />
                <p className="text-gray-500 text-sm">No hay conversaciones para esos filtros.</p>
              </div>
            ) : (
              conversaciones.map(conv => {
                const activa = convActiva?.id === conv.id;
                const nombrePrestador = `${conv.prestador_nombre} ${conv.prestador_apellido}`.trim();
                return (
                  <button
                    key={conv.id}
                    onClick={() => onAbrirConversacion(conv)}
                    className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${activa ? 'bg-[#e2b040]/10' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${activa ? 'text-[#e2b040]' : 'text-white'}`}>
                          {nombrePrestador || conv.prestador_id}
                        </p>
                        <p className="text-xs text-gray-400 truncate">Cliente {conv.cliente_dni}</p>
                      </div>
                      <span className="text-[11px] text-gray-500 flex-shrink-0">
                        {conv.ultimo_mensaje_at ? formatHoraChat(conv.ultimo_mensaje_at) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {conv.orden_titulo || 'Conversación directa'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {conv.ultimo_mensaje_contenido || 'Sin mensajes aún'}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-[#16213e] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
          {cargandoConv ? (
            <div className="flex-1 flex items-center justify-center">
              <i className="ri-loader-4-line animate-spin text-3xl text-[#e2b040]" />
            </div>
          ) : !convActiva ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <i className="ri-chat-3-line text-4xl text-gray-600 mb-3" />
              <p className="text-gray-400 font-medium">Elegí una conversación</p>
              <p className="text-gray-600 text-sm mt-1">Vas a poder ver todos los mensajes como administrador.</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-white/10 bg-[#1b2748]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      {convActiva.orden_titulo || 'Conversación directa'}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Cliente {convActiva.cliente_dni} · Prestador {convActiva.prestador_id}
                    </p>
                    {convActiva.orden_id && (
                      <p className="text-xs text-gray-500 mt-1">Orden: {convActiva.orden_id}</p>
                    )}
                  </div>
                  {convActiva.orden_estado && <EstadoBadge estado={convActiva.orden_estado as OrdenEstado} />}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-[520px]">
                {mensajes.length === 0 ? (
                  <div className="text-center text-gray-500 py-16">
                    Esta conversación todavía no tiene mensajes.
                  </div>
                ) : (
                  mensajes.map(msg => <MensajeBurbuja key={msg.id} mensaje={msg} />)
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function OrdenesAdminView({
  datos,
  cargando,
  error,
  filtroEstado,
  pagina,
  onFiltroEstadoChange,
  onActualizar,
  onPaginaChange,
  onNuevaOrden,
  onCompletar,
  onLiberar,
}: {
  datos: ListaOrdenes | null;
  cargando: boolean;
  error: string;
  filtroEstado: OrdenEstado | '';
  pagina: number;
  onFiltroEstadoChange: (value: OrdenEstado | '') => void;
  onActualizar: () => void;
  onPaginaChange: (value: number) => void;
  onNuevaOrden: () => void;
  onCompletar: (orden: Orden) => void;
  onLiberar: (orden: Orden) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm text-gray-400">Filtrar por estado:</label>
          <select
            value={filtroEstado}
            onChange={e => onFiltroEstadoChange(e.target.value as OrdenEstado | '')}
            className="bg-[#16213e] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#e2b040]/50"
          >
            {TODOS_LOS_ESTADOS.map(est => (
              <option key={est} value={est}>
                {est === '' ? 'Todos los estados' : ESTADO_LABELS[est as OrdenEstado]}
              </option>
            ))}
          </select>
          <button
            onClick={onActualizar}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 text-gray-300 rounded-xl text-sm hover:bg-white/10 transition-colors"
          >
            <i className="ri-refresh-line" />
            Actualizar
          </button>
        </div>

        <button
          onClick={onNuevaOrden}
          className="flex items-center gap-2 px-4 py-2 bg-[#e2b040] text-[#1a1a2e] rounded-xl font-semibold text-sm hover:bg-[#e2b040]/90 transition-colors"
        >
          <i className="ri-file-add-line" />
          Nueva orden
        </button>
      </div>

      {datos && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total órdenes', valor: datos.total, icono: 'ri-file-list-line', color: 'text-white' },
            {
              label: 'Pagadas pendientes',
              valor: datos.ordenes.filter(o => o.estado === 'paid_pending_service').length,
              icono: 'ri-shield-check-line',
              color: 'text-blue-400',
            },
            {
              label: 'Servicio completado',
              valor: datos.ordenes.filter(o => o.estado === 'service_completed').length,
              icono: 'ri-check-double-line',
              color: 'text-purple-400',
            },
            {
              label: 'Liberadas',
              valor: datos.ordenes.filter(o => o.estado === 'released').length,
              icono: 'ri-money-dollar-circle-line',
              color: 'text-green-400',
            },
          ].map(stat => (
            <div key={stat.label} className="bg-[#16213e] border border-white/10 rounded-2xl p-4">
              <i className={`${stat.icono} text-2xl ${stat.color} mb-2 block`} />
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.valor}</p>
              <p className="text-gray-400 text-xs mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {cargando ? (
        <div className="flex items-center justify-center py-16">
          <i className="ri-loader-4-line animate-spin text-3xl text-[#e2b040]" />
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 flex gap-2">
          <i className="ri-error-warning-line" />
          {error}
        </div>
      ) : datos?.ordenes.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <i className="ri-file-list-3-line text-4xl mb-3 block" />
          No hay órdenes{filtroEstado ? ` con estado "${ESTADO_LABELS[filtroEstado as OrdenEstado]}"` : ''}.
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {datos?.ordenes.map(orden => (
              <OrdenCard
                key={orden.id}
                orden={orden}
                esAdmin
                onCompletarServicio={onCompletar}
                onLiberarFondos={onLiberar}
              />
            ))}
          </div>

          {datos && datos.totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => onPaginaChange(Math.max(1, pagina - 1))}
                disabled={pagina === 1}
                className="px-4 py-2 bg-white/5 text-gray-300 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-40"
              >
                <i className="ri-arrow-left-s-line" />
              </button>
              <span className="text-gray-400 text-sm">
                Pág. {pagina} / {datos.totalPaginas}
              </span>
              <button
                onClick={() => onPaginaChange(Math.min(datos.totalPaginas, pagina + 1))}
                disabled={pagina === datos.totalPaginas}
                className="px-4 py-2 bg-white/5 text-gray-300 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-40"
              >
                <i className="ri-arrow-right-s-line" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [autenticado, setAutenticado] = useState(sessionStorage.getItem('mservicios_admin_ok') === '1');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorAuth, setErrorAuth] = useState('');
  const [vista, setVista] = useState<AdminView>('home');

  const [datos, setDatos] = useState<ListaOrdenes | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const [filtroEstado, setFiltroEstado] = useState<OrdenEstado | ''>('');
  const [pagina, setPagina] = useState(1);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [accion, setAccion] = useState<{ tipo: 'completar' | 'liberar'; orden: Orden } | null>(null);
  const [notaAccion, setNotaAccion] = useState('');
  const [metodoTransf, setMetodoTransf] = useState('');
  const [refTransf, setRefTransf] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [mensajeOk, setMensajeOk] = useState('');

  const [conversaciones, setConversaciones] = useState<ConversacionResumen[]>([]);
  const [convActiva, setConvActiva] = useState<Conversacion | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cargandoListaChats, setCargandoListaChats] = useState(false);
  const [cargandoConv, setCargandoConv] = useState(false);
  const [errorChats, setErrorChats] = useState('');
  const [filtroClienteChat, setFiltroClienteChat] = useState('');
  const [filtroPrestadorChat, setFiltroPrestadorChat] = useState('');
  const [filtrosChatAplicados, setFiltrosChatAplicados] = useState<{ cliente_dni?: string; prestador_id?: string }>({});

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!ADMIN_SECRET) {
      setAutenticado(true);
      sessionStorage.setItem('mservicios_admin_ok', '1');
      return;
    }
    if (passwordInput === ADMIN_SECRET) {
      setAutenticado(true);
      sessionStorage.setItem('mservicios_admin_ok', '1');
    } else {
      setErrorAuth('Contraseña incorrecta');
    }
  }

  const cargarOrdenes = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const res = await ordenesService.listarOrdenes(
        { esAdmin: true },
        { estado: filtroEstado || undefined, page: pagina, limit: 20 }
      );
      setDatos(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar órdenes');
    } finally {
      setCargando(false);
    }
  }, [filtroEstado, pagina]);

  const cargarChats = useCallback(async (filtros?: { cliente_dni?: string; prestador_id?: string }) => {
    setCargandoListaChats(true);
    setErrorChats('');
    try {
      const res = await chatService.listarConversaciones({ esAdmin: true }, filtros);
      setConversaciones(res.conversaciones);
    } catch (err: unknown) {
      setErrorChats(err instanceof Error ? err.message : 'Error al cargar conversaciones');
    } finally {
      setCargandoListaChats(false);
    }
  }, []);

  useEffect(() => {
    if (!autenticado) return;
    if (vista === 'ordenes') cargarOrdenes();
    if (vista === 'mensajes') cargarChats(filtrosChatAplicados);
  }, [autenticado, vista, cargarOrdenes, cargarChats, filtrosChatAplicados]);

  async function abrirConversacionAdmin(conv: ConversacionResumen) {
    setCargandoConv(true);
    try {
      const res = conv.orden_id
        ? await chatService.obtenerConversacion(conv.orden_id, { esAdmin: true })
        : await chatService.abrirConversacionPorId(conv.id, { esAdmin: true });
      setConvActiva(res.conversacion);
      setMensajes(res.mensajes);
    } catch (err) {
      console.error('Error al abrir conversación admin:', err);
    } finally {
      setCargandoConv(false);
    }
  }

  function aplicarFiltrosChat(e: React.FormEvent) {
    e.preventDefault();
    setFiltrosChatAplicados({
      cliente_dni: filtroClienteChat.trim() || undefined,
      prestador_id: filtroPrestadorChat.trim() || undefined,
    });
    setConvActiva(null);
    setMensajes([]);
  }

  function limpiarFiltrosChat() {
    setFiltroClienteChat('');
    setFiltroPrestadorChat('');
    setFiltrosChatAplicados({});
    setConvActiva(null);
    setMensajes([]);
  }

  async function confirmarAccion() {
    if (!accion) return;
    setProcesando(true);
    setMensajeOk('');
    try {
      if (accion.tipo === 'completar') {
        await ordenesService.completarServicio({ orden_id: accion.orden.id, nota: notaAccion || undefined });
        setMensajeOk('Servicio marcado como completado');
      } else {
        await ordenesService.liberarFondos({
          orden_id: accion.orden.id,
          metodo_transferencia: metodoTransf || undefined,
          referencia_transferencia: refTransf || undefined,
          nota: notaAccion || undefined,
        });
        setMensajeOk('Fondos liberados al prestador');
      }
      setAccion(null);
      setNotaAccion('');
      setMetodoTransf('');
      setRefTransf('');
      await cargarOrdenes();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error');
    } finally {
      setProcesando(false);
    }
  }

  if (!autenticado) {
    return (
      <LoginScreen
        passwordInput={passwordInput}
        errorAuth={errorAuth}
        onPasswordChange={value => { setPasswordInput(value); setErrorAuth(''); }}
        onLogin={handleLogin}
        onBack={() => navigate('/')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white">
      <header className="bg-[#16213e] border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => vista === 'home' ? navigate('/') : setVista('home')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <i className="ri-arrow-left-line text-xl" />
            </button>
            <div>
              <h1 className="font-bold text-lg text-white flex items-center gap-2">
                <i className="ri-shield-keyhole-line text-[#e2b040]" />
                Panel Admin
              </h1>
              <p className="text-xs text-gray-500">
                {vista === 'home' ? 'Elegí un módulo' : vista === 'ordenes' ? 'Gestión de órdenes' : 'Visualizador total de mensajes'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {vista !== 'home' && (
              <button
                onClick={() => setVista('home')}
                className="px-4 py-2 bg-white/5 text-gray-300 rounded-xl text-sm hover:bg-white/10 transition-colors"
              >
                Inicio admin
              </button>
            )}
            <button
              onClick={() => {
                setAutenticado(false);
                setPasswordInput('');
                sessionStorage.removeItem('mservicios_admin_ok');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 text-gray-400 rounded-xl text-sm hover:bg-white/10 transition-colors"
            >
              <i className="ri-logout-box-line" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {mensajeOk && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 flex items-center gap-2">
            <i className="ri-checkbox-circle-line" />
            {mensajeOk}
          </div>
        )}

        {vista === 'home' && (
          <AdminHome
            onEntrarOrdenes={() => setVista('ordenes')}
            onEntrarMensajes={() => setVista('mensajes')}
          />
        )}

        {vista === 'ordenes' && (
          <OrdenesAdminView
            datos={datos}
            cargando={cargando}
            error={error}
            filtroEstado={filtroEstado}
            pagina={pagina}
            onFiltroEstadoChange={value => { setFiltroEstado(value); setPagina(1); }}
            onActualizar={cargarOrdenes}
            onPaginaChange={setPagina}
            onNuevaOrden={() => setMostrarModal(true)}
            onCompletar={orden => { setAccion({ tipo: 'completar', orden }); setNotaAccion(''); }}
            onLiberar={orden => { setAccion({ tipo: 'liberar', orden }); setNotaAccion(''); }}
          />
        )}

        {vista === 'mensajes' && (
          <MensajesAdminView
            conversaciones={conversaciones}
            convActiva={convActiva}
            mensajes={mensajes}
            cargandoLista={cargandoListaChats}
            cargandoConv={cargandoConv}
            errorLista={errorChats}
            filtroCliente={filtroClienteChat}
            filtroPrestador={filtroPrestadorChat}
            onFiltroClienteChange={setFiltroClienteChat}
            onFiltroPrestadorChange={setFiltroPrestadorChat}
            onAplicarFiltros={aplicarFiltrosChat}
            onLimpiarFiltros={limpiarFiltrosChat}
            onAbrirConversacion={abrirConversacionAdmin}
          />
        )}
      </main>

      {mostrarModal && (
        <ModalCrearOrden
          onClose={() => setMostrarModal(false)}
          onCreada={() => {
            setMostrarModal(false);
            cargarOrdenes();
          }}
        />
      )}

      {accion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        >
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="font-bold text-white">
                {accion.tipo === 'completar' ? 'Confirmar servicio completado' : 'Liberar fondos'}
              </h2>
              <button onClick={() => setAccion(null)} className="text-gray-400 hover:text-white transition-colors">
                <i className="ri-close-line text-xl" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-[#16213e] rounded-xl p-4">
                <p className="text-white font-semibold">{accion.orden.titulo}</p>
                <div className="flex items-center gap-2 mt-1">
                  <EstadoBadge estado={accion.orden.estado} />
                  <span className="text-[#e2b040] font-bold">{formatMonto(accion.orden.monto_bruto)}</span>
                </div>
                {accion.tipo === 'liberar' && (
                  <p className="text-sm text-green-400 mt-2">
                    Se liberarán <strong>{formatMonto(accion.orden.monto_prestador)}</strong> al prestador.
                  </p>
                )}
              </div>

              {accion.tipo === 'liberar' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Método de transferencia</label>
                    <input
                      type="text"
                      value={metodoTransf}
                      onChange={e => setMetodoTransf(e.target.value)}
                      placeholder="Ej: Transferencia bancaria, Mercado Pago..."
                      className="w-full bg-[#16213e] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#e2b040]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Referencia / comprobante</label>
                    <input
                      type="text"
                      value={refTransf}
                      onChange={e => setRefTransf(e.target.value)}
                      placeholder="Nro de operación o comprobante"
                      className="w-full bg-[#16213e] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#e2b040]/50"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Nota interna (opcional)</label>
                <textarea
                  value={notaAccion}
                  onChange={e => setNotaAccion(e.target.value)}
                  placeholder="Observaciones para el registro..."
                  rows={2}
                  className="w-full bg-[#16213e] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#e2b040]/50 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setAccion(null)}
                  className="flex-1 py-2.5 bg-white/5 text-gray-300 rounded-xl hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarAccion}
                  disabled={procesando}
                  className={`flex-1 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 ${
                    accion.tipo === 'completar'
                      ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                      : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                  }`}
                >
                  {procesando ? (
                    <><i className="ri-loader-4-line animate-spin" /> Procesando...</>
                  ) : accion.tipo === 'completar' ? (
                    <><i className="ri-check-double-line" /> Confirmar</>
                  ) : (
                    <><i className="ri-money-dollar-circle-line" /> Liberar fondos</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
