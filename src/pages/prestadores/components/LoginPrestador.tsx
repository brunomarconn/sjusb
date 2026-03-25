import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

interface LoginPrestadorProps {
  onLoginExitoso: (dni: string) => void;
  onIrRegistro: () => void;
}

export default function LoginPrestador({ onLoginExitoso, onIrRegistro }: LoginPrestadorProps) {
  const navigate = useNavigate();
  const [dni, setDni] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: prestador, error: queryError } = await supabase
        .from('prestadores')
        .select('*')
        .eq('dni', dni)
        .maybeSingle();

      if (queryError) throw queryError;

      if (!prestador) {
        setError('DNI no encontrado');
        setLoading(false);
        return;
      }

      onLoginExitoso(dni);
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setError('Error al iniciar sesión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419] flex items-center justify-center p-4">
      <div className="bg-[#16213e]/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-md border border-[#e2b040]/20">

        {/* Botón volver */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-[#e2b040] transition-colors mb-6 cursor-pointer"
        >
          <i className="ri-arrow-left-line"></i>
          <span className="text-sm">Volver al inicio</span>
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#e2b040] to-[#f0d080] rounded-xl mb-4">
            <i className="ri-briefcase-line text-3xl text-[#1a1a2e]"></i>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Iniciar Sesión</h2>
          <p className="text-gray-400">Accede como prestador</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              DNI
            </label>
            <input
              type="text"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors"
              placeholder="Tu DNI"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#e2b040] to-[#f0d080] text-[#1a1a2e] py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-[#e2b040]/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>

          <button
            type="button"
            onClick={onIrRegistro}
            className="w-full text-[#e2b040] hover:text-[#f0d080] transition-colors text-sm whitespace-nowrap"
          >
            ¿No tienes cuenta? Regístrate
          </button>
        </form>
      </div>
    </div>
  );
}