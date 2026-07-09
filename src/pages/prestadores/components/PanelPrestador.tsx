import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { panelPrestadorApi, type PanelPrestadorData } from '../../../api/panelPrestadorApi';
import { leadsApi } from '../../../api/leadsApi';
import { usePrestadorSession } from '../../../context/PrestadorSessionContext';
import TrabajoEstadoButtons from '../../trabajo/components/TrabajoEstadoButtons';
import type { Trabajo, TrabajoEstado } from '../../../types/trabajo';
import { TRABAJO_ESTADO_LABELS, TRABAJO_ESTADO_COLORS, formatFechaTrabajo } from '../../../types/trabajo';
import { MEMBRESIA_ESTADO_LABELS, MEMBRESIA_ESTADO_COLORS } from '../../../types/membresia';
import { VERIFICATION_LABELS, PLAN_PHASE_LABELS, MEMBERSHIP_STATUS_LABELS } from '../../../types/prestador';

interface Valoracion {
  id: string;
  nombre_cliente: string;
  puntuacion: number;
  comentario: string;
  created_at: string;
}

interface PanelPrestadorProps {
  /** Link tokenizado /p/:providerToken, sin login. Si no se pasa, usa la sesión JWT (login por DNI). */
  providerToken?: string;
  onCerrarSesion: () => void;
}

const esVideoUrl = (url: string) =>
  /\.(mp4|mov|avi|webm|mkv|ogv)(\?.*)?$/i.test(url);

export default function PanelPrestador({ providerToken, onCerrarSesion }: PanelPrestadorProps) {
  const navigate = useNavigate();
  const prestadorSession = usePrestadorSession();

  const [panel, setPanel] = useState<PanelPrestadorData | null>(null);
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actualizandoTrabajoId, setActualizandoTrabajoId] = useState<string | null>(null);

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerToken, prestadorSession.token]);

  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await panelPrestadorApi.obtenerPanel(
        providerToken ? { providerToken } : { token: prestadorSession.token ?? undefined }
      );
      setPanel(data);
      if (!providerToken) prestadorSession.setPrestadorId(data.prestador.id);

      const { data: valoracionesData } = await supabase
        .from('valoraciones')
        .select('id, nombre_cliente, puntuacion, comentario, created_at')
        .eq('prestador_id', data.prestador.id)
        .order('created_at', { ascending: false });
      setValoraciones(valoracionesData || []);
    } catch (e) {
      console.error('Error al cargar el panel:', e);
      setError('No pudimos cargar tu panel. Verificá el link o volvé a iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstadoTrabajo = async (trabajo: Trabajo, estado: TrabajoEstado) => {
    if (!trabajo.job_token) return;
    setActualizandoTrabajoId(trabajo.id);
    try {
      const actualizado = await leadsApi.actualizarEstadoTrabajo(trabajo.job_token, estado);
      setPanel((prev) => prev ? {
        ...prev,
        trabajos: prev.trabajos.map((t) => (t.id === actualizado.id ? actualizado : t)),
      } : prev);
    } catch (e) {
      console.error('Error al actualizar estado:', e);
    } finally {
      setActualizandoTrabajoId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419] flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  if (error || !panel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419] flex flex-col items-center justify-center p-6 text-center">
        <i className="ri-error-warning-line text-5xl text-gray-600 mb-4" />
        <p className="text-gray-400 text-lg">{error || 'No pudimos cargar tu panel.'}</p>
      </div>
    );
  }

  const { prestador, trabajos, membresias } = panel;
  const galeria: string[] = prestador.galeria_urls || [];
  const zonasSeleccionadas: string[] = prestador.zona
    ? prestador.zona.split(',').map((z: string) => z.trim()).filter(Boolean)
    : [];

  const tasaRespuesta = prestador.total_leads > 0
    ? Math.round((prestador.total_contacted / prestador.total_leads) * 100)
    : 0;
  const tasaFinalizacion = prestador.total_leads > 0
    ? Math.round((prestador.total_completed / prestador.total_leads) * 100)
    : 0;

  const trabajosActivos = trabajos.filter((t) => t.estado !== 'terminado' && t.estado !== 'no_avanzo');
  const trabajosHistorial = trabajos.filter((t) => t.estado === 'terminado' || t.estado === 'no_avanzo');

  const membresiaVigente = membresias.find((m) => m.estado === 'pending' || m.estado === 'overdue');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419]">
      {/* Header */}
      <header className="bg-[#16213e]/80 backdrop-blur-sm border-b border-[#e2b040]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 bg-gradient-to-br from-[#e2b040] to-[#f0d080] rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="ri-tools-line text-lg text-[#1a1a2e]"></i>
            </div>
            <span className="text-lg font-bold text-white hidden sm:block">MrServicios</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="p-2 sm:px-3 sm:py-1.5 bg-[#e2b040]/10 text-[#e2b040] rounded-lg hover:bg-[#e2b040]/20 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <i className="ri-home-line"></i>
              <span className="hidden sm:inline text-sm">Inicio</span>
            </button>
            {!providerToken && (
              <button
                onClick={() => navigate('/chat')}
                className="p-2 sm:px-3 sm:py-1.5 bg-[#e2b040]/10 text-[#e2b040] rounded-lg hover:bg-[#e2b040]/20 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <i className="ri-chat-3-line"></i>
                <span className="hidden sm:inline text-sm">Mensajes</span>
              </button>
            )}
            <button
              onClick={onCerrarSesion}
              className="p-2 sm:px-3 sm:py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <i className="ri-logout-box-line"></i>
              <span className="hidden sm:inline text-sm">{providerToken ? 'Salir' : 'Cerrar Sesión'}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-8 sm:px-6 sm:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Mi Panel</h1>
            <p className="text-gray-400 text-lg">Trabajos, métricas y estado de tu cuenta</p>
          </div>

          {/* ── Badges + ranking ── */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            {prestador.verification_status === 'verified' && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500/15 text-green-400 border border-green-400/30 rounded-full text-xs font-semibold">
                <i className="ri-shield-check-fill" />Verificado
              </span>
            )}
            {prestador.is_top && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#e2b040]/15 text-[#e2b040] border border-[#e2b040]/40 rounded-full text-xs font-semibold">
                <i className="ri-trophy-fill" />TOP
              </span>
            )}
            {prestador.is_featured && !prestador.is_top && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#f0d080]/15 text-[#f0d080] border border-[#f0d080]/40 rounded-full text-xs font-semibold">
                <i className="ri-star-smile-fill" />Destacado
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/5 text-gray-400 border border-white/10 rounded-full text-xs">
              <i className="ri-bar-chart-2-line" />Verificación: {VERIFICATION_LABELS[prestador.verification_status]}
            </span>
          </div>

          {/* ── Métricas ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#1a1a2e]/80 border border-[#e2b040]/20 rounded-2xl p-5 text-center">
              <p className="text-3xl font-bold text-white">{prestador.total_leads}</p>
              <p className="text-gray-500 text-xs mt-1">Contactos totales</p>
            </div>
            <div className="bg-[#1a1a2e]/80 border border-[#e2b040]/20 rounded-2xl p-5 text-center">
              <p className="text-3xl font-bold text-white">{prestador.total_completed}</p>
              <p className="text-gray-500 text-xs mt-1">Trabajos terminados</p>
            </div>
            <div className="bg-[#1a1a2e]/80 border border-[#e2b040]/20 rounded-2xl p-5 text-center">
              <p className="text-3xl font-bold text-[#e2b040]">{tasaRespuesta}%</p>
              <p className="text-gray-500 text-xs mt-1">Tasa de respuesta</p>
            </div>
            <div className="bg-[#1a1a2e]/80 border border-[#e2b040]/20 rounded-2xl p-5 text-center">
              <p className="text-3xl font-bold text-[#e2b040]">{tasaFinalizacion}%</p>
              <p className="text-gray-500 text-xs mt-1">Tasa de finalización</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* ── Información personal (solo lectura) ── */}
            <div className="lg:col-span-2">
              <div className="bg-[#1a1a2e]/80 backdrop-blur-sm border border-[#e2b040]/30 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Información Personal</h2>

                <div className="space-y-6">
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
                    <label className="block text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Teléfono WhatsApp</label>
                    <p className="text-white text-base">{prestador.telefono || 'No especificado'}</p>
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

                <p className="mt-6 text-xs text-gray-600 flex items-start gap-1.5">
                  <i className="ri-information-line mt-0.5 shrink-0" />
                  Para modificar tu información, contactá al administrador.
                </p>
              </div>
            </div>

            {/* ── Rating + Membresía ── */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-[#e2b040] to-[#f0d080] rounded-2xl p-6 shadow-xl">
                <div className="text-center">
                  <i className="ri-star-fill text-[#1a1a2e] text-4xl mb-3"></i>
                  <h3 className="text-3xl font-bold text-[#1a1a2e] mb-1">
                    {prestador.average_rating > 0 ? prestador.average_rating.toFixed(1) : 'N/A'}
                  </h3>
                  <p className="text-[#1a1a2e] font-semibold">Valoración Promedio</p>
                  <p className="text-[#1a1a2e]/70 text-sm mt-1">{prestador.review_count} reseñas</p>
                </div>
              </div>

              <div className="bg-[#1a1a2e]/80 backdrop-blur-sm border border-[#e2b040]/30 rounded-2xl p-6">
                <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                  <i className="ri-vip-crown-line text-[#e2b040]" />
                  Mi plan
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-400">
                    Fase: <span className="text-white font-medium">{PLAN_PHASE_LABELS[prestador.plan_phase]}</span>
                  </p>
                  <p className="text-gray-400">
                    Membresía: <span className="text-white font-medium">{MEMBERSHIP_STATUS_LABELS[prestador.membership_status]}</span>
                  </p>
                  {prestador.monthly_price && (
                    <p className="text-gray-400">
                      Cuota: <span className="text-white font-medium">${prestador.monthly_price.toLocaleString('es-AR')}</span>
                    </p>
                  )}
                </div>
                {membresiaVigente?.payment_link && (
                  <a
                    href={membresiaVigente.payment_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-[#e2b040] text-[#1a1a2e] rounded-xl text-sm font-bold hover:bg-[#f0d080] transition-colors w-full justify-center"
                  >
                    <i className="ri-bank-card-line" />
                    Pagar membresía
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* ── Trabajos activos ── */}
          <div className="mt-8">
            <div className="bg-[#1a1a2e]/80 backdrop-blur-sm border border-[#e2b040]/30 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-white">Trabajos en curso</h2>
                  <p className="text-gray-400 text-sm mt-1">Actualizar el estado te ayuda a aparecer más arriba</p>
                </div>
                <button
                  onClick={cargarDatos}
                  className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-sm transition-colors cursor-pointer"
                >
                  <i className="ri-refresh-line" />
                  Actualizar
                </button>
              </div>

              {trabajosActivos.length > 0 ? (
                <div className="space-y-4">
                  {trabajosActivos.map((trabajo) => (
                    <div key={trabajo.id} className="bg-[#16213e] border border-[#e2b040]/15 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                        <div>
                          <p className="text-white font-semibold text-sm">{trabajo.vecino_nombre}</p>
                          <p className="text-gray-400 text-xs mt-0.5">
                            <i className="ri-phone-line mr-1" />{trabajo.vecino_telefono} · {formatFechaTrabajo(trabajo.created_at)}
                          </p>
                          {trabajo.servicio_descripcion && (
                            <p className="text-gray-500 text-xs mt-1">{trabajo.servicio_descripcion}</p>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TRABAJO_ESTADO_COLORS[trabajo.estado]}`}>
                          {TRABAJO_ESTADO_LABELS[trabajo.estado]}
                        </span>
                      </div>
                      <TrabajoEstadoButtons
                        estadoActual={trabajo.estado}
                        onCambiarEstado={(estado) => handleCambiarEstadoTrabajo(trabajo, estado)}
                        actualizando={actualizandoTrabajoId === trabajo.id}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <i className="ri-briefcase-line text-5xl text-gray-700 mb-3 block" />
                  <p className="text-gray-500">No tenés trabajos en curso</p>
                </div>
              )}

              {trabajosHistorial.length > 0 && (
                <div className="mt-8 pt-6 border-t border-white/5">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">Historial reciente</h3>
                  <div className="space-y-2">
                    {trabajosHistorial.slice(0, 5).map((trabajo) => (
                      <div key={trabajo.id} className="bg-[#16213e] border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-white text-sm font-medium">{trabajo.vecino_nombre}</p>
                          <p className="text-gray-500 text-xs">{formatFechaTrabajo(trabajo.created_at)}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${TRABAJO_ESTADO_COLORS[trabajo.estado]}`}>
                          {TRABAJO_ESTADO_LABELS[trabajo.estado]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Membresías ── */}
          {membresias.length > 0 && (
            <div className="mt-8">
              <div className="bg-[#1a1a2e]/80 backdrop-blur-sm border border-[#e2b040]/30 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Mis pagos</h2>
                <div className="space-y-3">
                  {membresias.map((m) => (
                    <div key={m.id} className="bg-[#16213e] border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-white text-sm font-medium">{m.plan_name}</p>
                        <p className="text-gray-500 text-xs">{m.period_start} — {m.period_end}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#e2b040] font-bold text-sm">${m.amount.toLocaleString('es-AR')}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${MEMBRESIA_ESTADO_COLORS[m.estado]}`}>
                          {MEMBRESIA_ESTADO_LABELS[m.estado]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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
        </div>
      </div>
    </div>
  );
}
