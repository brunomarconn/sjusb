import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

interface LoginPrestadorProps {
  onLoginExitoso: (dni: string) => void;
  onIrRegistro: () => void;
}

const soloLetrasYNumeros = /^[a-zA-Z0-9]+$/;

export default function LoginPrestador({ onLoginExitoso, onIrRegistro }: LoginPrestadorProps) {
  const navigate = useNavigate();
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarOlvide, setMostrarOlvide] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!dni.trim() || !password.trim()) {
      setError('Completá todos los campos');
      return;
    }

    if (password.length < 5) {
      setError('La contraseña debe tener al menos 5 caracteres');
      return;
    }

    if (!soloLetrasYNumeros.test(password)) {
      setError('La contraseña no puede tener caracteres especiales');
      return;
    }

    setLoading(true);

    try {
      const { data: prestador, error: queryError } = await supabase
        .from('prestadores')
        .select('dni, password')
        .eq('dni', dni.trim())
        .maybeSingle();

      if (queryError) throw queryError;

      if (!prestador) {
        setError('DNI no encontrado. ¿Querés registrarte?');
        setLoading(false);
        return;
      }

      if (prestador.password !== password) {
        setError('Contraseña incorrecta');
        setLoading(false);
        return;
      }

      onLoginExitoso(dni.trim());
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setError('Error al iniciar sesión. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419] flex items-center justify-center p-4">
      <div className="bg-[#16213e]/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-md border border-[#e2b040]/20">

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
          <p className="text-gray-400">Accedé como prestador de servicios</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-5 text-sm flex items-center gap-2">
            <i className="ri-error-warning-line"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">DNI</label>
            <input
              type="text"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors"
              placeholder="Tu número de DNI"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Contraseña</label>
            <div className="relative">
              <input
                type={mostrarPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors pr-12"
                placeholder="Tu contraseña"
                required
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#e2b040] cursor-pointer"
              >
                <i className={mostrarPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <div className="text-right">
            <button
              type="button"
              onClick={() => setMostrarOlvide(!mostrarOlvide)}
              className="text-sm text-gray-400 hover:text-[#e2b040] transition-colors cursor-pointer"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {mostrarOlvide && (
            <div className="bg-[#e2b040]/10 border border-[#e2b040]/30 rounded-lg px-4 py-3 text-sm text-[#f0d080] flex items-start gap-2">
              <i className="ri-mail-line mt-0.5 shrink-0"></i>
              <span>Contactanos a <strong>mrsserviciossoluciones@gmail.com</strong> y te ayudamos a recuperar tu acceso.</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#e2b040] to-[#f0d080] text-[#1a1a2e] py-3 rounded-lg font-bold hover:shadow-lg hover:shadow-[#e2b040]/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <i className="ri-loader-4-line animate-spin"></i> Ingresando...
              </span>
            ) : (
              'Ingresar'
            )}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          ¿No tenés cuenta?{' '}
          <button
            type="button"
            onClick={onIrRegistro}
            className="text-[#e2b040] hover:text-[#f0d080] font-semibold cursor-pointer"
          >
            Registrate aquí
          </button>
        </p>
      </div>
    </div>
  );
}
