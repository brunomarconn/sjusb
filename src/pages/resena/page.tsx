// ─────────────────────────────────────────────────────────────
// Página de reseña del vecino, sin login.
// URL: /resena/:token
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppHeader from '../../components/AppHeader';
import { resenasApi, type ContextoResena } from '../../api/resenasApi';

export default function ResenaPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [contexto, setContexto] = useState<ContextoResena | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [puntuacion, setPuntuacion] = useState(5);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(false);

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
      const data = await resenasApi.obtenerContexto(token);
      setContexto(data);
    } catch (e) {
      console.error(e);
      setError('No encontramos ese trabajo. Verificá el link.');
    } finally {
      setLoading(false);
    }
  }

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setEnviando(true);
    try {
      await resenasApi.crearResena(token, puntuacion, comentario.trim() || undefined);
      setEnviada(true);
    } catch (e) {
      console.error(e);
      setError('No pudimos enviar tu reseña. Probá de nuevo en unos minutos.');
    } finally {
      setEnviando(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <i className="ri-loader-4-line animate-spin text-4xl text-[#e2b040]" />
      </div>
    );
  }

  if (error || !contexto) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center p-6 text-center">
        <i className="ri-error-warning-line text-5xl text-gray-600 mb-4" />
        <p className="text-gray-400 text-lg mb-6">{error || 'No encontramos esta reseña'}</p>
        <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-[#e2b040] text-[#1a1a2e] rounded-xl font-bold cursor-pointer">
          Ir al inicio
        </button>
      </div>
    );
  }

  const nombrePrestador = `${contexto.prestador_nombre ?? ''} ${contexto.prestador_apellido ?? ''}`.trim();

  if (enviada || contexto.ya_enviada) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e]">
        <AppHeader />
        <div className="max-w-md mx-auto px-4 pt-32 pb-16 text-center">
          <i className="ri-checkbox-circle-fill text-6xl text-green-400 mb-4 block" />
          <h1 className="text-white font-bold text-2xl mb-2">¡Gracias por tu reseña!</h1>
          <p className="text-gray-400 text-sm">
            Tu opinión ayuda a otros vecinos de San Isidro a elegir mejor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e]">
      <AppHeader />

      <div className="max-w-md mx-auto px-4 pt-24 pb-16">
        <form
          onSubmit={handleEnviar}
          className="bg-[#16213e] border border-[#e2b040]/20 rounded-2xl p-6 space-y-5"
        >
          <div className="text-center">
            <h1 className="text-white font-bold text-xl mb-1">
              ¿Cómo te fue con {nombrePrestador || 'el prestador'}?
            </h1>
            <p className="text-gray-400 text-sm">
              Dejá tu opinión en 10 segundos y ayudá a otros vecinos de San Isidro a elegir mejor.
            </p>
          </div>

          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setPuntuacion(star)}
                className="cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={`${star} estrellas`}
              >
                <i className={`text-4xl ${star <= puntuacion ? 'ri-star-fill text-[#e2b040]' : 'ri-star-line text-gray-600'}`} />
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Comentario (opcional)</label>
            <textarea
              value={comentario}
              onChange={(e) => { if (e.target.value.length <= 500) setComentario(e.target.value); }}
              maxLength={500}
              rows={4}
              className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors resize-none"
              placeholder="Contá cómo te fue..."
              style={{ fontSize: '16px' }}
            />
            <p className="text-gray-500 text-xs mt-1 text-right">{comentario.length}/500</p>
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full py-4 bg-gradient-to-r from-[#e2b040] to-[#f0d080] text-[#1a1a2e] rounded-xl font-bold hover:shadow-lg hover:shadow-[#e2b040]/50 transition-all cursor-pointer disabled:opacity-50"
          >
            {enviando ? 'Enviando...' : 'Enviar reseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
