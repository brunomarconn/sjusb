
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e]">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Bienvenido a MServicios</h1>
        <button 
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-[#e2b040] text-[#1a1a2e] rounded-full font-bold hover:bg-[#f0d080] transition-all duration-300 whitespace-nowrap cursor-pointer"
        >
          Ir al Inicio
        </button>
      </div>
    </div>
  );
}
