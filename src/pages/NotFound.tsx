import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 w-20 h-20 rounded-2xl bg-[#e2b040]/10 border border-[#e2b040]/20 flex items-center justify-center mx-auto">
        <i className="ri-map-pin-2-line text-4xl text-[#e2b040]" />
      </div>

      <h1 className="text-7xl sm:text-9xl font-black text-[#e2b040]/15 select-none leading-none mb-2">
        404
      </h1>

      <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
        Página no encontrada
      </h2>
      <p className="text-gray-400 text-sm sm:text-base mb-8 max-w-xs">
        La página que buscás no existe o fue movida.
      </p>

      <button
        onClick={() => navigate('/')}
        className="px-8 py-3 bg-[#e2b040] text-[#1a1a2e] rounded-xl font-bold hover:bg-[#f0d080] transition-colors cursor-pointer flex items-center gap-2"
      >
        <i className="ri-home-line" />
        Volver al inicio
      </button>
    </div>
  );
}
