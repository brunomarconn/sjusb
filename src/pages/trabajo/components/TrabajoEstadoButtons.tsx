// ─────────────────────────────────────────────────────────────
// Botones grandes para actualizar el estado de un trabajo.
// Compartido entre /trabajo/:token y el panel del prestador.
// ─────────────────────────────────────────────────────────────
import {
  ESTADOS_BOTONES,
  TRABAJO_ESTADO_LABELS,
  TRABAJO_ESTADO_COLORS,
  esTransicionValida,
  type TrabajoEstado,
} from '../../../types/trabajo';

interface Props {
  estadoActual: TrabajoEstado;
  onCambiarEstado: (estado: TrabajoEstado) => void;
  actualizando?: boolean;
}

export default function TrabajoEstadoButtons({ estadoActual, onCambiarEstado, actualizando }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {ESTADOS_BOTONES.map(({ estado, icono }) => {
        const activo = estadoActual === estado;
        const habilitado = esTransicionValida(estadoActual, estado);

        return (
          <button
            key={estado}
            type="button"
            disabled={!habilitado || activo || actualizando}
            onClick={() => onCambiarEstado(estado)}
            className={`flex items-center justify-center gap-2 py-4 px-3 rounded-xl font-bold text-sm transition-colors min-h-[56px] ${
              activo
                ? `${TRABAJO_ESTADO_COLORS[estado]} cursor-default ring-2 ring-inset ring-current`
                : habilitado
                ? 'bg-[#e2b040] text-[#1a1a2e] hover:bg-[#f0d080] cursor-pointer'
                : 'bg-white/5 text-gray-600 cursor-not-allowed'
            }`}
          >
            <i className={icono} />
            {TRABAJO_ESTADO_LABELS[estado]}
            {activo && <i className="ri-check-line ml-1" />}
          </button>
        );
      })}
    </div>
  );
}
