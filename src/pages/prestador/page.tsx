// ─────────────────────────────────────────────────────────────
// Página pública del perfil de un prestador
// URL: /prestador/:id
// Shareable, sin login requerido
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import AppHeader from '../../components/AppHeader';

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

  const [prestador, setPrestador] = useState<Prestador | null>(null);
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [galeriaIdx, setGaleriaIdx] = useState(0);

  useEffect(() => {
    if (!id) return;
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function cargar() {
    setLoading(true);
    try {
      const [{ data: p }, { data: v }] = await Promise.all([
        supabase
          .from('prestadores')
          .select('id, nombre, apellido, categoria, zona, foto_url, galeria_urls, descripcion, telefono')
          .eq('id', id)
          .maybeSingle(),
        supabase
          .from('valoraciones')
          .select('id, nombre_cliente, puntuacion, comentario, created_at')
          .eq('prestador_id', id)
          .order('created_at', { ascending: false }),
      ]);
      setPrestador(p ?? null);
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

  function abrirWhatsApp() {
    if (!prestador?.telefono) return;
    const num = prestador.telefono.replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Hola! Te contacto desde *ServiciosYa*. Vi tu perfil de *${prestador.categoria}* y me interesa tu servicio. ¿Podemos coordinar?`
    );
    window.open(`https://wa.me/549${num}?text=${msg}`, '_blank');
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
              </div>
            </div>

            {/* Descripción */}
            {prestador.descripcion && (
              <p className="text-gray-300 text-sm leading-relaxed">{prestador.descripcion}</p>
            )}

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              {prestador.telefono && (
                <button
                  onClick={abrirWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer"
                >
                  <i className="ri-whatsapp-line text-lg" />
                  Contactar por WhatsApp
                </button>
              )}
              <button
                onClick={() => navigate(`/reservar/${prestador.id}`)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#e2b040] hover:bg-[#f0d080] text-[#1a1a2e] rounded-xl font-bold text-sm transition-colors cursor-pointer"
              >
                <i className="ri-calendar-check-line" />
                Hacer una reserva
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
    </div>
  );
}
