import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

interface RegistroUsuarioProps {
  onRegistroExitoso: (clienteId: string) => void;
  onCambiarALogin: () => void;
}

export default function RegistroUsuario({ onRegistroExitoso, onCambiarALogin }: RegistroUsuarioProps) {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nombre.trim() || !apellido.trim() || !dni.trim()) {
      setError('Por favor completá todos los campos');
      return;
    }

    // Validar que el DNI sea numérico
    if (!/^\d+$/.test(dni.trim())) {
      setError('El DNI debe contener solo números');
      return;
    }

    if (dni.trim().length < 7 || dni.trim().length > 8) {
      setError('El DNI debe tener 7 u 8 dígitos');
      return;
    }

    setCargando(true);

    try {
      // Verificar si el DNI ya existe
      const { data: existente } = await supabase
        .from('clientes')
        .select('dni')
        .eq('dni', dni.trim())
        .maybeSingle();

      if (existente) {
        setError('Este DNI ya está registrado');
        setCargando(false);
        return;
      }

      // Crear nuevo cliente
      const { data, error: insertError } = await supabase
        .from('clientes')
        .insert([{
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          dni: dni.trim(),
          puntos: 0,
          tiene_promocion: false,
          email: `${dni.trim()}@mservicios.com`
        }])
        .select('id')
        .single();

      if (insertError) throw insertError;

      onRegistroExitoso(data.id);
    } catch (e) {
      console.error('Error al registrar usuario:', e);
      setError('Error al crear la cuenta. Intentá nuevamente.');
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
            <p className="text-gray-400 text-sm">Registrate para acumular puntos</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
              <i className="ri-error-warning-line"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors text-sm"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Apellido
              </label>
              <input
                type="text"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors text-sm"
                placeholder="Tu apellido"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                DNI
              </label>
              <input
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors text-sm"
                placeholder="Tu número de DNI"
                maxLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 bg-gradient-to-r from-[#e2b040] to-[#f0d080] text-[#1a1a2e] rounded-lg font-semibold hover:shadow-lg hover:shadow-[#e2b040]/50 transition-all whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              ¿Ya tenés cuenta?{' '}
              <button
                onClick={onCambiarALogin}
                className="text-[#e2b040] hover:text-[#f0d080] font-medium cursor-pointer"
              >
                Iniciá sesión
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}