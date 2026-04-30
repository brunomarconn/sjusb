import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

interface RegistroUsuarioProps {
  onRegistroExitoso: (dni: string) => void;
  onCambiarALogin: () => void;
}

export default function RegistroUsuario({ onRegistroExitoso, onCambiarALogin }: RegistroUsuarioProps) {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [confirmarDni, setConfirmarDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const dniLimpio = dni.trim();
    const confirmarDniLimpio = confirmarDni.trim();
    const telefonoLimpio = telefono.replace(/\D/g, '');

    if (!nombre.trim() || !apellido.trim() || !dniLimpio || !confirmarDniLimpio || !telefonoLimpio) {
      setError('Completá todos los campos obligatorios');
      return;
    }

    if (!/^\d{7,8}$/.test(dniLimpio)) {
      setError('El DNI debe tener 7 u 8 dígitos numéricos');
      return;
    }

    if (dniLimpio !== confirmarDniLimpio) {
      setError('Los DNI no coinciden');
      return;
    }

    if (telefonoLimpio.length < 10) {
      setError('Ingresá un número de teléfono válido');
      return;
    }

    setCargando(true);

    try {
      const { data: existente } = await supabase
        .from('clientes')
        .select('dni')
        .eq('dni', dniLimpio)
        .maybeSingle();

      if (existente) {
        setError('Este DNI ya está registrado. Iniciá sesión.');
        setCargando(false);
        return;
      }

      const payload = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: dniLimpio,
        telefono: telefonoLimpio,
        password: dniLimpio,
        puntos: 0,
        tiene_promocion: false,
      };

      const { error: insertError } = await supabase
        .from('clientes')
        .insert([payload]);

      if (insertError) throw insertError;

      onRegistroExitoso(dniLimpio);
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

        <div className="bg-[#16213e]/80 backdrop-blur-sm rounded-2xl border border-[#e2b040]/20 p-5 sm:p-8">
          <div className="text-center mb-9">
            <div className="w-16 h-16 bg-gradient-to-br from-[#e2b040] to-[#f0d080] rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-user-add-line text-2xl text-[#1a1a2e]"></i>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Crear Cuenta</h2>
            <p className="text-gray-400 text-sm">Registrate y empezá a acumular puntos</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-5 text-sm flex items-center gap-2">
              <i className="ri-error-warning-line"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors"
                  placeholder="Juan"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Apellido <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors"
                  placeholder="Pérez"
                  required
                />
              </div>
            </div>

            <div className="px-4 sm:px-5 py-4 sm:py-5 bg-[#e2b040]/10 border border-[#e2b040]/25 rounded-lg text-xs sm:text-sm text-[#f0d080] leading-relaxed">
              <div className="flex items-start gap-2.5 mb-5">
                <i className="ri-shield-keyhole-line text-[#e2b040] text-base shrink-0 mt-0.5"></i>
                <span>
                  <strong>Tu DNI será tu usuario y contraseña</strong> para ingresar al sistema. No necesitás recordar nada más.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    DNI <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors"
                    placeholder="Número de DNI"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirmar DNI <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={confirmarDni}
                    onChange={(e) => setConfirmarDni(e.target.value)}
                    className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors"
                    placeholder="Repetí tu DNI"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Número de teléfono <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                inputMode="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors"
                placeholder="5493512345678"
                required
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3.5 bg-gradient-to-r from-[#e2b040] to-[#f0d080] text-[#1a1a2e] rounded-lg font-bold hover:shadow-lg hover:shadow-[#e2b040]/30 transition-all duration-300 disabled:opacity-60 whitespace-nowrap cursor-pointer"
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

          <p className="text-center text-gray-400 text-sm mt-8">
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
