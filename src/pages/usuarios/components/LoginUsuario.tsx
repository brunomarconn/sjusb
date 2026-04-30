import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

interface LoginUsuarioProps {
  onLoginExitoso: (dni: string) => void;
  onCambiarARegistro: () => void;
}

export default function LoginUsuario({ onLoginExitoso, onCambiarARegistro }: LoginUsuarioProps) {
  const navigate = useNavigate();
  const [dni, setDni] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const dniLimpio = dni.trim();

    if (!dniLimpio) {
      setError('Ingresá tu DNI');
      return;
    }

    if (!/^\d{7,8}$/.test(dniLimpio)) {
      setError('El DNI debe tener 7 u 8 dígitos numéricos');
      return;
    }

    const password = dniLimpio;

    setCargando(true);

    try {
      const { data, error: err } = await supabase
        .from('clientes')
        .select('dni, password, puntos, tiene_promocion')
        .eq('dni', dniLimpio)
        .maybeSingle();

      if (err) throw err;

      if (!data) {
        setError('DNI no registrado. ¿Querés crear una cuenta?');
        setCargando(false);
        return;
      }

      if (data.password && data.password !== password) {
        setError('No pudimos ingresar con ese DNI');
        setCargando(false);
        return;
      }

      onLoginExitoso(data.dni);
    } catch (e) {
      console.error('Error al iniciar sesión:', e);
      setError('Error al iniciar sesión. Intentá nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[#e2b040] hover:text-[#f0d080] transition-colors mb-6 cursor-pointer"
        >
          <i className="ri-arrow-left-line"></i>
          <span className="text-sm">Volver al inicio</span>
        </button>

        <div className="bg-[#16213e]/80 backdrop-blur-sm rounded-2xl border border-[#e2b040]/20 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#e2b040] to-[#f0d080] rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-user-line text-2xl text-[#1a1a2e]"></i>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Iniciar Sesión</h2>
            <p className="text-gray-400 text-sm">Ingresá con tu DNI</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
              <i className="ri-error-warning-line"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">DNI</label>
              <input
                type="text"
                inputMode="numeric"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors"
                placeholder="Tu número de DNI"
                required
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 bg-gradient-to-r from-[#e2b040] to-[#f0d080] text-[#1a1a2e] rounded-lg font-bold hover:shadow-lg hover:shadow-[#e2b040]/30 transition-all duration-300 disabled:opacity-60 whitespace-nowrap cursor-pointer"
            >
              {cargando ? (
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
              onClick={onCambiarARegistro}
              className="text-[#e2b040] hover:text-[#f0d080] font-semibold cursor-pointer"
            >
              Registrate gratis
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
