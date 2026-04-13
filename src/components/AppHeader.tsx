// ─────────────────────────────────────────────────────────────
// Componente: AppHeader
// Header compartido para todas las páginas públicas.
// Muestra dropdown "Mi Cuenta" con opciones según estado de sesión.
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface AppHeaderProps {
  /** Fondo transparente + efecto scroll (solo para inicio) */
  transparent?: boolean;
  scrolled?: boolean;
  /** Callback para scroll a sección en inicio */
  onQuienesSomos?: () => void;
  /** Callback personalizado para cerrar sesión */
  onCerrarSesion?: () => void;
  /** Mostrar puntos del usuario (opcional) */
  puntosUsuario?: number | null;
}

export default function AppHeader({
  transparent = false,
  scrolled = false,
  onQuienesSomos,
  onCerrarSesion,
  puntosUsuario,
}: AppHeaderProps) {
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const clienteDni   = localStorage.getItem('mservicios_cliente_dni');
  const prestadorIdLS = localStorage.getItem('mservicios_prestador_id');
  const logueadoComoCliente   = Boolean(clienteDni);
  const logueadoComoPrestador = Boolean(prestadorIdLS) && !clienteDni;
  const estaLogueado = logueadoComoCliente || logueadoComoPrestador;

  const bgClass = transparent
    ? scrolled
      ? 'bg-[#16213e]/95 backdrop-blur-sm shadow-lg'
      : 'bg-transparent'
    : 'bg-[#16213e]/95 backdrop-blur-sm shadow-lg';

  function handleCerrarSesion() {
    setMenuAbierto(false);
    if (onCerrarSesion) {
      onCerrarSesion();
      return;
    }
    localStorage.removeItem('mservicios_cliente_dni');
    localStorage.removeItem('mservicios_prestador_id');
    localStorage.removeItem('dniPrestador');
    navigate('/');
  }

  function cerrarMenu() {
    setMenuAbierto(false);
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${bgClass}`}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo */}
        <div className="flex flex-col items-center cursor-pointer" onClick={() => navigate('/')}>
          <img
            src="https://public.readdy.ai/ai/img_res/ebf8ba70-3b01-48d0-b580-89cd2fe53a3e.png"
            alt="MServicios Logo"
            className="w-10 h-10 object-contain"
          />
          <span className="text-xs font-bold text-[#e2b040] leading-tight mt-0.5">MRServicios</span>
        </div>

        {/* Derecha */}
        <div className="flex items-center gap-2">

          {/* Mensajes — solo si está logueado */}
          {estaLogueado && (
            <button
              onClick={() => navigate('/chat')}
              className="p-2 rounded-full border border-white/20 text-gray-300 hover:border-[#e2b040] hover:text-[#e2b040] transition-all cursor-pointer flex items-center gap-1.5"
              title="Mensajes"
            >
              <i className="ri-chat-3-line text-base" />
              <span className="hidden sm:inline text-xs font-semibold">Mensajes</span>
            </button>
          )}

          {/* Quiénes Somos — solo desktop */}
          {onQuienesSomos && (
            <button
              onClick={onQuienesSomos}
              className="hidden sm:flex px-3 py-1.5 text-gray-300 rounded-full text-xs font-semibold hover:text-[#e2b040] transition-all cursor-pointer items-center whitespace-nowrap"
            >
              Quiénes Somos
            </button>
          )}

          {/* Mi Cuenta — dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuAbierto(v => !v)}
              className="px-3 py-1.5 bg-[#e2b040] text-[#1a1a2e] rounded-full text-xs font-bold hover:bg-[#f0d080] transition-all whitespace-nowrap flex items-center gap-1.5 shadow-md shadow-[#e2b040]/30 cursor-pointer"
            >
              <i className="ri-user-line text-xs" />
              Mi Cuenta
              <i className={`ri-arrow-down-s-line text-xs transition-transform duration-200 ${menuAbierto ? 'rotate-180' : ''}`} />
            </button>

            {menuAbierto && (
              <>
                {/* Overlay para cerrar al tocar fuera */}
                <div className="fixed inset-0 z-40" onClick={cerrarMenu} />

                <div className="absolute right-0 top-full mt-2 w-52 bg-[#16213e] border border-[#e2b040]/30 rounded-xl shadow-2xl z-50 overflow-hidden">

                  {estaLogueado ? (
                    /* Opciones para usuario logueado */
                    <>
                      {logueadoComoCliente && (
                        <>
                          <button
                            onClick={() => { cerrarMenu(); navigate('/mi-cuenta'); }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-[#e2b040]/10 hover:text-[#e2b040] transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <i className="ri-user-line" />
                            Mi Perfil
                          </button>
                          <div className="border-t border-white/5" />
                          {puntosUsuario !== null && puntosUsuario !== undefined && (
                            <>
                              <button
                                onClick={() => { cerrarMenu(); navigate('/puntos'); }}
                                className="w-full text-left px-4 py-3 text-sm text-[#e2b040] hover:bg-[#e2b040]/10 transition-colors flex items-center gap-2 cursor-pointer"
                              >
                                <i className="ri-medal-line" />
                                {puntosUsuario} Puntos
                              </button>
                              <div className="border-t border-white/5" />
                            </>
                          )}
                        </>
                      )}
                      {logueadoComoPrestador && (
                        <>
                          <button
                            onClick={() => { cerrarMenu(); navigate('/prestadores'); }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-[#e2b040]/10 hover:text-[#e2b040] transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <i className="ri-briefcase-line" />
                            Mi Panel
                          </button>
                          <div className="border-t border-white/5" />
                        </>
                      )}
                      <button
                        onClick={handleCerrarSesion}
                        className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-400/10 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <i className="ri-logout-box-line" />
                        Cerrar Sesión
                      </button>
                    </>
                  ) : (
                    /* Opciones para usuario NO logueado */
                    <>
                      <button
                        onClick={() => { cerrarMenu(); navigate('/mi-cuenta'); }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-[#e2b040]/10 hover:text-[#e2b040] transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <i className="ri-user-line" />
                        Soy Usuario
                      </button>
                      <div className="border-t border-white/5" />
                      <button
                        onClick={() => { cerrarMenu(); navigate('/prestadores'); }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-[#e2b040]/10 hover:text-[#e2b040] transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <i className="ri-briefcase-line" />
                        Soy Prestador
                      </button>
                      {onQuienesSomos && (
                        <>
                          <div className="border-t border-white/5 sm:hidden" />
                          <button
                            onClick={() => { cerrarMenu(); onQuienesSomos(); }}
                            className="sm:hidden w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-[#e2b040]/10 hover:text-[#e2b040] transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <i className="ri-information-line" />
                            Quiénes Somos
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
