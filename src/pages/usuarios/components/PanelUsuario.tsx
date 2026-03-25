import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  puntos: number;
  tiene_promocion: boolean;
}

interface PanelUsuarioProps {
  clienteId: string;
  onCerrarSesion: () => void;
}

export default function PanelUsuario({ clienteId, onCerrarSesion }: PanelUsuarioProps) {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarDatosCliente();
  }, [clienteId]);

  const cargarDatosCliente = async () => {
    setCargando(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('clientes')
        .select('id, nombre, apellido, dni, puntos, tiene_promocion')
        .eq('id', clienteId)
        .single();

      if (err) throw err;
      setCliente(data);
    } catch (e) {
      console.error('Error al cargar datos del cliente:', e);
      setError('Error al cargar tus datos');
    } finally {
      setCargando(false);
    }
  };

  const handleCerrarSesion = () => {
    if (window.confirm('¿Estás seguro que querés cerrar sesión?')) {
      onCerrarSesion();
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#e2b040]/30 border-t-[#e2b040] rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !cliente) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] flex items-center justify-center p-6">
        <div className="text-center">
          <i className="ri-error-warning-line text-5xl text-red-400 mb-4 block"></i>
          <p className="text-red-400 text-lg mb-4">{error || 'No se encontraron datos'}</p>
          <button
            onClick={onCerrarSesion}
            className="px-6 py-2 bg-[#e2b040] text-[#1a1a2e] rounded-lg font-semibold hover:bg-[#f0d080] transition-colors cursor-pointer whitespace-nowrap"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e]">
      {/* Header */}
      <header className="bg-[#16213e]/95 backdrop-blur-sm shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-[#e2b040] to-[#f0d080] rounded-xl">
              <i className="ri-user-line text-xl text-[#1a1a2e]"></i>
            </div>
            <span className="text-2xl font-bold text-[#e2b040]">Mi Cuenta</span>
          </div>
          <button
            onClick={handleCerrarSesion}
            className="flex items-center gap-2 px-5 py-2 bg-transparent border border-red-400/50 text-red-400 rounded-full font-semibold hover:bg-red-400/10 transition-all duration-300 whitespace-nowrap cursor-pointer text-sm"
          >
            <i className="ri-logout-box-line"></i>
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Bienvenida */}
        <div className="bg-gradient-to-r from-[#e2b040] to-[#f0d080] rounded-2xl p-8 mb-8 text-[#1a1a2e]">
          <h1 className="text-3xl font-bold mb-2">
            ¡Hola, {cliente.nombre}!
          </h1>
          <p className="text-lg opacity-90">
            Bienvenido a tu panel de usuario
          </p>
        </div>

        {/* Tarjeta de Puntos */}
        <div className="bg-[#16213e]/80 backdrop-blur-sm rounded-2xl border border-[#e2b040]/20 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Tus Puntos</h2>
              <p className="text-gray-400 text-sm">Acumulá puntos usando nuestros servicios</p>
            </div>
            <div className="w-16 h-16 bg-[#e2b040]/20 rounded-full flex items-center justify-center">
              <i className="ri-medal-line text-[#e2b040] text-3xl"></i>
            </div>
          </div>

          <div className="bg-[#1a1a2e]/50 rounded-xl p-6 text-center">
            <div className="text-6xl font-bold text-[#e2b040] mb-2">
              {cliente.puntos}
            </div>
            <p className="text-gray-400">puntos acumulados</p>
          </div>

          {cliente.tiene_promocion && (
            <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
              <i className="ri-gift-line text-green-400 text-2xl"></i>
              <div>
                <p className="text-green-400 font-semibold">¡Tenés una promoción disponible!</p>
                <p className="text-gray-400 text-sm">Contactanos para conocer tu descuento</p>
              </div>
            </div>
          )}
        </div>

        {/* Información de la cuenta */}
        <div className="bg-[#16213e]/80 backdrop-blur-sm rounded-2xl border border-[#e2b040]/20 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Información de la cuenta</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[#e2b040]/10">
              <span className="text-gray-400">Nombre completo</span>
              <span className="text-white font-medium">{cliente.nombre} {cliente.apellido}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[#e2b040]/10">
              <span className="text-gray-400">DNI</span>
              <span className="text-white font-medium">{cliente.dni}</span>
            </div>
          </div>
        </div>

        {/* Información sobre puntos */}
        <div className="bg-[#16213e]/80 backdrop-blur-sm rounded-2xl border border-[#e2b040]/20 p-8">
          <h2 className="text-2xl font-bold text-white mb-4">¿Cómo funcionan los puntos?</h2>
          <div className="space-y-3 text-gray-400">
            <p className="flex items-start gap-3">
              <i className="ri-checkbox-circle-fill text-[#e2b040] mt-1"></i>
              <span>Acumulás puntos cada vez que usás un servicio de nuestros prestadores</span>
            </p>
            <p className="flex items-start gap-3">
              <i className="ri-checkbox-circle-fill text-[#e2b040] mt-1"></i>
              <span>Los puntos se registran manualmente por el administrador después de confirmar el servicio</span>
            </p>
            <p className="flex items-start gap-3">
              <i className="ri-checkbox-circle-fill text-[#e2b040] mt-1"></i>
              <span>Con tus puntos podés obtener descuentos en futuros servicios</span>
            </p>
          </div>
        </div>

        {/* Botón para buscar servicios */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/usuarios')}
            className="px-8 py-3 bg-gradient-to-r from-[#e2b040] to-[#f0d080] text-[#1a1a2e] rounded-full font-semibold hover:shadow-lg hover:shadow-[#e2b040]/50 transition-all whitespace-nowrap cursor-pointer inline-flex items-center gap-2"
          >
            <i className="ri-search-line"></i>
            Buscar Servicios
          </button>
        </div>
      </div>
    </div>
  );
}