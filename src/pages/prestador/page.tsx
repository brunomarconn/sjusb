// ─────────────────────────────────────────────────────────────
// Página pública del perfil de un prestador
// URL: /prestador/:id
// Shareable, sin login requerido
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import AppHeader from '../../components/AppHeader';
import { leadsApi } from '../../api/leadsApi';
import { useClienteSession } from '../../context/ClienteSessionContext';

interface Prestador {
  id: string;
  nombre: string;
  apellido: string;
  categoria: string;
  zona?: string;
  foto_url: string;
  galeria_urls?: string[] | null;
  descripcion: string;
  telefono?: string;
  verification_status?: string;
  is_featured?: boolean;
  is_top?: boolean;
  ranking_score?: number;
  created_at?: string;
}

function renderBadges(p: Prestador, reviewCount: number) {
  const esNuevo = !p.ranking_score && reviewCount === 0;
  const badgeBase = 'inline-flex items-center gap-1 px-2.5 py-1 bg-[#16213e]/85 backdrop-blur-sm rounded-full text-xs font-semibold border';
  return (
    <>
      {p.verification_status === 'verified' && (
        <span className={`${badgeBase} text-green-400 border-green-400/30`}>
          <i className="ri-shield-check-fill text-xs" />Verificado
        </span>
      )}
      {p.is_top && (
        <span className={`${badgeBase} text-[#e2b040] border-[#e2b040]/40`}>
          <i className="ri-trophy-fill text-xs" />TOP
        </span>
      )}
      {p.is_featured && !p.is_top && (
        <span className={`${badgeBase} text-[#f0d080] border-[#f0d080]/40`}>
          <i className="ri-star-smile-fill text-xs" />Destacado
        </span>
      )}
      {esNuevo && (
        <span className={`${badgeBase} text-blue-300 border-blue-400/30`}>
          <i className="ri-sparkling-2-fill text-xs" />Nuevo
        </span>
      )}
    </>
  );
}

interface Valoracion {
  id: string;
  nombre_cliente: string;
  puntuacion: number;
  comentario: string;
  created_at: string;
}

function esVideo(url: string) {
  return /\.(mp4|webm|mov|ogg)($|\?)/i.test(url) || url.includes('/video/');
}

export default function PrestadorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const clienteSession = useClienteSession();

  const [prestador, setPrestador] = useState<Prestador | null>(null);
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [galeriaIdx, setGaleriaIdx] = useState(0);

  const [mostrarContacto, setMostrarContacto] = useState(false);
  const [contactoNombre, setContactoNombre] = useState('');
  const [contactoTelefono, setContactoTelefono] = useState('');
  const [contactoDescripcion, setContactoDescripcion] = useState('');
  const [errorTelefono, setErrorTelefono] = useState('');
  const [enviandoContacto, setEnviandoContacto] = useState(false);

  useEffect(() => {
    if (!id) return;
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function cargar() {
    setLoading(true);
    try {
      let prestadorResult = await supabase
        .from('prestadores')
        .select('id, nombre, apellido, categoria, zona, foto_url, galeria_urls, descripcion, telefono, verification_status, is_featured, is_top, ranking_score, created_at')
        .eq('id', id)
        .maybeSingle();

      // Fallback: select mínimo si la migración del modelo de leads aún no corrió.
      if (prestadorResult.error) {
        prestadorResult = await supabase
          .from('prestadores')
          .select('id, nombre, apellido, categoria, zona, foto_url, galeria_urls, descripcion, telefono')
          .eq('id', id)
          .maybeSingle();
      }

      const { data: v } = await supabase
        .from('valoraciones')
        .select('id, nombre_cliente, puntuacion, comentario, created_at')
        .eq('prestador_id', id)
        .order('created_at', { ascending: false });

      setPrestador(prestadorResult.data ?? null);
      setValoraciones(v ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function copiarLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  async function handleConfirmarContacto(e: React.FormEvent) {
    e.preventDefault();
    if (!prestador || !contactoNombre.trim() || !contactoTelefono.trim()) return;

    const soloDigitos = contactoTelefono.replace(/\D/g, '');
    if (soloDigitos.length < 10) {
      setErrorTelefono('El teléfono debe tener al menos 10 dígitos');
      return;
    }

    setEnviandoContacto(true);
    try {
      // Síncrono, antes de cualquier await: evita el bloqueo de pop-ups del navegador.
      const mensaje = `Hola ${prestador.nombre}, te contacto desde MrServicios por ${prestador.categoria}. Soy vecino/a de San Isidro.${contactoDescripcion.trim() ? `\n\n${contactoDescripcion.trim()}` : ''}`;
      const numeroPrestador = prestador.telefono?.replace(/\D/g, '');
      if (numeroPrestador) {
        window.open(`https://wa.me/549${numeroPrestador}?text=${encodeURIComponent(mensaje)}`, '_blank');
      }

      await leadsApi.crearLead({
        prestador_id: prestador.id,
        vecino_nombre: contactoNombre.trim(),
        vecino_telefono: soloDigitos,
        categoria: prestador.categoria,
        servicio_descripcion: contactoDescripcion.trim() || undefined,
        source: 'public_site',
      });

      clienteSession.marcarReservado(prestador.id);
      setMostrarContacto(false);
    } catch (err) {
      console.error('Error al crear el contacto:', err);
    } finally {
      setEnviandoContacto(false);
    }
  }

  const promedio =
    valoraciones.length > 0
      ? (valoraciones.reduce((s, v) => s + v.puntuacion, 0) / valoraciones.length).toFixed(1)
      : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <i className="ri-loader-4-line animate-spin text-4xl text-[#e2b040]" />
      </div>
    );
  }

  if (!prestador) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center p-6 text-center">
        <i className="ri-user-unfollow-line text-5xl text-gray-600 mb-4" />
        <p className="text-gray-400 text-lg mb-6">Prestador no encontrado</p>
        <button
          onClick={() => navigate('/usuarios')}
          className="px-6 py-2.5 bg-[#e2b040] text-[#1a1a2e] rounded-xl font-bold"
        >
          Ver prestadores
        </button>
      </div>
    );
  }

  const galeria = prestador.galeria_urls ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e]">
      <AppHeader />

      <div className="max-w-xl mx-auto px-4 pt-24 pb-16 space-y-5">

        {/* Botón volver */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-[#e2b040] transition-colors text-sm cursor-pointer"
        >
          <i className="ri-arrow-left-line" /> Volver
        </button>

        {/* Tarjeta principal */}
        <div className="bg-[#16213e] border border-[#e2b040]/20 rounded-2xl overflow-hidden">

          {/* Galería */}
          {galeria.length > 0 ? (
            <div className="relative h-64 bg-[#1a1a2e]">
              {esVideo(galeria[galeriaIdx]) ? (
                <video
                  src={galeria[galeriaIdx]}
                  className="w-full h-full object-cover"
                  autoPlay muted loop playsInline
                />
              ) : (
                <img
                  src={galeria[galeriaIdx]}
                  alt="Trabajo"
                  className="w-full h-full object-cover"
                />
              )}
              {galeria.length > 1 && (
                <>
                  <button
                    onClick={() => setGaleriaIdx(i => (i - 1 + galeria.length) % galeria.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white cursor-pointer"
                  >
                    <i className="ri-arrow-left-s-line" />
                  </button>
                  <button
                    onClick={() => setGaleriaIdx(i => (i + 1) % galeria.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white cursor-pointer"
                  >
                    <i className="ri-arrow-right-s-line" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {galeria.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setGaleriaIdx(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${i === galeriaIdx ? 'bg-[#e2b040] w-3' : 'bg-white/40'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="h-40 bg-[#1a1a2e] flex items-center justify-center">
              <img
                src={prestador.foto_url}
                alt={prestador.nombre}
                className="w-24 h-24 rounded-full object-cover object-top border-4 border-[#e2b040]/40"
                onError={e => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + prestador.nombre; }}
              />
            </div>
          )}

          <div className="p-5 space-y-4">
            {/* Info básica */}
            <div className="flex items-start gap-4">
              {galeria.length > 0 && (
                <img
                  src={prestador.foto_url}
                  alt={prestador.nombre}
                  className="w-14 h-14 rounded-full object-cover object-top border-2 border-[#e2b040]/40 flex-shrink-0"
                  onError={e => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + prestador.nombre; }}
                />
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-white font-bold text-xl leading-tight">
                  {prestador.nombre} {prestador.apellido}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="px-2.5 py-0.5 bg-[#e2b040]/20 text-[#e2b040] rounded-full text-xs font-semibold capitalize">
                    {prestador.categoria}
                  </span>
                  {prestador.zona && (
                    <span className="flex items-center gap-1 text-gray-400 text-xs">
                      <i className="ri-map-pin-line" />{prestador.zona}
                    </span>
                  )}
                  {promedio && (
                    <span className="flex items-center gap-1 text-[#e2b040] text-xs font-semibold">
                      <i className="ri-star-fill" />{promedio}
                      <span className="text-gray-500 font-normal">({valoraciones.length})</span>
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {renderBadges(prestador, valoraciones.length)}
                </div>
              </div>
            </div>

            {/* Descripción */}
            {prestador.descripcion && (
              <p className="text-gray-300 text-sm leading-relaxed">{prestador.descripcion}</p>
            )}

            {/* Botón de acción principal */}
            <div className="pt-1">
              <button
                onClick={() => setMostrarContacto(true)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer"
              >
                <i className="ri-whatsapp-line text-lg" />
                Contactar por WhatsApp
              </button>
            </div>

            {/* Copiar link */}
            <button
              onClick={copiarLink}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-sm transition-colors cursor-pointer"
            >
              <i className={copiado ? 'ri-check-line text-green-400' : 'ri-link-m'} />
              {copiado ? 'Link copiado!' : 'Copiar link de este perfil'}
            </button>
          </div>
        </div>

        {/* Valoraciones */}
        {valoraciones.length > 0 && (
          <div className="bg-[#16213e] border border-[#e2b040]/15 rounded-2xl p-5">
            <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <i className="ri-star-line text-[#e2b040]" />
              Valoraciones ({valoraciones.length})
            </h2>
            <div className="space-y-3">
              {valoraciones.map(v => (
                <div key={v.id} className="border-t border-white/5 pt-3 first:border-0 first:pt-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm font-medium">{v.nombre_cliente}</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <i key={s} className={s <= v.puntuacion ? 'ri-star-fill text-[#e2b040] text-xs' : 'ri-star-line text-gray-600 text-xs'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">{v.comentario}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── Modal de contacto (previo a abrir WhatsApp) ── */}
      {mostrarContacto && prestador && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50"
          onClick={() => !enviandoContacto && setMostrarContacto(false)}
        >
          <form
            onSubmit={handleConfirmarContacto}
            className="bg-[#16213e] rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 max-w-md w-full border border-[#e2b040]/20 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-white">Contactar a {prestador.nombre}</h3>
              <button type="button" onClick={() => setMostrarContacto(false)} className="p-2 text-gray-400 hover:text-white cursor-pointer">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-5">
              Te conectamos por WhatsApp con {prestador.nombre}. Estos datos quedan registrados para que el prestador pueda gestionar tu pedido.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tu nombre</label>
                <input
                  type="text"
                  value={contactoNombre}
                  onChange={(e) => setContactoNombre(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors"
                  placeholder="Ej: María González"
                  style={{ fontSize: '16px' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tu teléfono</label>
                <input
                  type="tel"
                  value={contactoTelefono}
                  onChange={(e) => { setContactoTelefono(e.target.value); setErrorTelefono(''); }}
                  required
                  className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors"
                  placeholder="Ej: 3511234567"
                  style={{ fontSize: '16px' }}
                />
                {errorTelefono && <p className="text-red-400 text-xs mt-1">{errorTelefono}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">¿Qué necesitás? (opcional)</label>
                <textarea
                  value={contactoDescripcion}
                  onChange={(e) => { if (e.target.value.length <= 300) setContactoDescripcion(e.target.value); }}
                  maxLength={300}
                  rows={3}
                  className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors resize-none"
                  placeholder="Contale brevemente qué necesitás..."
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={enviandoContacto || !contactoNombre.trim() || !contactoTelefono.trim()}
              className="w-full mt-5 flex items-center justify-center gap-2 py-4 bg-[#25D366] hover:bg-[#1da851] text-white rounded-xl font-bold text-base transition-colors cursor-pointer shadow-md shadow-[#25D366]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="ri-whatsapp-line text-xl" />
              {enviandoContacto ? 'Abriendo WhatsApp...' : 'Continuar a WhatsApp'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
