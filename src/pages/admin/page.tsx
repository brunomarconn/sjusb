import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../../services/chatService';
import type { Conversacion, ConversacionResumen, Mensaje } from '../../types/chat';
import { formatFechaCompleta, formatHoraChat } from '../../types/chat';
import PrestadoresAdmin from './PrestadoresAdmin';

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET as string | undefined;

type AdminView = 'home' | 'mensajes' | 'prestadores';

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
          <p className="text-gray-400 text-sm mt-1">Mensajes y conversaciones</p>
        </div>
        <form onSubmit={onLogin} className="space-y-4">
          <input
            type="password"
            value={passwordInput}
            onChange={e => onPasswordChange(e.target.value)}
            placeholder="Contrasena de administrador"
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
            Volver al inicio
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminHome({
  onEntrarMensajes,
  onEntrarPrestadores,
}: {
  onEntrarMensajes: () => void;
  onEntrarPrestadores: () => void;
}) {
  const modulos = [
    {
      icono: 'ri-user-star-line',
      titulo: 'Prestadores',
      desc: 'Gestión completa: alta, edición, pausar/activar, eliminar, valoraciones y control de estado.',
      cta: 'Gestionar prestadores',
      onClick: onEntrarPrestadores,
    },
    {
      icono: 'ri-chat-3-line',
      titulo: 'Mensajes',
      desc: 'Ver todas las conversaciones como visualizador total, con filtros por cliente y prestador.',
      cta: 'Entrar a mensajes',
      onClick: onEntrarMensajes,
    },
  ];

  return (
    <div className="max-w-3xl grid sm:grid-cols-2 gap-4">
      {modulos.map((m) => (
        <button
          key={m.titulo}
          onClick={m.onClick}
          className="text-left bg-[#16213e] border border-white/10 rounded-3xl p-6 sm:p-7 hover:border-[#e2b040]/50 hover:bg-[#1b2748] transition-colors"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#e2b040]/10 flex items-center justify-center mb-5">
            <i className={`${m.icono} text-3xl text-[#e2b040]`} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{m.titulo}</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-5">{m.desc}</p>
          <span className="inline-flex items-center gap-2 text-[#e2b040] font-semibold text-sm">
            {m.cta}
            <i className="ri-arrow-right-line" />
          </span>
        </button>
      ))}
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
                      {conv.orden_titulo || 'Conversacion directa'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {conv.ultimo_mensaje_contenido || 'Sin mensajes aun'}
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
              <p className="text-gray-400 font-medium">Elegi una conversacion</p>
              <p className="text-gray-600 text-sm mt-1">Vas a poder ver todos los mensajes como administrador.</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-white/10 bg-[#1b2748]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      {convActiva.orden_titulo || 'Conversacion directa'}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Cliente {convActiva.cliente_dni} · Prestador {convActiva.prestador_id}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-[520px]">
                {mensajes.length === 0 ? (
                  <div className="text-center text-gray-500 py-16">
                    Esta conversacion todavia no tiene mensajes.
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

export default function AdminPage() {
  const navigate = useNavigate();
  const [autenticado, setAutenticado] = useState(sessionStorage.getItem('mservicios_admin_ok') === '1');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorAuth, setErrorAuth] = useState('');
  const [vista, setVista] = useState<AdminView>('home');

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
      setErrorAuth('Error de configuración del servidor. Contactá al administrador.');
      return;
    }
    if (passwordInput === ADMIN_SECRET) {
      setAutenticado(true);
      sessionStorage.setItem('mservicios_admin_ok', '1');
    } else {
      setErrorAuth('Contraseña incorrecta.');
    }
  }

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
    if (vista === 'mensajes') cargarChats(filtrosChatAplicados);
  }, [autenticado, vista, cargarChats, filtrosChatAplicados]);

  async function abrirConversacionAdmin(conv: ConversacionResumen) {
    setCargandoConv(true);
    try {
      const res = conv.orden_id
        ? await chatService.obtenerConversacion(conv.orden_id, { esAdmin: true })
        : await chatService.abrirConversacionPorId(conv.id, { esAdmin: true });
      setConvActiva(res.conversacion);
      setMensajes(res.mensajes);
    } catch (err) {
      console.error('Error al abrir conversacion admin:', err);
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
                {vista === 'home' ? 'Elegí un módulo' :
                 vista === 'mensajes' ? 'Visualizador de mensajes' :
                 'Gestión de prestadores'}
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
        {vista === 'home' && (
          <AdminHome
            onEntrarMensajes={() => setVista('mensajes')}
            onEntrarPrestadores={() => setVista('prestadores')}
          />
        )}

        {vista === 'prestadores' && <PrestadoresAdmin />}

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
    </div>
  );
}
