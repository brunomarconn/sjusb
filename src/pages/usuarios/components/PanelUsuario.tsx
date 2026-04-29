import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

interface Cliente {
  dni: string;
  puntos: number;
  tiene_promocion: boolean;
}

interface PanelUsuarioProps {
  clienteDni: string;
  onCerrarSesion: () => void;
}

export default function PanelUsuario({ clienteDni, onCerrarSesion }: PanelUsuarioProps) {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarDatosCliente();
  }, [clienteDni]);

  const cargarDatosCliente = async () => {
    setCargando(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('clientes')
        .select('dni, puntos, tiene_promocion')
        .eq('dni', clienteDni)
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

  const puntosParaPromo = 5;
  const progreso = Math.min((cliente.puntos / puntosParaPromo) * 100, 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e]">
      {/* Header */}
      <header className="bg-[#16213e]/95 backdrop-blur-sm shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img
              src="https://public.readdy.ai/ai/img_res/ebf8ba70-3b01-48d0-b580-89cd2fe53a3e.png"
              alt="ServiciosYa"
              className="w-9 h-9 object-contain"
            />
            <span className="text-base font-bold text-[#e2b040] hidden sm:block">ServiciosYa</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/puntos')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e2b040]/10 border border-[#e2b040]/40 text-[#e2b040] rounded-full text-xs font-semibold hover:bg-[#e2b040]/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <i className="ri-medal-line"></i>
              {cliente.puntos} Puntos
            </button>
            <button
              onClick={() => navigate('/usuarios')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e2b040] text-[#1a1a2e] rounded-full text-xs font-bold hover:bg-[#f0d080] transition-all cursor-pointer whitespace-nowrap"
            >
              <i className="ri-search-line"></i>
              <span className="hidden sm:inline">Buscar</span>
            </button>
            <button
              onClick={handleCerrarSesion}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent border border-red-400/50 text-red-400 rounded-full text-xs font-semibold hover:bg-red-400/10 transition-all cursor-pointer whitespace-nowrap"
            >
              <i className="ri-logout-box-line"></i>
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-[#e2b040] to-[#f0d080] rounded-2xl p-8 mb-8 text-[#1a1a2e]">
          <h1 className="text-3xl font-bold mb-1">¡Bienvenido!</h1>
          <p className="text-[#1a1a2e]/70 text-sm mb-3">DNI: {cliente.dni}</p>
          <p className="text-lg font-medium">Explorá nuestros prestadores y acumulá puntos</p>
        </div>

        {/* Points card */}
        <div className="bg-[#16213e]/80 backdrop-blur-sm rounded-2xl border border-[#e2b040]/20 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Tus Puntos</h2>
              <p className="text-gray-400 text-sm">Los puntos se cargan tras cada trabajo finalizado</p>
            </div>
            <div className="w-16 h-16 bg-[#e2b040]/20 rounded-full flex items-center justify-center">
              <i className="ri-medal-line text-[#e2b040] text-3xl"></i>
            </div>
          </div>

          <div className="flex items-end gap-2 mb-4">
            <span className="text-6xl font-bold text-[#e2b040]">{cliente.puntos}</span>
            <span className="text-gray-400 mb-2">/ {puntosParaPromo} puntos</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[#1a1a2e] rounded-full h-3 mb-2">
            <div
              className="bg-gradient-to-r from-[#e2b040] to-[#f0d080] h-3 rounded-full transition-all duration-500"
              style={{ width: `${progreso}%` }}
            ></div>
          </div>
          <p className="text-gray-500 text-xs">
            {cliente.puntos < puntosParaPromo
              ? `Te faltan ${puntosParaPromo - cliente.puntos} puntos para obtener el 10% de descuento`
              : '¡Llegaste a 5 puntos! En tu próximo contacto se canjeará automáticamente el 10% de descuento'}
          </p>

          {(cliente.tiene_promocion || cliente.puntos >= puntosParaPromo) && (
            <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
                <i className="ri-gift-2-line text-green-400 text-2xl"></i>
              </div>
              <div>
                <p className="text-green-400 font-bold text-lg">¡10% de descuento disponible!</p>
                <p className="text-gray-400 text-sm">Al próximo contacto por WhatsApp se solicitará el canje automáticamente.</p>
              </div>
            </div>
          )}
        </div>

        {/* How points work */}
        <div className="bg-[#16213e]/80 backdrop-blur-sm rounded-2xl border border-[#e2b040]/20 p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">¿Cómo funcionan los puntos?</h2>
          <div className="space-y-3 text-gray-400 text-sm">
            <p className="flex items-start gap-3">
              <i className="ri-checkbox-circle-fill text-[#e2b040] mt-0.5 shrink-0"></i>
              <span>Nuestro equipo te carga <strong className="text-white">1 punto</strong> por cada trabajo finalizado con un prestador</span>
            </p>
            <p className="flex items-start gap-3">
              <i className="ri-checkbox-circle-fill text-[#e2b040] mt-0.5 shrink-0"></i>
              <span>Al llegar a <strong className="text-white">5 puntos</strong> desbloqueás un <strong className="text-[#e2b040]">10% de descuento</strong> en tu próximo servicio</span>
            </p>
            <p className="flex items-start gap-3">
              <i className="ri-checkbox-circle-fill text-[#e2b040] mt-0.5 shrink-0"></i>
              <span>El descuento se solicita automáticamente al contactar por WhatsApp y tus puntos se reinician</span>
            </p>
          </div>
        </div>

        {/* Search button */}
        <div className="text-center">
          <button
            onClick={() => navigate('/usuarios')}
            className="px-8 py-4 bg-gradient-to-r from-[#e2b040] to-[#f0d080] text-[#1a1a2e] rounded-full font-bold text-base hover:shadow-lg hover:shadow-[#e2b040]/30 transition-all whitespace-nowrap cursor-pointer inline-flex items-center gap-2"
          >
            <i className="ri-search-line text-lg"></i>
            Buscar Prestadores
          </button>
        </div>
      </div>
    </div>
  );
}
