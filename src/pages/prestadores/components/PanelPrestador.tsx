import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, type Prestador, type Valoracion } from '../../../lib/supabase';
import { reservasService, comisionesService } from '../../../services/reservasService';
import type { Reserva, Comision } from '../../../types/reservas';
import {
  RESERVA_ESTADO_LABELS,
  COMISION_ESTADO_LABELS,
  COMISION_ESTADO_COLORS,
  formatFechaReserva,
} from '../../../types/reservas';

// ── Tipos disponibilidad ──────────────────────────────────────
type Turno = 'mañana' | 'tarde';
type DisponibilidadMap = Record<number, Turno[]>;

const DIAS_SEMANA = [
  { valor: 1, nombre: 'Lunes' },
  { valor: 2, nombre: 'Martes' },
  { valor: 3, nombre: 'Miércoles' },
  { valor: 4, nombre: 'Jueves' },
  { valor: 5, nombre: 'Viernes' },
  { valor: 6, nombre: 'Sábado' },
  { valor: 0, nombre: 'Domingo' },
];

interface PanelPrestadorProps {
  prestadorData: { dni: string };
  onCerrarSesion: () => void;
}

const esVideoUrl = (url: string) =>
  /\.(mp4|mov|avi|webm|mkv|ogv)(\?.*)?$/i.test(url);

export default function PanelPrestador({ prestadorData, onCerrarSesion }: PanelPrestadorProps) {
  const navigate = useNavigate();

  const [prestador, setPrestador] = useState<Prestador | null>(null);
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Disponibilidad (solo lectura) ─────────────────────────
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadMap>({});

  // ── Reservas ──────────────────────────────────────────────
  const [misReservas, setMisReservas] = useState<Reserva[]>([]);
  const [misComisiones, setMisComisiones] = useState<Comision[]>([]);
  const [cargandoReservas, setCargandoReservas] = useState(false);
  const [modalCancelacion, setModalCancelacion] = useState<string | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [enviandoCancelacion, setEnviandoCancelacion] = useState(false);

  // ── Carga de datos ────────────────────────────────────────
  const cargarDisponibilidad = async (prestadorId: string) => {
    const { data } = await supabase
      .from('disponibilidad_prestadores')
      .select('dia_semana, turno')
      .eq('prestador_id', prestadorId);
    if (data) {
      const mapa: DisponibilidadMap = {};
      data.forEach(({ dia_semana, turno }: { dia_semana: number; turno: Turno }) => {
        if (!mapa[dia_semana]) mapa[dia_semana] = [];
        mapa[dia_semana].push(turno);
      });
      setDisponibilidad(mapa);
    }
  };

  const cargarReservasPrestador = async (prestadorId: string) => {
    setCargandoReservas(true);
    try {
      const [reservasResult, comisionesResult] = await Promise.allSettled([
        reservasService.listarTodas({ prestador_id: prestadorId }),
        comisionesService.listarPorPrestador(prestadorId),
      ]);
      setMisReservas(reservasResult.status === 'fulfilled' ? reservasResult.value : []);
      setMisComisiones(comisionesResult.status === 'fulfilled' ? comisionesResult.value : []);
    } finally {
      setCargandoReservas(false);
    }
  };

  const cargarDatos = async () => {
    try {
      const { data: prestadorInfo, error } = await supabase
        .from('prestadores')
        .select('*')
        .eq('dni', prestadorData.dni)
        .maybeSingle();

      if (error) throw error;

      if (prestadorInfo) {
        setPrestador(prestadorInfo);
        localStorage.setItem('mservicios_prestador_id', prestadorInfo.id);
        cargarDisponibilidad(prestadorInfo.id);
        cargarReservasPrestador(prestadorInfo.id);

        const { data: valoracionesData } = await supabase
          .from('valoraciones')
          .select('*')
          .eq('prestador_id', prestadorInfo.id)
          .order('created_at', { ascending: false });
        setValoraciones(valoracionesData || []);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prestadorData.dni]);

  // ── Cancelación de reserva ────────────────────────────────
  const solicitarCancelacion = async () => {
    if (!modalCancelacion || !motivoCancelacion.trim()) return;
    setEnviandoCancelacion(true);
    try {
      await reservasService.actualizarEstado(modalCancelacion, 'cancelacion_solicitada_por_prestador', {
        motivo_cancelacion: motivoCancelacion.trim(),
      });
      setModalCancelacion(null);
      setMotivoCancelacion('');
      if (prestador) await cargarReservasPrestador(prestador.id);
    } catch (e) {
      console.error(e);
    } finally {
      setEnviandoCancelacion(false);
    }
  };

  // ── Estados de carga ──────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419] flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  if (!prestador) return null;

  const valoracionPromedio =
    valoraciones.length > 0
      ? valoraciones.reduce((acc, v) => acc + v.puntuacion, 0) / valoraciones.length
      : 0;

  const galeria: string[] = prestador.galeria_urls || [];
  const zonasSeleccionadas: string[] = prestador.zona
    ? prestador.zona.split(',').map((z: string) => z.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419]">
      {/* Header */}
      <header className="bg-[#16213e]/80 backdrop-blur-sm border-b border-[#e2b040]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 bg-gradient-to-br from-[#e2b040] to-[#f0d080] rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="ri-tools-line text-lg text-[#1a1a2e]"></i>
            </div>
            <span className="text-lg font-bold text-white hidden sm:block">ServiciosYa</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="p-2 sm:px-3 sm:py-1.5 bg-[#e2b040]/10 text-[#e2b040] rounded-lg hover:bg-[#e2b040]/20 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <i className="ri-home-line"></i>
              <span className="hidden sm:inline text-sm">Inicio</span>
            </button>
            <button
              onClick={() => navigate('/chat')}
              className="p-2 sm:px-3 sm:py-1.5 bg-[#e2b040]/10 text-[#e2b040] rounded-lg hover:bg-[#e2b040]/20 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <i className="ri-chat-3-line"></i>
              <span className="hidden sm:inline text-sm">Mensajes</span>
            </button>
            <button
              onClick={onCerrarSesion}
              className="p-2 sm:px-3 sm:py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <i className="ri-logout-box-line"></i>
              <span className="hidden sm:inline text-sm">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-8 sm:px-6 sm:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Mi Perfil</h1>
            <p className="text-gray-400 text-lg">Visualizá tu información y tus valoraciones</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* ── Información personal (solo lectura) ── */}
            <div className="lg:col-span-2">
              <div className="bg-[#1a1a2e]/80 backdrop-blur-sm border border-[#e2b040]/30 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Información Personal</h2>

                <div className="space-y-6">
                  {/* Foto de perfil */}
                  <div className="flex items-center gap-6">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#e2b040] flex-shrink-0">
                      <img
                        src={prestador.foto_url}
                        alt="Perfil"
                        className="w-full h-full object-cover object-top"
                        onError={e => {
                          (e.target as HTMLImageElement).src =
                            'https://ui-avatars.com/api/?name=' + prestador.nombre;
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Nombre</label>
                      <p className="text-white text-base">{prestador.nombre}</p>
                    </div>
                    <div>
                      <label className="block text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Apellido</label>
                      <p className="text-white text-base">{prestador.apellido}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">DNI</label>
                    <p className="text-white text-base">{prestador.dni}</p>
                  </div>

                  <div>
                    <label className="block text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Email</label>
                    <p className="text-white text-base">{prestador.email || '—'}</p>
                  </div>

                  <div>
                    <label className="block text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Teléfono WhatsApp</label>
                    <p className="text-white text-base">{(prestador as any).telefono || 'No especificado'}</p>
                  </div>

                  <div>
                    <label className="block text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Categoría</label>
                    <span className="inline-block px-4 py-2 bg-[#e2b040]/20 text-[#e2b040] rounded-full text-sm font-semibold capitalize">
                      {prestador.categoria}
                    </span>
                  </div>

                  <div>
                    <label className="block text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Zona de Trabajo</label>
                    {zonasSeleccionadas.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {zonasSeleccionadas.map(zona => (
                          <span
                            key={zona}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#e2b040]/20 text-[#e2b040] rounded-full text-sm font-semibold"
                          >
                            <i className="ri-map-pin-line text-xs"></i>
                            {zona}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic">No especificada</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Descripción del Servicio</label>
                    <p className="text-gray-300 text-base leading-relaxed">{prestador.descripcion || '—'}</p>
                  </div>

                  {/* Galería de trabajos */}
                  <div>
                    <label className="block text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
                      Fotos / Videos del Trabajo
                      {galeria.length > 0 && (
                        <span className="text-gray-600 text-xs ml-2 font-normal normal-case">(clic para abrir)</span>
                      )}
                    </label>
                    {galeria.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {galeria.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative aspect-square rounded-lg overflow-hidden border border-[#e2b040]/20 bg-[#16213e] group"
                          >
                            {esVideoUrl(url) ? (
                              <video src={url} className="w-full h-full object-cover" muted />
                            ) : (
                              <img src={url} alt={`Trabajo ${i + 1}`} className="w-full h-full object-cover" />
                            )}
                            {esVideoUrl(url) && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <i className="ri-play-circle-fill text-white text-3xl opacity-60"></i>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <i className="ri-zoom-in-line text-white text-xl"></i>
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic">Sin fotos ni videos cargados aún</p>
                    )}
                  </div>
                </div>

                {/* Aviso */}
                <p className="mt-6 text-xs text-gray-600 flex items-start gap-1.5">
                  <i className="ri-information-line mt-0.5 shrink-0" />
                  Para modificar tu información, contactá al administrador.
                </p>
              </div>
            </div>

            {/* ── Estadísticas ── */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-[#e2b040] to-[#f0d080] rounded-2xl p-6 shadow-xl">
                <div className="text-center">
                  <i className="ri-star-fill text-[#1a1a2e] text-4xl mb-3"></i>
                  <h3 className="text-3xl font-bold text-[#1a1a2e] mb-1">
                    {valoracionPromedio > 0 ? valoracionPromedio.toFixed(1) : 'N/A'}
                  </h3>
                  <p className="text-[#1a1a2e] font-semibold">Valoración Promedio</p>
                </div>
              </div>

              <div className="bg-[#1a1a2e]/80 backdrop-blur-sm border border-[#e2b040]/30 rounded-2xl p-6">
                <div className="text-center">
                  <i className="ri-message-3-line text-[#e2b040] text-4xl mb-3"></i>
                  <h3 className="text-3xl font-bold text-white mb-1">{valoraciones.length}</h3>
                  <p className="text-gray-400 font-semibold">Valoraciones Totales</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Disponibilidad (solo lectura) ── */}
          <div className="mt-8">
            <div className="bg-[#1a1a2e]/80 backdrop-blur-sm border border-[#e2b040]/30 rounded-2xl p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Mi Disponibilidad</h2>
                <p className="text-gray-400 text-sm mt-1">Días y turnos en que podés trabajar</p>
              </div>

              <div className="grid gap-2">
                {DIAS_SEMANA.map(({ valor, nombre }) => {
                  const turnos = disponibilidad[valor] || [];
                  return (
                    <div key={valor} className="flex items-center bg-[#16213e] rounded-xl px-4 py-3 gap-3">
                      <span className="text-white font-medium text-sm flex-shrink-0 w-20">{nombre}</span>
                      <div className="flex gap-2 flex-1">
                        {(['mañana', 'tarde'] as Turno[]).map(turno => {
                          const activo = turnos.includes(turno);
                          return (
                            <div
                              key={turno}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold ${
                                activo
                                  ? 'bg-[#e2b040] text-[#1a1a2e]'
                                  : 'bg-[#1a1a2e] border border-white/10 text-gray-600'
                              }`}
                            >
                              <i className={turno === 'mañana' ? 'ri-sun-line' : 'ri-moon-line'} />
                              {turno === 'mañana' ? 'Mañana' : 'Tarde'}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-gray-600 text-xs mt-4 flex items-center gap-1">
                <i className="ri-information-line" />
                Para modificar tu disponibilidad, contactá al administrador.
              </p>
            </div>
          </div>

          {/* ── Valoraciones ── */}
          <div className="mt-8">
            <div className="bg-[#1a1a2e]/80 backdrop-blur-sm border border-[#e2b040]/30 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Mis Valoraciones</h2>
              {valoraciones.length > 0 ? (
                <div className="space-y-4">
                  {valoraciones.map(v => (
                    <div key={v.id} className="bg-[#16213e] border border-[#e2b040]/20 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-white font-semibold text-base">{v.nombre_cliente}</h4>
                          <p className="text-gray-500 text-sm">
                            {new Date(v.created_at).toLocaleDateString('es-AR')}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <i
                              key={star}
                              className={star <= v.puntuacion ? 'ri-star-fill text-[#e2b040]' : 'ri-star-line text-gray-600'}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{v.comentario}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <i className="ri-message-3-line text-6xl text-gray-600 mb-4 block"></i>
                  <p className="text-gray-400 text-lg">Aún no tienes valoraciones</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Mis Reservas ── */}
          <div className="mt-8">
            <div className="bg-[#1a1a2e]/80 backdrop-blur-sm border border-[#e2b040]/30 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-white">Mis Reservas</h2>
                  <p className="text-gray-400 text-sm mt-1">Reservas activas y comisiones pendientes</p>
                </div>
                {prestador && (
                  <button
                    onClick={() => cargarReservasPrestador(prestador.id)}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-sm transition-colors cursor-pointer"
                  >
                    <i className={`ri-refresh-line ${cargandoReservas ? 'animate-spin' : ''}`} />
                    Actualizar
                  </button>
                )}
              </div>

              {cargandoReservas ? (
                <div className="flex justify-center py-8">
                  <i className="ri-loader-4-line animate-spin text-3xl text-[#e2b040]" />
                </div>
              ) : (
                <>
                  {/* Comisiones pendientes */}
                  {misComisiones.filter(c => c.estado !== 'comision_pagada').length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                        <i className="ri-coins-line" />
                        Comisiones pendientes de pago
                      </h3>
                      <div className="space-y-3">
                        {misComisiones.filter(c => c.estado !== 'comision_pagada').map(c => (
                          <div key={c.id} className="bg-[#16213e] border border-orange-500/30 rounded-xl p-4">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <div>
                                <p className="text-white font-semibold text-sm">Comisión por trabajo concretado</p>
                                {c.reservas && (
                                  <p className="text-gray-400 text-xs mt-0.5">
                                    {formatFechaReserva(c.reservas.dia)} · {c.reservas.turno === 'mañana' ? 'Mañana' : 'Tarde'}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-orange-300 font-bold text-base">$3.000</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${COMISION_ESTADO_COLORS[c.estado]}`}>
                                  {COMISION_ESTADO_LABELS[c.estado]}
                                </span>
                              </div>
                            </div>
                            {c.mp_init_point && (
                              <div className="mt-3 pt-3 border-t border-white/5">
                                <a
                                  href={c.mp_init_point}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#e2b040] text-[#1a1a2e] rounded-xl text-sm font-bold hover:bg-[#f0d080] transition-colors"
                                >
                                  <i className="ri-bank-card-line" />
                                  Pagar $3.000 ahora
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reservas activas */}
                  {misReservas.filter(r => r.estado === 'reserva_activa').length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-blue-300 mb-3 flex items-center gap-2">
                        <i className="ri-calendar-line" />
                        Reservas activas
                      </h3>
                      <div className="space-y-3">
                        {misReservas.filter(r => r.estado === 'reserva_activa').map(r => (
                          <div key={r.id} className="bg-[#16213e] border border-[#e2b040]/15 rounded-xl p-4">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <div>
                                <p className="text-white font-semibold text-sm">{r.nombre} {r.apellido}</p>
                                <p className="text-gray-400 text-xs mt-0.5">
                                  <i className="ri-phone-line mr-1" />{r.telefono}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[#e2b040] text-sm font-semibold">{formatFechaReserva(r.dia)}</p>
                                <p className="text-gray-400 text-xs">{r.turno === 'mañana' ? '🌅 Mañana' : '🌆 Tarde'}</p>
                              </div>
                            </div>
                            {(r.zona || r.descripcion_trabajo) && (
                              <div className="mt-2 text-xs text-gray-400 space-y-0.5">
                                {r.zona && <p><i className="ri-map-pin-line mr-1 text-[#e2b040]" />{r.zona}</p>}
                                {r.descripcion_trabajo && <p><i className="ri-tools-line mr-1 text-[#e2b040]" />{r.descripcion_trabajo}</p>}
                              </div>
                            )}
                            <div className="mt-3 pt-3 border-t border-white/5">
                              <button
                                onClick={() => { setModalCancelacion(r.id); setMotivoCancelacion(''); }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition-colors cursor-pointer"
                              >
                                <i className="ri-close-circle-line" />
                                Solicitar cancelación
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Historial */}
                  {misReservas.filter(r => r.estado === 'trabajo_concretado').length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-green-300 mb-3 flex items-center gap-2">
                        <i className="ri-checkbox-circle-line" />
                        Trabajos concretados
                      </h3>
                      <div className="space-y-2">
                        {misReservas.filter(r => r.estado === 'trabajo_concretado').slice(0, 5).map(r => (
                          <div key={r.id} className="bg-[#16213e] border border-green-500/15 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-white text-sm font-medium">{r.nombre} {r.apellido}</p>
                              <p className="text-gray-500 text-xs">{formatFechaReserva(r.dia)}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-300">
                              {RESERVA_ESTADO_LABELS[r.estado]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {misReservas.length === 0 && misComisiones.length === 0 && (
                    <div className="text-center py-10">
                      <i className="ri-calendar-line text-5xl text-gray-700 mb-3 block" />
                      <p className="text-gray-500">Todavía no tenés reservas</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Modal solicitud de cancelación ── */}
      {modalCancelacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setModalCancelacion(null)}
          />
          <div className="relative bg-[#16213e] border border-[#e2b040]/20 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">Solicitar cancelación</h3>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">
              El administrador notificará al cliente. Si el cliente confirma, no se cobra comisión.
              Si rechaza, la reserva quedará como incidente para revisión.
            </p>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Motivo *</label>
            <textarea
              value={motivoCancelacion}
              onChange={e => setMotivoCancelacion(e.target.value)}
              rows={3}
              placeholder="Explicá brevemente por qué necesitás cancelar..."
              className="w-full px-3 py-2.5 bg-[#1a1a2e] border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#e2b040]/50 text-sm resize-none transition-colors"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={solicitarCancelacion}
                disabled={!motivoCancelacion.trim() || enviandoCancelacion}
                className="flex-1 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {enviandoCancelacion ? 'Enviando...' : 'Solicitar cancelación'}
              </button>
              <button
                onClick={() => setModalCancelacion(null)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl text-sm transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
