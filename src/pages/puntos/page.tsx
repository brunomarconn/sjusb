import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Cliente {
  email: string;
  puntos: number;
  tiene_promocion: boolean;
}

export default function Puntos() {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [cargando, setCargando] = useState(true);

  const clienteEmail = localStorage.getItem('mservicios_cliente_email');

  useEffect(() => {
    if (!clienteEmail) {
      navigate('/mi-cuenta');
      return;
    }
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    if (!clienteEmail) return;
    setCargando(true);
    try {
      const { data } = await supabase
        .from('clientes')
        .select('email, puntos, tiene_promocion')
        .eq('email', clienteEmail)
        .maybeSingle();
      if (data) setCliente(data);
    } catch (_) {
      // fallback
      setCliente({ email: clienteEmail, puntos: 0, tiene_promocion: false });
    } finally {
      setCargando(false);
    }
  };

  const puntosParaPromo = 10;

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] flex items-center justify-center">
        <div className="inline-block w-12 h-12 border-4 border-[#e2b040]/30 border-t-[#e2b040] rounded-full animate-spin"></div>
      </div>
    );
  }

  const puntos = cliente?.puntos ?? 0;
  const progreso = Math.min((puntos / puntosParaPromo) * 100, 100);
  const tienePromo = (cliente?.tiene_promocion || puntos >= puntosParaPromo);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e]">
      {/* Header */}
      <header className="bg-[#16213e]/95 backdrop-blur-sm shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img
              src="https://public.readdy.ai/ai/img_res/ebf8ba70-3b01-48d0-b580-89cd2fe53a3e.png"
              alt="MServicios"
              className="w-9 h-9 object-contain"
            />
            <span className="text-xl font-bold text-[#e2b040]">MServicios</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/usuarios')}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#e2b040] text-[#1a1a2e] rounded-full text-sm font-semibold hover:bg-[#f0d080] transition-all cursor-pointer whitespace-nowrap"
            >
              <i className="ri-search-line"></i>
              Buscar Prestadores
            </button>
            <button
              onClick={() => navigate('/mi-cuenta')}
              className="flex items-center gap-1.5 px-4 py-2 bg-transparent border border-[#e2b040]/40 text-[#e2b040] rounded-full text-sm font-semibold hover:bg-[#e2b040]/10 transition-all cursor-pointer whitespace-nowrap"
            >
              <i className="ri-user-line"></i>
              Mi Cuenta
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Hero card */}
        <div className={`rounded-3xl p-8 mb-8 text-center ${tienePromo
          ? 'bg-gradient-to-br from-[#e2b040] to-[#f0d080]'
          : 'bg-gradient-to-br from-[#16213e] to-[#1a1a2e] border border-[#e2b040]/30'
        }`}>
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${tienePromo ? 'bg-[#1a1a2e]/20' : 'bg-[#e2b040]/20'}`}>
            {tienePromo ? (
              <i className="ri-gift-2-line text-4xl text-[#1a1a2e]"></i>
            ) : (
              <i className="ri-medal-line text-4xl text-[#e2b040]"></i>
            )}
          </div>

          {tienePromo ? (
            <>
              <h1 className="text-3xl font-bold text-[#1a1a2e] mb-2">¡Felicitaciones!</h1>
              <p className="text-[#1a1a2e]/80 text-lg mb-4">Tenés un descuento disponible</p>
              <div className="bg-[#1a1a2e]/15 rounded-2xl p-6 inline-block">
                <span className="text-6xl font-black text-[#1a1a2e]">20%</span>
                <p className="text-[#1a1a2e] font-bold text-lg mt-1">OFF en tu próximo servicio</p>
              </div>
              <p className="text-[#1a1a2e]/70 text-sm mt-4">
                Mencionalo al contratar con cualquier prestador de MServicios
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-white mb-2">Mis Puntos</h1>
              <p className="text-gray-400 mb-6">Seguí contactando prestadores para acumular</p>
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className="text-7xl font-black text-[#e2b040]">{puntos}</span>
                <span className="text-gray-400 text-xl">/ {puntosParaPromo}</span>
              </div>
              <p className="text-gray-400 text-sm mb-6">puntos acumulados</p>

              {/* Progress bar */}
              <div className="w-full bg-[#1a1a2e] rounded-full h-4 mb-3">
                <div
                  className="bg-gradient-to-r from-[#e2b040] to-[#f0d080] h-4 rounded-full transition-all duration-700"
                  style={{ width: `${progreso}%` }}
                ></div>
              </div>
              <p className="text-[#e2b040] text-sm">
                Te faltan <strong>{puntosParaPromo - puntos}</strong> {puntosParaPromo - puntos === 1 ? 'contacto' : 'contactos'} para tu 20% de descuento
              </p>
            </>
          )}
        </div>

        {/* How it works */}
        <div className="bg-[#16213e]/80 backdrop-blur-sm rounded-2xl border border-[#e2b040]/20 p-8 mb-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <i className="ri-question-line text-[#e2b040]"></i>
            ¿Cómo funcionan los puntos?
          </h2>

          <div className="space-y-5">
            {[
              {
                num: '1',
                icon: 'ri-whatsapp-line',
                title: 'Contactá un prestador',
                desc: 'Hacé clic en "Contactar por WhatsApp" en la página de prestadores',
                color: 'bg-green-500/20 text-green-400'
              },
              {
                num: '2',
                icon: 'ri-add-circle-line',
                title: 'Acumulás 1 punto',
                desc: 'Cada contacto te suma automáticamente 1 punto a tu cuenta',
                color: 'bg-[#e2b040]/20 text-[#e2b040]'
              },
              {
                num: '3',
                icon: 'ri-gift-2-line',
                title: '10 puntos = 20% de descuento',
                desc: 'Al llegar a 10 puntos desbloqueás un 20% de descuento en tu próximo servicio',
                color: 'bg-purple-500/20 text-purple-400'
              },
              {
                num: '4',
                icon: 'ri-coupon-line',
                title: 'Usá tu descuento',
                desc: 'Mostrá esta página al prestador al momento de contratar el servicio',
                color: 'bg-blue-500/20 text-blue-400'
              },
            ].map((step) => (
              <div key={step.num} className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${step.color}`}>
                  <i className={`${step.icon} text-lg`}></i>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{step.title}</p>
                  <p className="text-gray-400 text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Account info */}
        <div className="bg-[#16213e]/80 backdrop-blur-sm rounded-2xl border border-[#e2b040]/20 p-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#e2b040]/20 rounded-xl flex items-center justify-center">
              <i className="ri-user-line text-[#e2b040]"></i>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Cuenta</p>
              <p className="text-white font-medium text-sm">{cliente?.email}</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate('/usuarios')}
          className="w-full py-4 bg-gradient-to-r from-[#e2b040] to-[#f0d080] text-[#1a1a2e] rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-[#e2b040]/30 transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
        >
          <i className="ri-search-line text-xl"></i>
          {tienePromo ? 'Ir a contactar un prestador' : 'Seguir acumulando puntos'}
        </button>
      </div>
    </div>
  );
}
