// ─────────────────────────────────────────────────────────────
// Página del trabajo individual del prestador
// URL: /trabajo/:token — sin login, el token largo es la autenticación.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppHeader from '../../components/AppHeader';
import TrabajoEstadoButtons from './components/TrabajoEstadoButtons';
import { leadsApi } from '../../api/leadsApi';
import type { Trabajo, TrabajoEstado } from '../../types/trabajo';
import { TRABAJO_ESTADO_LABELS, formatFechaTrabajo } from '../../types/trabajo';
import { buildWaUrl, mensajePedidoResena } from '../../utils/whatsappTemplates';

export default function TrabajoPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actualizando, setActualizando] = useState(false);
  const [copiadoLink, setCopiadoLink] = useState(false);

  useEffect(() => {
    if (!token) return;
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function cargar() {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await leadsApi.obtenerTrabajoPorToken(token);
      setTrabajo(data);
    } catch (e) {
      console.error(e);
      setError('No encontramos este trabajo. Verificá el link.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCambiarEstado(estado: TrabajoEstado) {
    if (!token) return;
    setActualizando(true);
    try {
      const actualizado = await leadsApi.actualizarEstadoTrabajo(token, estado);
      setTrabajo(actualizado);
    } catch (e) {
      console.error(e);
    } finally {
      setActualizando(false);
    }
  }

  function copiarLinkResena() {
    if (!trabajo) return;
    const link = `${window.location.origin}/resena/${trabajo.review_token}`;
    navigator.clipboard.writeText(link);
    setCopiadoLink(true);
    setTimeout(() => setCopiadoLink(false), 2500);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <i className="ri-loader-4-line animate-spin text-4xl text-[#e2b040]" />
      </div>
    );
  }

  if (error || !trabajo) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center p-6 text-center">
        <i className="ri-error-warning-line text-5xl text-gray-600 mb-4" />
        <p className="text-gray-400 text-lg mb-6">{error || 'Trabajo no encontrado'}</p>
        <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-[#e2b040] text-[#1a1a2e] rounded-xl font-bold cursor-pointer">
          Ir al inicio
        </button>
      </div>
    );
  }

  const reviewToken = trabajo.review_token;
  const vecinoWaUrl = buildWaUrl(trabajo.vecino_telefono, `Hola ${trabajo.vecino_nombre}! Te escribo por tu consulta en MrServicios.`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e]">
      <AppHeader />

      <div className="max-w-xl mx-auto px-4 pt-24 pb-16 space-y-5">
        <div>
          <h1 className="text-white font-bold text-2xl">Trabajo con {trabajo.vecino_nombre}</h1>
          <p className="text-gray-400 text-sm mt-1">
            Contacto recibido el {formatFechaTrabajo(trabajo.created_at)} · Estado actual:{' '}
            <span className="text-[#e2b040] font-semibold">{TRABAJO_ESTADO_LABELS[trabajo.estado]}</span>
          </p>
        </div>

        {/* Datos del vecino */}
        <div className="bg-[#16213e] border border-[#e2b040]/20 rounded-2xl p-5 space-y-3">
          <div>
            <label className="block text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Vecino</label>
            <p className="text-white text-base">{trabajo.vecino_nombre}</p>
          </div>
          <div>
            <label className="block text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Servicio</label>
            <p className="text-white text-base capitalize">{trabajo.categoria || '—'}</p>
          </div>
          {trabajo.servicio_descripcion && (
            <div>
              <label className="block text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Detalle</label>
              <p className="text-gray-300 text-sm leading-relaxed">{trabajo.servicio_descripcion}</p>
            </div>
          )}
          <a
            href={vecinoWaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#1da851] text-white rounded-xl text-sm font-bold transition-colors"
          >
            <i className="ri-whatsapp-line" />
            Escribirle por WhatsApp
          </a>
        </div>

        {/* Estados */}
        <div className="bg-[#16213e] border border-[#e2b040]/20 rounded-2xl p-5">
          <h2 className="text-white font-bold text-base mb-1">Actualizar estado</h2>
          <p className="text-gray-500 text-xs mb-4">
            Actualizar esto te ayuda a aparecer más arriba y recibir más contactos.
          </p>
          <TrabajoEstadoButtons
            estadoActual={trabajo.estado}
            onCambiarEstado={handleCambiarEstado}
            actualizando={actualizando}
          />
        </div>

        {/* Pedido de reseña, solo cuando ya está terminado */}
        {trabajo.estado === 'terminado' && reviewToken && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5">
            <h2 className="text-green-400 font-bold text-base mb-2 flex items-center gap-2">
              <i className="ri-star-line" />
              Pedile la reseña a {trabajo.vecino_nombre}
            </h2>
            <p className="text-gray-300 text-sm mb-4">
              Las reseñas ayudan a que más vecinos te contacten. Copiá el mensaje o abrí WhatsApp directo.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={copiarLinkResena}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm transition-colors cursor-pointer"
              >
                <i className={copiadoLink ? 'ri-check-line text-green-400' : 'ri-link-m'} />
                {copiadoLink ? 'Link copiado' : 'Copiar link de reseña'}
              </button>
              <a
                href={buildWaUrl(
                  trabajo.vecino_telefono,
                  mensajePedidoResena({
                    nombre: trabajo.vecino_nombre,
                    prestador: `${trabajo.prestadores?.nombre ?? ''} ${trabajo.prestadores?.apellido ?? ''}`.trim(),
                    link: `${window.location.origin}/resena/${reviewToken}`,
                  })
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#25D366] hover:bg-[#1da851] text-white rounded-xl text-sm font-bold transition-colors"
              >
                <i className="ri-whatsapp-line" />
                Enviar por WhatsApp
              </a>
            </div>
          </div>
        )}

        {trabajo.estado === 'no_avanzo' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
            <p className="text-gray-400 text-sm">
              Este trabajo quedó marcado como "No avanzó". No pasa nada, es normal que no todo cierre.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
