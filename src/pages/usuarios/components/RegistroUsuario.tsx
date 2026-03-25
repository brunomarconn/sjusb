import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

interface RegistroUsuarioProps {
  onRegistroExitoso: (clienteEmail: string) => void;
  onCambiarALogin: () => void;
}

const soloLetrasYNumeros = /^[a-zA-Z0-9]+$/;

export default function RegistroUsuario({ onRegistroExitoso, onCambiarALogin }: RegistroUsuarioProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim() || !confirmar.trim()) {
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

    if (password !== confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setCargando(true);

    try {
      const { data: existente } = await supabase
        .from('clientes')
        .select('email')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (existente) {
        setError('Este email ya está registrado. Iniciá sesión.');
        setCargando(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('clientes')
        .insert([{
          email: email.trim().toLowerCase(),
          password,
          puntos: 0,
          tiene_promocion: false,
        }]);

      if (insertError) throw insertError;

      onRegistroExitoso(email.trim().toLowerCase());
    } catch (e) {
      console.error('Error al registrar:', e);
      setError('Error al crear la cuenta. Intentá nuevamente.');
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
              <i className="ri-user-add-line text-2xl text-[#1a1a2e]"></i>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Crear Cuenta</h2>
            <p className="text-gray-400 text-sm">Registrate y empezá a acumular puntos</p>
          </div>

          {/* Points info banner */}
          <div className="flex items-center gap-2 px-4 py-3 bg-[#e2b040]/10 border border-[#e2b040]/20 rounded-lg mb-6 text-sm text-[#f0d080]">
            <i className="ri-medal-line text-[#e2b040] text-base shrink-0"></i>
            <span>Cada contacto suma 1 punto. ¡Con 10 puntos obtenés un 20% de descuento!</span>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
              <i className="ri-error-warning-line"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contraseña <span className="text-gray-500 text-xs">(mín. 5 caracteres, sin símbolos)</span>
              </label>
              <div className="relative">
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors pr-12"
                  placeholder="Mínimo 5 caracteres"
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

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirmar contraseña</label>
              <input
                type={mostrarPassword ? 'text' : 'password'}
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors"
                placeholder="Repetí la contraseña"
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
                  <i className="ri-loader-4-line animate-spin"></i> Creando cuenta...
                </span>
              ) : (
                'Crear cuenta'
              )}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            ¿Ya tenés cuenta?{' '}
            <button
              onClick={onCambiarALogin}
              className="text-[#e2b040] hover:text-[#f0d080] font-semibold cursor-pointer"
            >
              Iniciar sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
